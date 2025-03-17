import axios from "axios";
import winston from "winston";
interface EventResponse {
    page: number;
    pageSize: number;
    instances: Event[];
}

interface Event {
    event?: string;
    status: string;
    program: string;
    programStage: string;
    enrollment: string;
    trackedEntity: string;
    orgUnit: string;
    orgUnitName: string;
    relationships: any[];
    occurredAt: string;
    scheduledAt: string;
    storedBy?: string;
    followup: boolean;
    deleted: boolean;
    createdAt: string;
    updatedAt: string;
    attributeOptionCombo: string;
    attributeCategoryOptions: string;
    assignedUser: AssignedUser;
    createdBy: CreatedBy;
    updatedBy: CreatedBy;
    dataValues: DataValue[];
    notes: any[];
    completedBy?: string;
    completedAt?: string;
}

interface DataValue {
    createdAt?: string;
    updatedAt?: string;
    providedElsewhere?: boolean;
    dataElement: string;
    value: string;
    createdBy?: CreatedBy;
    updatedBy?: CreatedBy;
}

interface CreatedBy {
    uid: string;
    username: string;
    firstName: string;
    surname: string;
}

interface AssignedUser {}

interface TrackedEntityResponse {
    page: number;
    pageSize: number;
    instances: TrackedEntity[];
}

interface TrackedEntity {
    trackedEntity: string;
    trackedEntityType: string;
    createdAt: string;
    createdAtClient: string;
    updatedAt: string;
    updatedAtClient: string;
    orgUnit: string;
    inactive: boolean;
    deleted: boolean;
    potentialDuplicate: boolean;
    createdBy: CreatedBy;
    updatedBy: CreatedBy;
    relationships: any[];
    attributes: Attribute[];
    enrollments: Enrollment[];
    programOwners: ProgramOwner[];
}

interface ProgramOwner {
    orgUnit: string;
    trackedEntity: string;
    program: string;
}

interface Enrollment {
    enrollment: string;
    createdAt: string;
    createdAtClient: string;
    updatedAt: string;
    updatedAtClient: string;
    trackedEntity: string;
    program: string;
    status: string;
    orgUnit: string;
    orgUnitName: string;
    enrolledAt: string;
    occurredAt: string;
    followUp: boolean;
    deleted: boolean;
    createdBy: CreatedBy;
    updatedBy: CreatedBy;
    events: Event[];
    relationships: any[];
    attributes: Attribute[];
    notes: any[];
    completedBy?: string;
    completedAt?: string;
    storedBy?: string;
}

interface AssignedUser {}

interface Attribute {
    attribute: string;
    displayName: string;
    createdAt: string;
    updatedAt: string;
    valueType: string;
    value: string;
    code?: string;
}

interface CreatedBy {
    uid: string;
    username: string;
    firstName: string;
    surname: string;
}

