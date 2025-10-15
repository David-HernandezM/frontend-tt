import type { DataType } from "../types";

export const BASE_URL: string = import.meta.env.VITE_BASE_URL;

export const normalizeDataType = (raw?: string | null): DataType => {
  const v = (raw ?? '').toString().trim().toUpperCase();
  switch (v) {
    case 'VARCHAR':return 'VARCHAR'; 
    case 'DATE':   return 'DATE';
    case 'INT':
    default:       return 'INT';
  }
};
