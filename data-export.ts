import axios from "axios";
import Excel from "exceljs";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

interface DHIS2Config {
    baseUrl: string;
    username: string;
    password: string;
}

interface ExportConfig {
    program: string;
    attributes: string[];
    dataElements: {
        programStage: string;
        elements: string[];
    }[];
    orgUnit: string;
    startDate?: string;
    endDate?: string;
    includeOrgUnitLevels?: boolean;
    outputDir?: string; // Directory to save the file
}

interface TrackedEntityInstance {
    trackedEntityInstance: string;
    orgUnit: string;
    attributes: {
        attribute: string;
        value: string;
    }[];
    enrollments: {
        enrollment: string;
        events: {
            event: string;
            programStage: string;
            dataValues: {
                dataElement: string;
                value: string;
            }[];
        }[];
    }[];
}

interface OrgUnit {
    id: string;
    name: string;
    level: number;
    path: string;
    parent?: { id: string; name: string };
}

class DHIS2Exporter {
    private config: DHIS2Config;
    private api: any;
    private orgUnitCache: Map<string, OrgUnit> = new Map();

    constructor(config: DHIS2Config) {
        this.config = config;
        this.api = axios.create({
            baseURL: config.baseUrl,
            auth: {
                username: config.username,
                password: config.password,
            },
        });
        this.orgUnitCache = new Map();
    }

    private async fetchMetadata(program: string): Promise<any> {
        const { data } = await this.api.get("/api/programs/" + program, {
            params: {
                fields: "id,name,programTrackedEntityAttributes[trackedEntityAttribute[id,name]],programStages[id,name,programStageDataElements[dataElement[id,name]]]",
            },
        });
        return data;
    }

    private async fetchOrgUnit(orgUnitId: string): Promise<OrgUnit> {
        if (this.orgUnitCache.has(orgUnitId)) {
            return this.orgUnitCache.get(orgUnitId)!;
        }

        const { data } = await this.api.get(
            `/api/organisationUnits/${orgUnitId}`,
            {
                params: {
                    fields: "id,name,level,path,parent[id,name]",
                },
            },
        );

        const orgUnit: OrgUnit = {
            id: data.id,
            name: data.name,
            level: data.level,
            path: data.path,
            parent: data.parent,
        };
        this.orgUnitCache.set(orgUnitId, orgUnit);
        return orgUnit;
    }

    private async getOrgUnitHierarchy(orgUnitId: string): Promise<string[]> {
        const orgUnit = await this.fetchOrgUnit(orgUnitId);
        const levels = orgUnit.path.split("/").filter((id) => id);
        const names: string[] = [];

        for (const id of levels) {
            const unit = await this.fetchOrgUnit(id);
            names.push(unit.name);
        }

        return names;
    }

    private async fetchTrackedEntityInstances(
        exportConfig: ExportConfig,
    ): Promise<TrackedEntityInstance[]> {
        let total = 1;
        let page = 1;

        let all: TrackedEntityInstance[] = [];

        let allPages = 1;

        while (total !== 0) {
            const params = {
                ouMode: "DESCENDANTS",
                program: exportConfig.program,
                ou: exportConfig.orgUnit,
                fields: "trackedEntityInstance,orgUnit,attributes[attribute,value],enrollments[enrollment,events[event,programStage,dataValues[dataElement,value]]]",
                order: "createdAt:desc",
                pageSize: 1000,
                page,
            };

            if (page === 1) {
                params["totalPages"] = true;
            }

            if (exportConfig.startDate) {
                params["programStartDate"] = exportConfig.startDate;
            }

            if (exportConfig.endDate) {
                params["programEndDate"] = exportConfig.endDate;
            }

            if (page === 1) {
                console.log("Fetching tracked entity instances first page...");
            } else {
                console.log(
                    `Fetching tracked entity instances page ${page} of ${allPages}`,
                );
            }

            const {
                data: { trackedEntityInstances, pager },
            } = await this.api.get("/api/trackedEntityInstances", {
                params,
            });

            if (page === 1) {
                allPages = pager.pageCount;
            }

            total = trackedEntityInstances.length;
            page++;

            if (total > 0) {
                all = all.concat(trackedEntityInstances);
            }
        }

        return all;
    }

