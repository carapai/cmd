import dotenv from "dotenv";
import axios from "axios";
import fs from "fs";

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

const addUsers = async () => {
    const users = readJsonFile("./users.json");
    const api = axios.create({
        baseURL: `${dhis2Config.baseUrl}/api/`,
        auth: {
            username: dhis2Config.username,
            password: dhis2Config.password,
        },
    });

    for (const a of users) {
        const currentUser = {
            username: a["username"],
            password: a["password"],
            accountExpiry: null,
            userRoles: a["role"].split(",").map((a: string) => ({ id: a })),
            catDimensionConstraints: [],
            cogsDimensionConstraints: [],
            email: a["Email Address"],
            firstName: a["Last Name"],
            surname: a["First Name"],
            organisationUnits: a["districtId"]
                .split(",")
                .map((a: string) => ({ id: a })),
            dataViewOrganisationUnits: a["districtId"]
                .split(",")
                .map((a: string) => ({ id: a })),
            teiSearchOrganisationUnits: [],
            dataViewMaxOrganisationUnitLevel: null,
            userGroups: [],
            attributeValues: [],
        };
        try {
            await api.post("40/users", currentUser);
        } catch (error) {
            console.log(error.response.data.response.errorReports);
        }
    }
};

addUsers().then(() => console.log("done"));
