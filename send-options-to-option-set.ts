import XLSX from "xlsx";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

interface Option {
    code: string;
    name: string;
}

interface DHIS2Option {
    code: string;
    name: string;
    sortOrder: number;
    optionSet: {
        id: string;
    };
}

interface DHIS2Response {
    httpStatus: string;
    httpStatusCode: number;
    status: string;
    message: string;
}

class DHIS2OptionsUploader {
    private baseUrl: string;
    private username: string;
    private password: string;
    private optionSetId: string;

    constructor(
        baseUrl: string,
        username: string,
        password: string,
        optionSetId: string,
    ) {
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
        this.optionSetId = optionSetId;
    }

    private async readExcelFile(filePath: string): Promise<Option[]> {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const data = XLSX.utils.sheet_to_json<Option>(worksheet);

            // Validate data
            const validData = data.filter((row) => row.code && row.name);
            if (validData.length !== data.length) {
                console.warn(
                    "Some rows were skipped due to missing code or name",
                );
            }

            return validData;
        } catch (error) {
            throw new Error(`Error reading Excel file: ${error.message}`);
        }
    }

    private transformToDHIS2Format(options: Option[]): DHIS2Option[] {
        return options.map((option, index) => ({
            code: option.code,
            name: option.name,
            sortOrder: index + 1,
            optionSet: {
                id: this.optionSetId,
            },
        }));
    }

    private async uploadOptions(options: DHIS2Option[]): Promise<void> {
        const endpoint = `${this.baseUrl}/api/options`;
        const auth = {
            username: this.username,
            password: this.password,
        };

        try {
            const batchSize = 50;
            for (let i = 0; i < options.length; i += batchSize) {
                const batch = options.slice(i, i + batchSize);
                const promises = batch.map((option) =>
                    axios.post<DHIS2Response>(endpoint, option, { auth }),
                );
                const results = await Promise.allSettled(promises);
                results.forEach((result, index) => {
                    if (result.status === "fulfilled") {
                        console.log(
                            `Successfully uploaded option: ${batch[index].name}`,
                        );
                    } else {
                        console.error(
                            `Failed to upload option ${batch[index].name}: ${result.reason}`,
                        );
                    }
                });
            }
        } catch (error) {
            throw new Error(
                `Error uploading options to DHIS2: ${error.message}`,
            );
        }
    }

    public async uploadOptionsFromExcel(filePath: string): Promise<void> {
        try {
            console.log("Reading Excel file...");
            const options = await this.readExcelFile(filePath);

            console.log(`Found ${options.length} valid options`);
            const dhis2Options = this.transformToDHIS2Format(options);

            console.log("Uploading options to DHIS2...");
            await this.uploadOptions(dhis2Options);

            console.log("Upload completed successfully");
        } catch (error) {
            console.error("Upload failed:", error.message);
            throw error;
        }
    }
}

// Usage example
async function main() {
    const uploader = new DHIS2OptionsUploader(
        process.env.DHIS2_BASE_URL || "",
        process.env.DHIS2_USERNAME || "",
        process.env.DHIS2_PASSWORD || "",
        "ecH4YMpOTUd",
    );

    try {
        await uploader.uploadOptionsFromExcel("Options1.xlsx");
    } catch (error) {
        console.error("Error in main:", error.message);
        process.exit(1);
    }
}

// Run the script
main().then(() => console.log("Done"));