const mapping = {
    RYj89i7ij2d: {
        AD2q8Mf1RVl: {
            source: "m0QNAkI3PKo.AD2q8Mf1RVl",
        },
        BNyC8Lp2lpw: {
            source: "m0QNAkI3PKo.BNyC8Lp2lpw",
        },
        CYHPNv42oxN: {
            source: "m0QNAkI3PKo.CYHPNv42oxN",
        },
        DXg4BfI9BQx: {
            source: "m0QNAkI3PKo.DXg4BfI9BQx",
        },
        DsWrKFF4s8r: {
            source: "m0QNAkI3PKo.DsWrKFF4s8r",
        },
        E7CECD8V0IV: {
            source: "m0QNAkI3PKo.E7CECD8V0IV",
        },
        ES58lzeRmvG: {
            source: "m0QNAkI3PKo.ES58lzeRmvG",
        },
        FvwEHphIlAT: {
            source: "m0QNAkI3PKo.FvwEHphIlAT",
        },
        G0UQ8Qv5AWb: {
            source: "m0QNAkI3PKo.G0UQ8Qv5AWb",
        },
        G1KPc3baOA8: {
            source: "m0QNAkI3PKo.G1KPc3baOA8",
        },
        GPOSONWHwHr: {
            source: "m0QNAkI3PKo.GPOSONWHwHr",
        },
        H12Bz9ilOf1: {
            source: "m0QNAkI3PKo.H12Bz9ilOf1",
        },
        HYD9qxIfQX9: {
            source: "m0QNAkI3PKo.HYD9qxIfQX9",
        },
        J1odqnLrdD8: {
            source: "m0QNAkI3PKo.J1odqnLrdD8",
        },
        KcMzGAyCG3u: {
            source: "m0QNAkI3PKo.KcMzGAyCG3u",
        },
        M6gLV7tyKbF: {
            source: "m0QNAkI3PKo.M6gLV7tyKbF",
        },
        N2PiVIPoitL: {
            source: "m0QNAkI3PKo.N2PiVIPoitL",
        },
        NdwgaSCq8XP: {
            source: "m0QNAkI3PKo.NdwgaSCq8XP",
        },
        Oa0NsV2Z5LF: {
            source: "m0QNAkI3PKo.Oa0NsV2Z5LF",
        },
        PssGjmcfMpJ: {
            source: "m0QNAkI3PKo.PssGjmcfMpJ",
        },
        QRl2YSQXsYr: {
            source: "m0QNAkI3PKo.QRl2YSQXsYr",
        },
        QtfOBCMW7Vj: {
            source: "m0QNAkI3PKo.QtfOBCMW7Vj",
        },
        RAN3LqxXMlx: {
            source: "m0QNAkI3PKo.RAN3LqxXMlx",
        },
        S1ffWypsa8z: {
            source: "m0QNAkI3PKo.S1ffWypsa8z",
        },
        SjMxl9Cwha8: {
            source: "m0QNAkI3PKo.SjMxl9Cwha8",
        },
        SwprWyvtPT0: {
            source: "m0QNAkI3PKo.SwprWyvtPT0",
        },
        UyePTtTeYt4: {
            source: "m0QNAkI3PKo.UyePTtTeYt4",
        },
        Vuz74DEe65l: {
            source: "m0QNAkI3PKo.Vuz74DEe65l",
        },
        WL0VzfENQOt: {
            source: "m0QNAkI3PKo.WL0VzfENQOt",
        },
        WcWpgUF1wyl: {
            source: "m0QNAkI3PKo.WcWpgUF1wyl",
        },
        WrdLzFIgEvz: {
            source: "m0QNAkI3PKo.WrdLzFIgEvz",
        },
        ZVqgRLiLwDp: {
            source: "m0QNAkI3PKo.ZVqgRLiLwDp",
        },
        bcQgDb7Jm8p: {
            source: "m0QNAkI3PKo.bcQgDb7Jm8p",
        },
        cctAcgFzTyL: {
            source: "m0QNAkI3PKo.cctAcgFzTyL",
        },
        dSlMYtdJZt2: {
            source: "m0QNAkI3PKo.dSlMYtdJZt2",
        },
        fnPt9G4HW8J: {
            source: "m0QNAkI3PKo.fnPt9G4HW8J",
        },
        h4j1afT0lWu: {
            source: "m0QNAkI3PKo.h4j1afT0lWu",
        },
        inMQfQ5efN4: {
            source: "m0QNAkI3PKo.inMQfQ5efN4",
        },
        jszYTzmhtnL: {
            source: "m0QNAkI3PKo.jszYTzmhtnL",
        },
        ktDgZANlL5h: {
            source: "m0QNAkI3PKo.ktDgZANlL5h",
        },
        lAw5CaYGNcx: {
            source: "m0QNAkI3PKo.lAw5CaYGNcx",
        },
        nEbTmrHCDdB: {
            source: "m0QNAkI3PKo.nEbTmrHCDdB",
        },
        pcBzg1tXvjh: {
            source: "m0QNAkI3PKo.pcBzg1tXvjh",
        },
        sx0mp9Sqiwv: {
            source: "m0QNAkI3PKo.sx0mp9Sqiwv",
        },
        woYJkG3KMga: {
            source: "m0QNAkI3PKo.woYJkG3KMga",
        },
        wsFrk0eBZgi: {
            source: "m0QNAkI3PKo.wsFrk0eBZgi",
        },
        wxc4CXfzvIP: {
            source: "m0QNAkI3PKo.wxc4CXfzvIP",
        },
        yG8qO8qYLXk: {
            source: "m0QNAkI3PKo.yG8qO8qYLXk",
        },
        zUJzSmPo0mQ: {
            source: "m0QNAkI3PKo.zUJzSmPo0mQ",
        },
    },
};

