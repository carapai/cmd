import fs from "fs";
import dotenv from "dotenv";
import axios from "axios";
import _ from "lodash";

dotenv.config();

interface DHIS2Config {
    baseUrl: string;
    username: string;
    password: string;
}

const dhis2Config: DHIS2Config = {
    baseUrl: process.env.DHIS2_BASE_URL || "",
    username: process.env.DHIS2_USERNAME || "",
    password: process.env.DHIS2_PASSWORD || "",
};

const postToDHIS2 = async (endpoint: string, payload: any): Promise<any> => {
    try {
        const { data } = await axios.post(
            `${dhis2Config.baseUrl}/api/${endpoint}`,
            payload,
            {
                auth: {
                    username: dhis2Config.username,
                    password: dhis2Config.password,
                },
                headers: {
                    "Content-Type": "application/json",
                },
            },
        );
        return data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(
                `Error posting to DHIS2 ${endpoint}:`,
                JSON.stringify(error.response?.data),
            );
        } else {
            console.error(`Error posting to DHIS2 ${endpoint}:`, error);
        }
        return null;
    }
};

const queryDHIS2 = async (
    endpoint: string,
    params: Array<Record<string, any>>,
): Promise<any> => {
    const paramsString = params
        .map(({ key, value }) => `${key}=${value}`)
        .join("&");
    try {
        const { data } = await axios.get(
            `${dhis2Config.baseUrl}/api/${endpoint}?${paramsString}`,
            {
                auth: {
                    username: dhis2Config.username,
                    password: dhis2Config.password,
                },
            },
        );
        return data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(
                `Error posting to DHIS2 ${endpoint}:`,
                JSON.stringify(
                    error.response?.data?.response.importSummaries.flatMap(
                        ({ conflicts }) => conflicts,
                    ),
                    null,
                    2,
                ),
            );
        } else {
            console.error(`Error posting to DHIS2 ${endpoint}:`, error);
        }
        return null;
    }
};
const readJsonFile = (filePath: string): Array<Record<string, string>> => {
    try {
        const jsonData = fs.readFileSync(filePath, "utf8");
        return JSON.parse(jsonData);
    } catch (error) {
        console.error("Error reading JSON file:", error);
        return [];
    }
};
const subCounties: Array<Record<string, any>> = [];
const parishes: Array<Record<string, any>> = [];
const processJsonFile = async (filePath: string): Promise<void> => {
    const jsonData = readJsonFile(filePath);
    const groupedData = _.groupBy(jsonData, "DISTRICT");
    for (const [key, value] of Object.entries(groupedData)) {
        const { organisationUnits } = await queryDHIS2("organisationUnits", [
            { key: "filter", value: `name:eq:${key.toUpperCase()}` },
            { key: "paging", value: `false` },
            {
                key: "fields",
                value: `id,name,children[id,name,children[id,name]]`,
            },
        ]);

        if (organisationUnits.length > 0) {
            const groupBySubCounty = _.groupBy(value, "SCTY NAME");
            for (const [subCountyKey, subCountyValue] of Object.entries(
                groupBySubCounty,
            )) {
                const availableOrganisationUnits =
                    organisationUnits[0].children.find((ou: any) => {
                        return (
                            String(ou.name)
                                .replaceAll(" ", "")
                                .toLowerCase() ===
                            String(subCountyKey)
                                .replaceAll(" ", "")
                                .toLowerCase()
                        );
                    });
                if (availableOrganisationUnits) {
                    subCountyValue.forEach((tei: any) => {
                        const search = availableOrganisationUnits.children.find(
                            (ou: any) =>
                                String(ou.name)
                                    .replaceAll(" ", "")
                                    .toLowerCase() ===
                                String(tei["PARISH NAME"])
                                    .replaceAll(" ", "")
                                    .toLowerCase(),
                        );
                        if (!search) {
                            parishes.push({
                                name: tei["PARISH NAME"],
                                parent: { id: availableOrganisationUnits.id },
                                openingDate: "2020-01-01",
                                shortName: tei["PARISH NAME"],
                            });
                        }
                    });
                } else {
                    const {
                        codes: [id],
                    } = await queryDHIS2("system/id", []);
                    subCounties.push({
                        id,
                        name: subCountyKey,
                        parent: { id: organisationUnits[0].id },
                        openingDate: "2020-01-01",
                        shortName: subCountyKey,
                        code: subCountyValue[0]["subcountycode"],
                    });

                    subCountyValue.forEach((tei: any) => {
                        parishes.push({
                            name: tei["PARISH NAME"],
                            parent: { id },
                            openingDate: "2020-01-01",
                            shortName: tei["PARISH NAME"],
                        });
                    });
                }
            }
        }
    }

    // const response = await postToDHIS2("organisationUnits", {
    //     organisationUnits: subCounties,
    // });
    // const response2 = await postToDHIS2("organisationUnits", {
    //     organisationUnits: parishes,
    // });

    console.log(JSON.stringify({ organisationUnits: subCounties }));
    console.log(JSON.stringify({ organisationUnits: parishes }));
};

processJsonFile("ous.json").then(() => console.log("Done"));
