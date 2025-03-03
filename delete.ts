import dotenv from "dotenv";
import axios from "axios";

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

const deleteTrackedEntities = async (program: string) => {
    const api = axios.create({
        baseURL: dhis2Config.baseUrl,
        auth: {
            username: dhis2Config.username,
            password: dhis2Config.password,
        },
    });

    let total = 1;
    let page = 1;

    const {
        data: { trackedEntities },
    } = await api.get<{
        trackedEntities: Array<{
            trackedEntity: string;
        }>;
    }>("tracker/trackedEntities.json", {
        params: {
            program,
            fields: "trackedEntity",
            skipPaging: true,
        },
    });

    for (const { trackedEntity } of trackedEntities) {
        try {
            const response = await api.delete(
                `trackedEntityInstances/${trackedEntity}`,
            );
            console.log(response.data.response);
        } catch (error) {
            console.log(JSON.stringify(error));
        }
    }
};

deleteTrackedEntities("IXxHJADVCkb").then(() => console.log("done"));
