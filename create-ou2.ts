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
const processJsonFile = async (currentData: string[]): Promise<void> => {
    const jsonData = currentData.map((current) => {
        const [DISTRICT, SCTY_NAME, PARISH_NAME] = current.split("/");
        return {
            DISTRICT,
            "SCTY NAME": SCTY_NAME,
            "PARISH NAME": PARISH_NAME,
        };
    });

    const groupedData = _.groupBy(jsonData, "DISTRICT");
    for (const [key, value] of Object.entries(groupedData)) {
        const { organisationUnits } = await queryDHIS2("organisationUnits", [
            { key: "filter", value: `name:eq:${key}` },
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

processJsonFile([
    "AGAGO DISTRICT/KALONGO TOWN COUNCIL/OGOLE WARD",
    "AGAGO DISTRICT/KALONGO TOWN COUNCIL/PAKOR",
    "AGAGO DISTRICT/LAPONO SUB COUNTY/ABILONINO",
    "AGAGO DISTRICT/LAPONO SUB COUNTY/AKADO",
    "AGAGO DISTRICT/LAPONO SUB COUNTY/LIRA KATO",
    "AGAGO DISTRICT/LAPONO SUB COUNTY/PECE WARD",
    "AGAGO DISTRICT/LIRA PALWO TOWN COUNCIL/BIWANG",
    "AGAGO DISTRICT/LIRA PALWO SUB COUNTY/ALAA",
    "AGAGO DISTRICT/LUKOLE SUB COUNTY/KITENG",
    "AGAGO DISTRICT/PAIMOL SUB COUNTY/ALAA",
    "AGAGO DISTRICT/PATONGO TOWN COUNCIL/KAL",
    "AGAGO DISTRICT/PATONGO TOWN COUNCIL/ODONGKIWINYO",
    "AGAGO DISTRICT/WOL SUB COUNTY/PALUTI",
    "AMOLATAR DISTRICT/AMOLATAR TOWN COUNCIL/ALEMERE",
    "AMOLATAR DISTRICT/AWELLO SUB COUNTY/ANAMIDO",
    "APAC DISTRICT/AKERE DIVISION/AMINTENG",
    "DOKOLO DISTRICT/AGWATA SUBCOUNTY/AGWATA",
    "DOKOLO DISTRICT/AMWOMA SUBCOUNTY/ALENGA",
    "DOKOLO DISTRICT/BATTA SUB COUNTY/ABALANG PARISH",
    "DOKOLO DISTRICT/BATTA SUB COUNTY/AKWANGA",
    "DOKOLO DISTRICT/BATTA SUB COUNTY/ALANYI",
    "DOKOLO DISTRICT/BATTA SUB COUNTY/ALUTI",
    "DOKOLO DISTRICT/BATTA SUB COUNTY/BARAYOM",
    "DOKOLO DISTRICT/BATTA SUB COUNTY/BATA",
    "DOKOLO DISTRICT/DOKOLO TOWN COUNCIL/ACANPII",
    "DOKOLO DISTRICT/DOKOLO TOWN COUNCIL/ACENGRYENG",
    "DOKOLO DISTRICT/DOKOLO TOWN COUNCIL/ADAGMON",
    "DOKOLO DISTRICT/DOKOLO TOWN COUNCIL/AIBANGE",
    "DOKOLO DISTRICT/DOKOLO TOWN COUNCIL/ANGWEEBANGA",
    "DOKOLO DISTRICT/DOKOLO TOWN COUNCIL/APENY",
    "DOKOLO DISTRICT/DOKOLO TOWN COUNCIL/ATUR",
    "DOKOLO DISTRICT/DOKOLO TOWN COUNCIL/IGULI",
    "DOKOLO DISTRICT/DOKOLO TOWN COUNCIL/OKWONGODUL",
    "DOKOLO DISTRICT/KANGAI SUBCOUNTY/ADEKNINO",
    "DOKOLO DISTRICT/KANGAI SUBCOUNTY/ADEROLONGO",
    "GULU DISTRICT/BUNGATIRA SUBCOUNTY/AKONYOBODI",
    "GULU DISTRICT/BUNGATIRA SUBCOUNTY/COO PEE",
    "GULU DISTRICT/BUNGATIRA SUBCOUNTY/LAGWINY PARISH",
    "GULU DISTRICT/BUNGATIRA SUBCOUNTY/POTERA PARISH",
    "GULU DISTRICT/BUNGATIRA SUBCOUNTY/TEGWONA WARD",
    "GULU DISTRICT/PAICHO SUBCOUNTY/AKONYOBODI",
    "GULU DISTRICT/PAICHO SUBCOUNTY/APEM",
    "GULU DISTRICT/PAICHO SUBCOUNTY/FOR GOD WARD",
    "GULU DISTRICT/PAICHO SUBCOUNTY/PADUNY",
    "GULU DISTRICT/PAICHO SUBCOUNTY/PAKWELO",
    "GULU DISTRICT/PATIKO SUBCOUNTY/ANYANG PARISH",
    "LIRA DISTRICT/AMACH SUBCOUNTY/ANYAKEDE",
    "OYAM DISTRICT/MINAKULU SUBCOUNTY/ACENO PARISH",
    "OYAM DISTRICT/MINAKULU SUBCOUNTY/ADEL PARISH",
    "OYAM DISTRICT/MINAKULU TOWN COUNCIL/ATEGO WARD",
]).then(() => console.log("Done"));
