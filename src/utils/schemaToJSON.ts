// schemaExport.ts
import type { Node, Edge } from '@xyflow/react';
import type { TableData } from '../playground/components/NodeDBTable';

// ----- Tipos de salida -----
type ExportedForeignKey = {
  referencedTable: string;
  referencedColumn: string;
};

export type ExportedColumn = {
  name: string;
  type?: string;
  primaryKey?: true;
  foreignKey?: ExportedForeignKey;
};

export type ExportedTable = {
  name: string;
  columns: ExportedColumn[];
};

export type ExportedSchema = {
  tables: ExportedTable[];
  sqlQuery: string;
};

// ----- helpers para parsear handles -----
const SRC_RE = /-in-src-btm-(\d+)$/;      // azul  (source)
const TGT_RE = /-out-tgt-btm-(\d+)$/;     // rojo  (target)
const fieldIdFromHandle = (h?: string | null) =>
  h ? h.replace(/-(in|out|in-src-btm-\d+|out-tgt-btm-\d+)$/, '') : null;

/**
 * Convierte nodes/edges + code a JSON con:
 * - tables/columns (name, type, primaryKey)
 * - foreignKey { referencedTable, referencedColumn } cuando una columna (source/azul)
 *   se conecta a una PK (target/rojo).
 */
export function buildSchemaJSON(
  nodes: Node[],          // o Node<TableData>[]
  edges: Edge[],
  code: string
): ExportedSchema {
  const tables: ExportedTable[] = [];

  // Índices de ayuda
  const nodeById = new Map<string, Node>();
  const tableNameByNodeId = new Map<string, string>();
  const fieldLabelByNodeIdAndFieldId = new Map<string, string>(); // `${nodeId}:${fieldId}` -> label
  const isPkByNodeIdAndFieldId = new Map<string, boolean>();

  for (const n of nodes) {
    nodeById.set(n.id, n);
    if (n.type !== 'table') continue;

    const data = n.data as TableData | undefined;
    if (!data) continue;

    const tableName = (data.title ?? '').toString().trim() || `tabla_${n.id}`;
    tableNameByNodeId.set(n.id, tableName);

    for (const field of data.fields ?? []) {
      fieldLabelByNodeIdAndFieldId.set(`${n.id}:${field.id}`, field.label ?? '');
      isPkByNodeIdAndFieldId.set(`${n.id}:${field.id}`, !!field.isPk);
    }
  }

  // Construimos un índice de FK por campo-origen:
  // source: azul  (nodeId/fieldId desde sourceHandle)
  // target: rojo  (nodeId/fieldId desde targetHandle)
  // Guardamos: `${srcNodeId}:${srcFieldId}` -> { refTable, refColumn }
  const fkBySource = new Map<
    string,
    { referencedTable: string; referencedColumn: string }
  >();

  for (const e of edges) {
    if (!e.source || !e.target || !e.sourceHandle || !e.targetHandle) continue;
    if (!SRC_RE.test(e.sourceHandle) || !TGT_RE.test(e.targetHandle)) continue;

    const srcFieldId = fieldIdFromHandle(e.sourceHandle);
    const tgtFieldId = fieldIdFromHandle(e.targetHandle);
    if (!srcFieldId || !tgtFieldId) continue;

    const srcNodeId = e.source;
    const tgtNodeId = e.target;

    const refTable = tableNameByNodeId.get(tgtNodeId);
    const refColumn = fieldLabelByNodeIdAndFieldId.get(`${tgtNodeId}:${tgtFieldId}`);
    const targetIsPk = isPkByNodeIdAndFieldId.get(`${tgtNodeId}:${tgtFieldId}`);

    // Sólo consideramos FK válidas cuando el destino es PK
    if (!refTable || !refColumn || !targetIsPk) continue;

    fkBySource.set(`${srcNodeId}:${srcFieldId}`, {
      referencedTable: refTable,
      referencedColumn: refColumn,
    });
  }

  // Recorremos tablas/columnas para export final
  for (const n of nodes) {
    if (n.type !== 'table') continue;

    const data = n.data as TableData | undefined;
    if (!data) continue;

    const tableName = tableNameByNodeId.get(n.id)!;

    const columns: ExportedColumn[] = (data.fields ?? [])
      .map((field) => {
        const name = (field.label ?? '').toString().trim();
        if (!name) return null;

        const out: ExportedColumn = { name };

        if (field.hasType && field.dataType) {
          out.type = String(field.dataType).toLowerCase();
        }
        if (field.isPk) {
          out.primaryKey = true as const;
        }

        const fk = fkBySource.get(`${n.id}:${field.id}`);
        if (fk) {
          out.foreignKey = fk;
        }

        return out;
      })
      .filter(Boolean) as ExportedColumn[];

    tables.push({ name: tableName, columns });
  }

  return {
    tables,
    sqlQuery: code ?? '',
  };
}

export const schemaJSONToString = (schema: ExportedSchema): string =>
  JSON.stringify(schema, null, 2);
