import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import _ from "lodash";

dotenv.config();

// DHIS2 configuration
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

const readJsonFile = (filePath: string): Array<{ [Key: string]: any }> => {
    try {
        const jsonData = fs.readFileSync(filePath, "utf8");
        return JSON.parse(jsonData);
    } catch (error) {
        console.error("Error reading JSON file:", error);
        return [];
    }
};

const getRelationships = (
    toFile: string,
    fromFile: string,
    toAttribute: string,
    fromAttribute: string,
) => {
    const toData = readJsonFile(toFile);
    const fromData = readJsonFile(fromFile);

    const fromValues = fromData.reduce<Record<string, string>>(
        (acc, curr: Record<string, any>) => {
            const search =
                curr.attributes.find((a: any) => a.attribute === fromAttribute)
                    ?.value ?? "";

            if (search) {
                acc[search] = curr.trackedEntityInstance;
            }

            return acc;
        },
        {},
    );

    return toData.flatMap((tei: any) => {
        const currentTo = tei.attributes.find(
            (a: any) => a.attribute === toAttribute,
        );
        if (currentTo) {
            const currentFrom =
                fromValues[
                    currentTo.value.slice(0, currentTo.value.length - 3)
                ];
            if (currentFrom) {
                return {
                    relationshipType: "hly709n51z0",
                    from: {
                        trackedEntityInstance: {
                            trackedEntityInstance: currentFrom,
                        },
                    },
                    to: {
                        trackedEntityInstance: {
                            trackedEntityInstance: tei.trackedEntityInstance,
                        },
                    },
                };
            }
        }
        return [];
    });
};

async function postToDHIS2(data: any, endpoint: string) {
    try {
        const response = await axios.post(
            `${dhis2Config.baseUrl}/api/${endpoint}`,
            data,
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
        const { imported, updated, deleted, ignored } = response.data.response;
        return { imported, updated, deleted, ignored };
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(
                `Error posting to DHIS2 ${endpoint}:`,
                JSON.stringify(error.response?.data.status, null, 2),
            );
        } else {
            console.error(`Error posting to DHIS2 ${endpoint}:`, error);
        }
        return null;
    }
}

const processAndPostData = async () => {
    const data = getRelationships(
        "members.json",
        "households.json",
        "HLKc2AKR9jW",
        "r10igcWrpoH",
    );

    let i = 0;
    const chunks = _.chunk(data, 100);
    for (const currentData of chunks) {
        console.log(`Processing chunk ${++i} of ${chunks.length}`);

        const response = await postToDHIS2(
            {
                relationships: currentData,
            },
            "relationships",
        );
        console.log(response);
    }
};

processAndPostData().then(() => console.log("Done"));
