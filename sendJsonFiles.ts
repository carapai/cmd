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

// Data types
type DataType = "trackedEntityInstances" | "enrollments" | "events";

interface TrackedEntityInstance {
    // Define the structure of a tracked entity instance
    // This is a placeholder and should be replaced with the actual structure
    [key: string]: any;
}

interface Enrollment {
    // Define the structure of an enrollment
    // This is a placeholder and should be replaced with the actual structure
    [key: string]: any;
}
interface Event {
    // Define the structure of an enrollment
    // This is a placeholder and should be replaced with the actual structure
    [key: string]: any;
}

interface TrackedEntityInstancesData {
    trackedEntityInstances: TrackedEntityInstance[];
}

interface EnrollmentsData {
    enrollments: Enrollment[];
}
interface EventData {
    events: Event[];
}

type DHISData = TrackedEntityInstancesData | EnrollmentsData | EventData;

interface FilePair {
    tei?: string;
    enrollments?: string;
}

// Read JSON file
const readJsonFile = (filePath: string): Array<{ [Key: string]: any }> => {
    try {
        const jsonData = fs.readFileSync(filePath, "utf8");
        return JSON.parse(jsonData);
    } catch (error) {
        console.error("Error reading JSON file:", error);
        return [];
    }
};

// Post data to DHIS2
const postToDHIS2 = async (endpoint: string, data: DHISData): Promise<any> => {
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
            console.error(error.response);
            console.error(
                `Error posting to DHIS2 ${endpoint}:`,
                JSON.stringify(
                    error.response?.data?.response?.importSummaries?.flatMap(
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

const deleteFromDHIS2 = async (endpoint: string, id: string): Promise<any> => {
    try {
        const { data } = await axios.delete(
            `${dhis2Config.baseUrl}/api/${endpoint}/${id}`,
            {
                auth: {
                    username: dhis2Config.username,
                    password: dhis2Config.password,
                },
            },
        );
        console.log(data);
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(error.response);
            console.error(
                `Error posting to DHIS2 ${endpoint}:`,
                JSON.stringify(
                    error.response?.data?.response?.importSummaries?.flatMap(
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

// Process and post data for a single file
const processAndPostData = async (
    filePath: string,
    dataType: DataType,
    start: number,
    remove?: boolean,
    attribute?: string,
): Promise<void> => {
    console.log(`Processing ${dataType} file: ${filePath}`);
    const data = readJsonFile(filePath);
    if (!data) return;
    if (remove && attribute) {
        for (const current of data) {
            await deleteFromDHIS2(dataType, current[attribute]);
        }
    } else {
        let i = start === 0 ? 0 : start - 1;
        const chunks = _.chunk(data, 50);
        for (const currentData of chunks.slice(start)) {
            console.log(`Processing chunk ${++i} of ${chunks.length}`);

            if (dataType === "trackedEntityInstances") {
                const response = await postToDHIS2(dataType, {
                    trackedEntityInstances: currentData,
                });
                console.log(`${dataType} import response:`, response);
            } else if (dataType === "enrollments") {
                const response = await postToDHIS2(dataType, {
                    enrollments: currentData,
                });
                console.log(`${dataType} import response:`, response);
            } else if (dataType === "events") {
                const response = await postToDHIS2(dataType, {
                    events: currentData,
                });

                console.log(`${dataType} import response:`, response);
            }
        }
    }
};

const list: Array<{ filePath: string; dataType: DataType; start: number }> = [
    { filePath: "events.json", dataType: "events", start: 0 },
    // { filePath: "member-enrollments.json", dataType: "enrollments", start: 0 },
    // {
    //     filePath: "households.json",
    //     dataType: "trackedEntityInstances",
    //     start: 0,
    // },
    // {
    //     filePath: "household-enrollments.json",
    //     dataType: "enrollments",
    //     start: 0,
    // },
];

for (const { filePath, dataType, start } of list) {
    await processAndPostData(filePath, dataType, start);
    console.log(`Done with ${dataType} and ${filePath}`);
}