    public async exportToExcel(
        exportConfig: ExportConfig,
        onProgress?: (current: number, total: number) => void,
    ): Promise<string> {
        try {
            // Create workbook
            const workbook = new Excel.Workbook();
            const worksheet = workbook.addWorksheet("Tracked Entity Instances");

            // Fetch metadata and create headers (same as before)
            const metadata = await this.fetchMetadata(exportConfig.program);

            // Create maps for names
            const attributeNames = new Map<string, string>(
                metadata.programTrackedEntityAttributes.map((tea: any) => [
                    tea.trackedEntityAttribute.id,
                    tea.trackedEntityAttribute.name,
                ]),
            );

            const dataElementNames = new Map<string, string>();
            metadata.programStages.forEach((stage: any) => {
                stage.programStageDataElements.forEach((psde: any) => {
                    dataElementNames.set(
                        psde.dataElement.id,
                        psde.dataElement.name,
                    );
                });
            });

            // Create headers
            const headers: string[] = ["TEI ID"];

            // Add org unit headers

            const instances = await this.fetchTrackedEntityInstances(
                exportConfig,
            );
            if (exportConfig.includeOrgUnitLevels) {
                if (instances.length > 0) {
                    const firstOrgUnit = await this.fetchOrgUnit(
                        instances[0].orgUnit,
                    );
                    const levelCount = firstOrgUnit.path
                        .split("/")
                        .filter((id) => id).length;
                    for (let i = 1; i <= levelCount; i++) {
                        headers.push(`Org Unit Level ${i}`);
                    }
                }
            } else {
                headers.push("Org Unit");
            }

            // Add remaining headers
            exportConfig.attributes.forEach((attrId) => {
                headers.push(attributeNames.get(attrId) || attrId);
            });

            exportConfig.dataElements.forEach((stage) => {
                stage.elements.forEach((elementId) => {
                    headers.push(dataElementNames.get(elementId) || elementId);
                });
            });

            worksheet.addRow(headers);

            let processedCount = 0;

            for (const instance of instances) {
                const rowData: (string | number | null)[] = [
                    instance.trackedEntityInstance,
                ];

                // Add org unit data
                if (exportConfig.includeOrgUnitLevels) {
                    const orgUnitHierarchy = await this.getOrgUnitHierarchy(
                        instance.orgUnit,
                    );
                    rowData.push(...orgUnitHierarchy);
                } else {
                    const orgUnit = await this.fetchOrgUnit(instance.orgUnit);
                    rowData.push(orgUnit.name);
                }

                // Add attributes
                exportConfig.attributes.forEach((attrId) => {
                    const attr = instance.attributes.find(
                        (a) => a.attribute === attrId,
                    );
                    rowData.push(attr?.value || "");
                });

                // Add data elements
                exportConfig.dataElements.forEach((stage) => {
                    const enrollment = instance.enrollments[0];
                    const event = enrollment?.events.find(
                        (e) => e.programStage === stage.programStage,
                    );

                    stage.elements.forEach((elementId) => {
                        const dataValue = event?.dataValues.find(
                            (dv) => dv.dataElement === elementId,
                        );
                        rowData.push(dataValue?.value || "");
                    });
                });

                worksheet.addRow(rowData);

                processedCount++;
                if (onProgress) {
                    onProgress(processedCount, instances.length);
                }
            }

            // Auto-fit columns
            worksheet.columns.forEach((column) => {
                let maxLength = 0;
                column.eachCell?.({ includeEmpty: true }, (cell) => {
                    const cellLength = cell.value
                        ? cell.value.toString().length
                        : 0;
                    maxLength = Math.max(maxLength, cellLength);
                });

                column.width = Math.min(Math.max(maxLength + 2, 10), 50);
            });

            // Create output directory if it doesn't exist
            const outputDir = exportConfig.outputDir || "./exports";
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // Generate filename and save
            const filename = `dhis2_export_${new Date()
                .toISOString()
                .replace(/[:.]/g, "-")}.xlsx`;
            const filepath = path.join(outputDir, filename);

            await workbook.xlsx.writeFile(filepath);

            return filepath;
        } catch (error) {
            console.error("Export error:", error);
            throw error;
        }
    }
}

// Example usage:
const config: DHIS2Config = {
    baseUrl: process.env.DHIS2_BASE_URL || "",
    username: process.env.DHIS2_USERNAME || "",
    password: process.env.DHIS2_PASSWORD || "",
};

async function runExport() {
    const exporter = new DHIS2Exporter(config);

    try {
        const filepath = await exporter.exportToExcel(
            {
                program: "wfd9K4dQVDR",
                attributes: ["ZkNZOxS24k7", "ow1lbD3DwyM", "T2rOCRsQF2U"],
                dataElements: [
                    {
                        programStage: "o9dq0aBejXc",
                        elements: ["Aw9p1CCIkqL", "hDaev1EuehO", "THirpMvAHgw"],
                    },
                ],
                orgUnit: "akV6429SUqu",
                startDate: "2023-07-01",
                endDate: "2024-06-30",
                includeOrgUnitLevels: true,
            },
            (current, total) => {
                const progress = Math.round((current / total) * 100);
                console.log(`Export progress: ${progress}%`);
            },
        );

        console.log(
            `Export completed successfully. File saved to: ${filepath}`,
        );
    } catch (error) {
        console.error("Export failed:", error);
    }
}

runExport();
