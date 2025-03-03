import axios from "axios";
import csv from "csv-parser";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// DHIS2 configuration
const dhis2BaseUrl: string = process.env.DHIS2_BASE_URL || "";
const dhis2Username: string = process.env.DHIS2_USERNAME || "";
const dhis2Password: string = process.env.DHIS2_PASSWORD || "";

// CSV file path
const csvFilePath: string = "data.csv";

// Data element to update
const dataElementId: string = "xGT0urdKURs";

// Interface for CSV row data
interface CSVRow {
    eventId: string;
    value: string;
    [key: string]: string; // For any additional columns
}

// Interface for DHIS2 API response
interface DHIS2Response {
    httpStatusCode: number;
    httpStatus: string;
    status: string;
    message: string;
}

// Function to update an event in DHIS2
async function updateEventInDHIS2(
    eventId: string,
    value: string,
): Promise<DHIS2Response | null> {
    try {
        const response = await axios.put<DHIS2Response>(
            `${dhis2BaseUrl}/api/events/${eventId}/${dataElementId}`,

            {
                dataValues: [{ dataElement: dataElementId, value: value }],
            },
            {
                auth: {
                    username: dhis2Username,
                    password: dhis2Password,
                },
            },
        );
        console.log(`Successfully updated event ${eventId}`);
        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error(`Error updating event ${eventId}:`, error.message);
            console.error("Response:", error.response?.data);
        } else {
            console.error(`Unexpected error updating event ${eventId}:`, error);
        }
        return null;
    }
}

// Function to process the CSV file and update DHIS2
async function processCSVAndUpdateDHIS2(): Promise<void> {
    const results: CSVRow[] = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on("data", (data: CSVRow) => results.push(data))
            .on("end", async () => {
                console.log(
                    `CSV file processed. Total rows: ${results.length}`,
                );
                for (const row of results) {
                    const { Event, ["REA-Nature of incident"]: value } = row;

                    if (Event && value) {
                        const response = await updateEventInDHIS2(Event, value);
                        console.log(JSON.stringify(response, null, 2));
                    } else {
                        console.warn(
                            `Skipping row due to missing eventId or value`,
                        );
                    }
                }

                console.log("Finished processing all rows");
                resolve();
            })
            .on("error", (error) => {
                console.error("Error reading CSV:", error);
                reject(error);
            });
    });
}

// Run the script
processCSVAndUpdateDHIS2()
    .then(() => console.log("Script execution completed"))
    .catch((error) => console.error("Script execution failed:", error));
