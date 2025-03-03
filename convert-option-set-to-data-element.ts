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

const deleteOptionSetOptions = async (optionSetId: string) => {
    const api = axios.create({
        baseURL: `${dhis2Config.baseUrl}/api/`,
        auth: {
            username: dhis2Config.username,
            password: dhis2Config.password,
        },
    });

    const {
        data: { options },
    } = await api.get<{
        id: string;
        options: Array<{
            id: string;
            name: string;
            code: string;
        }>;
    }>(`optionSets/${optionSetId}/options.json`, {
        params: {
            fields: "id,name,code",
        },
    });

    const dataElements = options.map(({ id, name }) => {
        return {
            name,
            shortName: name.slice(0, 50),
            id,
            aggregationType: "NONE",
            domainType: "TRACKER",
            valueType: "TRUE_ONLY",
        };
    });

    try {
        const { data } = await api.post("metadata", { dataElements });
        console.log(data);
    } catch (error) {
        console.log(JSON.stringify(error.response.data.response, null, 2));
    }
};

deleteOptionSetOptions("ZsvabS7avJD").then(() => console.log("done"));
