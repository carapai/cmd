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

const postData = async (data: Record<string, any>) => {
    const api = axios.create({
        baseURL: `${dhis2Config.baseUrl}/api/`,
        auth: {
            username: dhis2Config.username,
            password: dhis2Config.password,
        },
    });

    try {
        const { data: response } = await api.post("metadata", data);
        console.log(response);
    } catch (error) {
        console.log(JSON.stringify(error.response.data.response, null, 2));
    }
};

postData({
    programRuleVariables: [
        {
            name: "treatment_start_date",
            programRuleVariableSourceType: "DATAELEMENT_CURRENT_EVENT",
            program: { id: "RDEklSXCD4C" },
            programStage: {
                id: "kKlAyGUnCML",
            },
            dataElement: { id: "C8UNsGeaVhQ" },
        },
        {
            name: "treatment_end_date",
            programRuleVariableSourceType: "DATAELEMENT_CURRENT_EVENT",
            program: { id: "RDEklSXCD4C" },
            programStage: {
                id: "kKlAyGUnCML",
            },
            dataElement: { id: "hJRxGykrThk" },
        },
    ],
}).then(() => console.log("done"));
