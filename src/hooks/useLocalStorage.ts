import * as CryptoJs from "crypto-js";
import type { 
    ExportedSchema,
} from "../utils";

type Flags = {
  openSchemaInstructions: boolean;
  openCodeInstructions: boolean;
}

type StoredData = {
    [key: string]: string
}

type AppStoredData = {
    schemas: StoredData,
    flags: Flags
}

const DEFAULT_FLAGS: Flags = {
  openSchemaInstructions: true,
  openCodeInstructions: true,
};

export const APP_STORED_ID = 'CSQLAR_TT_B123';

const APP_DEFAULT_VALUE: AppStoredData = {
    schemas: {},
    flags: DEFAULT_FLAGS,
};

export const useLocalStorage = () => {
    const checkAndGetLocalStorage = (): AppStoredData | null => {
        let ls = getSafeLocalStorage();

        if (!ls) return null;

        if (!ls.getItem(APP_STORED_ID)) createLocalStorage();

        const appData = getSafeLocalStorage()!.getItem(APP_STORED_ID)!;

        return JSON.parse(appData) as AppStoredData;
    }

    const getSafeLocalStorage = () => {
        return typeof window !== "undefined" ? window.localStorage : null;
    }

    const createLocalStorage = () => {
        const ls = getSafeLocalStorage();

        if (!ls) {
            console.warn("Cant get local storage");
            return;
        }

        try {
            const raw = ls.getItem(APP_STORED_ID);

            if (raw) return;

            ls.setItem(APP_STORED_ID, JSON.stringify(APP_DEFAULT_VALUE));
        } catch(e) {
            console.error(e);
        }
    }

    const openSchemaInstructions = () => {
        const ls = getSafeLocalStorage();

        if (!ls) {
            console.warn("Cant get local storage");
            return false;
        }

        try {
            const data = JSON.parse(ls.getItem(APP_STORED_ID)!) as AppStoredData;
            return data.flags.openSchemaInstructions;
        } catch(e) {
            console.error(e);
            return false;
        }
    }

    const openCodeInstructions = () => {
        const ls = getSafeLocalStorage();

        if (!ls) {
            console.warn("Cant get local storage");
            return false;
        }

        try {
            const data = JSON.parse(ls.getItem(APP_STORED_ID)!) as AppStoredData;
            return data.flags.openCodeInstructions;
        } catch(e) {
            console.error(e);
            return false;
        }
    }

    const setOpenSchemaInstructions = (val: boolean) => {
        const ls = getSafeLocalStorage();

        if (!ls) {
            console.warn("Cant get local storage");
            return;
        }

        try {
            const data = JSON.parse(ls.getItem(APP_STORED_ID)!) as AppStoredData;

            const newData: AppStoredData = {
                ...data,
                flags: {
                    openSchemaInstructions: val,
                    openCodeInstructions: data.flags.openCodeInstructions
                }
            };

            const newVal = JSON.stringify(newData);
            
            ls.setItem(APP_STORED_ID, newVal);
        } catch(e) {
            console.error(e);
            return;
        }
    }

    const setOpenCodeInstructions = (val: boolean) => {
        const ls = getSafeLocalStorage();

        if (!ls) {
            console.warn("Cant get local storage");
            return;
        }

        try {
            const data = JSON.parse(ls.getItem(APP_STORED_ID)!) as AppStoredData;

            const newData: AppStoredData = {
                ...data,
                flags: {
                    openSchemaInstructions: data.flags.openSchemaInstructions,
                    openCodeInstructions: val
                }
            };

            const newVal = JSON.stringify(newData);
            
            ls.setItem(APP_STORED_ID, newVal);
        } catch(e) {
            console.error(e);
            return;
        }
    }

    const getSchemasData = (id: string): string | null => {
        try {
            // const data = JSON.parse(ls.getItem(APP_STORED_ID)!) as AppStoredData;
            const appData = checkAndGetLocalStorage();

            if (!appData) return null;

            const schemaData = appData.schemas[id];

            if (schemaData == null || schemaData == undefined) return null;

            return schemaData;
        } catch(e) {
            console.error(e);
            return null;
        }
    }

    const addSchemaData = (data: ExportedSchema) => {
        const ls = getSafeLocalStorage();

        if (!ls) {
            console.warn("Cant get local storage");
            return false;
        }

        const schemaStr = JSON.stringify(data);
        const schemaId = getSchemaId(data);

        try {
            const data = JSON.parse(ls.getItem(APP_STORED_ID)!) as AppStoredData;
            const { schemas } = data;

            if (schemas[schemaId]) {
                return false;
            }

            const newData: AppStoredData = {
                ...data
            };

            newData.schemas[schemaId] = schemaStr;

            ls.setItem(APP_STORED_ID, JSON.stringify(newData));

            return true;
        } catch(e) {
            console.error(e);
            return false;
        }
    }

    const deleteSchema = (id: string) => {
        const ls = getSafeLocalStorage();

        if (!ls) {
            console.warn("Cant get local storage");
            return false;
        }

        try {
            const data = JSON.parse(ls.getItem(APP_STORED_ID)!) as AppStoredData;
            const { schemas } = data;

            if (!schemas[id]) {
                return false;
            }

            delete schemas[id];

            const newData: AppStoredData = {
                flags: data.flags,
                schemas: {
                    ...schemas
                }
            };

            ls.setItem(APP_STORED_ID, JSON.stringify(newData));
        } catch(e) {
            console.error(e);
            return false;
        }
    }

    const getSchemaId = (data: ExportedSchema): string => {
        const schemaStr = JSON.stringify(data);
        const schemaId = CryptoJs.SHA256(schemaStr).toString();

        return schemaId;
    }

    const getShemasHistory = (): [string, ExportedSchema][] | null => {
        try {
            // const data = JSON.parse(ls.getItem(APP_STORED_ID)!) as AppStoredData;
            const appData = checkAndGetLocalStorage();

            if (!appData) return null;

            let data: [string, ExportedSchema][] = [];

            Object.entries(appData.schemas).forEach(([key, schemaDataString]) => {
                const schemaData = JSON.parse(schemaDataString) as ExportedSchema;

                data.push([key, schemaData]);
            });

            return data;
        } catch(e) {
            console.error(e);
            return null;
        }
    }

    return {
        createLocalStorage,
        openSchemaInstructions,
        openCodeInstructions,
        setOpenSchemaInstructions,
        setOpenCodeInstructions,
        getSchemasData,
        addSchemaData,
        deleteSchema,
        getSchemaId,
        getShemasHistory
    };
}

