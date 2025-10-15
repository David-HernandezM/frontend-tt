// typeMapping.ts
// import type { DataType } from '@/playground/components/NodeDBTable';
// import type { DataType } from "../playground/components/NodeDBTable";
import type { DataType } from "../types";

/** Mapa por defecto: interno -> json */
export const defaultTypeMap: Record<string, string> = {
  INT: 'int',
  DATE: 'date',
  VARCHAR: 'varchar', 
};

/** encoder: DataType interno -> string json (minúsculas) */
export const defaultToJsonType = (dt?: DataType | string): string | undefined => {
  if (!dt) return undefined;
  const key = String(dt).toUpperCase();
  return defaultTypeMap[key] ?? String(dt).toLowerCase();
};

/** decoder: string json -> DataType interno */
export const defaultFromJsonType = (t?: string): DataType | undefined => {
  if (!t) return undefined;
  const up = t.toUpperCase();
  // Si tu DataType es unión cerrada, añade aquí las que aceptas:
  const allowed = ['INT','DATE','VARCHAR'] as const;
  return (allowed as readonly string[]).includes(up) ? (up as DataType) : undefined;
};

/** Permite pasar tus propios normalizadores en runtime */
export type TypeCodec = {
  toJsonType?: (dt?: DataType | string) => string | undefined;
  fromJsonType?: (t?: string) => DataType | undefined;
};