const { combine, timestamp, printf, colorize, align } = winston.format;

const logger = winston.createLogger({
    level: "info",
    format: combine(
        colorize({ all: true }),
        timestamp({
            format: "YYYY-MM-DD hh:mm:ss.SSS A",
        }),
        align(),
        printf((info) => `[${info.timestamp}] ${info.level}: ${info.message}`),
    ),
    transports: [
        new winston.transports.File({
            filename: "emis.log",
        }),
    ],
});

class EMissUploaded {
    private baseUrl: string;
    private username: string;
    private password: string;
    private sourceProgram: string;
    private destinationProgram: string;
    private sourceProgramStage: string;
    private destinationProgramStage: string;

    constructor({
        baseUrl,
        destinationProgram,
        password,
        sourceProgram,
        username,
        sourceProgramStage,
        destinationProgramStage,
    }: {
        baseUrl: string;
        username: string;
        password: string;
        sourceProgram: string;
        destinationProgram: string;
        sourceProgramStage: string;
        destinationProgramStage: string;
    }) {
        this.baseUrl = baseUrl;
        this.username = username;
        this.password = password;
        this.destinationProgram = destinationProgram;
        this.sourceProgram = sourceProgram;
        this.sourceProgramStage = sourceProgramStage;
        this.destinationProgramStage = destinationProgramStage;
    }

    private async readEvents({
        orgUnit,
        programStage,
        enrollmentEnrolledAfter,
        enrollmentEnrolledBefore,
        page = 1,
        attribute = "",
        values = [],
    }: {
        orgUnit: string;
        programStage: string;
        enrollmentEnrolledAfter: string;
        enrollmentEnrolledBefore: string;
        page?: number;
        attribute?: string;
        values?: string[];
    }) {
        const endpoint = `${this.baseUrl}/tracker/events.json`;
        const auth = {
            username: this.username,
            password: this.password,
        };
        let params: Record<string, string | number> = {
            programStage,
            orgUnit,
            enrollmentEnrolledAfter,
            enrollmentEnrolledBefore,
            page,
            ouMode: "ALL",
        };

        if (attribute && values.length > 0) {
            params = {
                ...params,
                filterAttributes: `${attribute}:IN:[${values.join(",")}]`,
            };
        }
        const {
            data: { instances },
        } = await axios.get<EventResponse>(endpoint, {
            auth,
            params,
        });
        return instances;
    }

    private async insertData(
        payload: Partial<{ events: Event[] }>,
        params: Record<string, string> = {},
    ) {
        const endpoint = `${this.baseUrl}/tracker`;
        const auth = {
            username: this.username,
            password: this.password,
        };

        const { data } = await axios.post(endpoint, payload, {
            auth,
            params,
        });
        return data;
    }
    private async readTrackedEntities({
        orgUnit,
        program,
        attribute,
        values,
    }: {
        orgUnit: string;
        program: string;
        attribute: string;
        values: string[];
    }) {
        const endpoint = `${this.baseUrl}/tracker/trackedEntities.json`;
        const auth = {
            username: this.username,
            password: this.password,
        };
        let params: Record<string, string> = {
            program,
            orgUnit,
            filter: `${attribute}:IN:${values.join(";")}`,
            fields: "*",
        };
        const {
            data: { instances },
        } = await axios.get<TrackedEntityResponse>(endpoint, {
            auth,
            params,
        });
        return instances;
    }

