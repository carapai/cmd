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
        }>;
    }>(`optionSets/${optionSetId}/options.json`, {
        params: {
            fields: "id",
        },
    });

    for (const { id } of options) {
        try {
            const { data: r1 } = await api.delete(
                `optionSets/${optionSetId}/options/${id}`,
            );
            const { data: r2 } = await api.delete(`options/${id}`);
            console.log(r1, r2);
        } catch (error) {
            console.log(JSON.stringify(error));
        }
    }
};

deleteOptionSetOptions("ecH4YMpOTUd").then(() => console.log("done"));
