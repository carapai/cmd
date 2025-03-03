import axios from "axios";
import "dotenv/config";
import pg from "pg";
import fs from "fs";
import JSONStream from "JSONStream";
import es from "event-stream";
import _ from "lodash";

const { Pool } = pg;

const pool = new Pool({
    host: "localhost",
    user: "carapai",
    database: "dhis240",
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

const api = axios.create({
    baseURL: process.env.DHIS2_URL,
    auth: {
        username: process.env.DHIS2_USERNAME ?? "",
        password: process.env.DHIS2_PASSWORD ?? "",
    },
});
const source = axios.create({
    baseURL: process.env.DHIS2_SOURCE_URL,
    auth: {
        username: process.env.DHIS2_SOURCE_USERNAME ?? "",
        password: process.env.DHIS2_SOURCE_PASSWORD ?? "",
    },
});

async function moveData({
    sourceCategoryOptionCombos,
    destinationCategoryOptionCombos,
    sourceDataElement,
    destinationDataElement,
}: {
    sourceDataElement: string;
    destinationDataElement: string;
    sourceCategoryOptionCombos: string;
    destinationCategoryOptionCombos: string;
}) {
    const { rows } = await pool.query<{ dataelementid: number }>(
        "SELECT dataelementid from dataelement where uid = $1::text",
        [sourceDataElement],
    );
}
async function unassignDataElementFromDataSet(
    dataSetId: string,
    dataElementId: string,
) {
    try {
        await api.delete(`dataSets/${dataSetId}/dataElements/${dataElementId}`);
    } catch (error) {
        console.error("Error while unassigning data element:", error);
    }
}

// const getStream = () => {
//     const jsonData = "events.json";
//     const stream = fs.createReadStream(jsonData, { encoding: "utf8" });
//     const parser = JSONStream.parse("*");
//     return stream.pipe(parser);
// };

// getStream().pipe(
//     es.mapSync(async (currentData: any[]) => {
//         for (const current of _.chunk(currentData, 10)) {
//             console.log(current[0]);
//             try {
//                 const { data } = await api.post(
//                     "tracker",
//                     { events: current },
//                     { params: { async: false } },
//                 );
//                 console.log(data);
//             } catch (error) {
//                 console.log(JSON.stringify(error.response.data, null, 2));
//             }
//         }
//     }),
// );

const transfer = async () => {
    let total = 1;
    let page = 1;

    while (total !== 0) {
        const {
            data: { events },
        } = await source.get("events.json", {
            params: {
                page,
                pageSize: 10,
                ouMode: "ALL",
                program: "EURMRkVVtAB",
            },
        });
        try {
            const { data } = await api.post(
                "tracker",
                {
                    events: events.map(({ eventDate, ...rest }) => ({
                        ...rest,
                        occurredAt: eventDate,
                    })),
                },
                { params: { async: true } },
            );
            console.log(JSON.stringify(data, null, 2));
        } catch (error) {
            console.log(JSON.stringify(error.response.data, null, 2));
        }
        total = events.length;
        page = page + 1;
    }
};

// moveData({
//     sourceCategoryOptionCombos: "",
//     destinationCategoryOptionCombos: "",
//     sourceDataElement: "EzR5Y2V0JF9",
//     destinationDataElement: "",
// });

// unassignDataElementFromDataSet("DFMoIONIalm", "q4NmYosu5dU");
transfer().then(() => console.log("Done"));