    private updateMap(
        previousValues: Map<string, string>,
        values: Map<string, string>,
    ) {
        for (const [dataElement, { source }] of Object.entries(
            mapping.RYj89i7ij2d,
        )) {
            const old = values.get(source);
            if (old) {
                previousValues.set(dataElement, old);
            }
        }

        return previousValues;
    }

    public async synchronise(orgUnit: string, page = 1) {
        let total = 1;
        while (total > 0) {
            logger.info(`Fetching destination events page ${page}`);
            const sourceEvents = await this.readEvents({
                orgUnit,
                enrollmentEnrolledAfter: "2022-01-01",
                enrollmentEnrolledBefore: "2022-12-31",
                programStage: this.sourceProgramStage,
                page,
            });
            if (sourceEvents.length > 0) {
                logger.info("Found events");
                const mappedEvents = new Map(
                    sourceEvents.map((a) => [a.trackedEntity, a]),
                );
                logger.info(`Querying instances`);
                const trackedEntities = await this.readTrackedEntities({
                    orgUnit,
                    values: sourceEvents.map(
                        ({ trackedEntity }) => trackedEntity,
                    ),
                    attribute: "ayf47WfcVa4",
                    program: this.destinationProgram,
                });

                const events: Event[] = trackedEntities.flatMap((a) => {
                    const value =
                        a.attributes.find(
                            (current) => current.attribute === "ayf47WfcVa4",
                        )?.value ?? "";

                    const enrollment = a.enrollments.find((a) =>
                        a.enrolledAt.includes("2022-"),
                    );

                    const currentLearnerAnnualInformation =
                        enrollment?.events.find(
                            (a) =>
                                a.programStage === this.destinationProgramStage,
                        );

                    const event = mappedEvents.get(value);

                    const values = new Map(
                        event?.dataValues.map(({ value, dataElement }) => [
                            `${event.programStage}.${dataElement}`,
                            value,
                        ]),
                    );

                    if (
                        enrollment &&
                        currentLearnerAnnualInformation &&
                        event
                    ) {
                        const previousValues = new Map(
                            currentLearnerAnnualInformation.dataValues.map(
                                (dv) => [dv.dataElement, dv.value],
                            ),
                        );
                        this.updateMap(previousValues, values);
                        return {
                            ...currentLearnerAnnualInformation,
                            dataValues: Array.from(
                                previousValues,
                                ([dataElement, value]) => ({
                                    dataElement,
                                    value,
                                }),
                            ),
                        };
                    } else if (enrollment && event) {
                        const { event: e, ...rest } = event;
                        const previousValues: Map<string, string> = new Map();
                        this.updateMap(previousValues, values);
                        return {
                            ...rest,
                            programStage: this.destinationProgramStage,
                            program: this.destinationProgram,
                            enrollment: enrollment.enrollment,
                            dataValues: Array.from(
                                previousValues,
                                ([dataElement, value]) => ({
                                    dataElement,
                                    value,
                                }),
                            ),
                        };
                    }
                    return [];
                });
                if (events.length > 0) {
                    try {
                        const response = await this.insertData(
                            { events },
                            { async: "true" },
                        );
                        logger.info(response);
                    } catch (error) {
                        console.log(JSON.stringify(error.response.data));
                    }
                }
            }
            page = page + 1;
            total = sourceEvents.length;
        }
    }
}

// Usage example
async function main(page: number = 1) {
    const uploader = new EMissUploaded({
        baseUrl: process.env.DHIS2_URL || "",
        username: process.env.DHIS2_USERNAME || "",
        password: process.env.DHIS2_PASSWORD || "",
        sourceProgram: "BGEALv4IpPN",
        destinationProgram: "a6t4ASRXwPZ",
        sourceProgramStage: "m0QNAkI3PKo",
        destinationProgramStage: "RYj89i7ij2d",
    });

    try {
        await uploader.synchronise("wQF07WYTSmo", page);
    } catch (error) {
        console.log(JSON.stringify(error.response.data));
    }
}
// Run the script
main(4304).then(() => console.log("Done"));
