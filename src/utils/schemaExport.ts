// buildSchemaJSON.ts
import type { Node, Edge } from '@xyflow/react';
import type { TableData } from '../playground/components/NodeDBTable/';
import { normalizeDataType } from '../shared/consts';
// import { normalizeDataType } from '../types'; 

export type ExportedColumn = {
  name: string;
  type: string;  // siempre presente (lowercase)
  primaryKey?: true;
  foreignKey?: { referencedTable: string; referencedColumn: string };
};

export type ExportedTable = { name: string; columns: ExportedColumn[] };
export type ExportedSchema = { tables: ExportedTable[]; sqlQuery: string };

// helpers (ajústalos si tus ids/handles cambian)
// const HANDLE_SRC_RE = /-in-src-btm-(\d+)$/;        // azul (source inferior)
// const HANDLE_TGT_RE = /-out-tgt-btm-(\d+)$/;       // rojo (target inferior)
const fieldIdFromHandle = (h?: string | null) =>
  h ? h.replace(/-(in|out|in-src-btm-\d+|out-tgt-btm-\d+)$/, '') : null;

// export function buildSchemaJSON(
//   nodes: Node[],
//   edges: Edge[],
//   code: string
// ): ExportedSchema {
//   // 1) índices útiles
// //   const nodeById = new Map(nodes.map(n => [n.id, n]));
//   const tableNameByNodeId = new Map<string, string>();
//   const fieldLabelByNodeAndFieldId = new Map<string, string>(); // key: `${nodeId}:${fieldId}`

//   for (const n of nodes) {
//     if (n.type !== 'table') continue;
//     const data = n.data as TableData | undefined;
//     if (!data) continue;

//     const tableName = (data.title ?? '').toString().trim() || `tabla_${n.id}`;
//     tableNameByNodeId.set(n.id, tableName);

//     for (const f of (data.fields ?? [])) {
//       const k = `${n.id}:${f.id}`;
//       fieldLabelByNodeAndFieldId.set(k, (f.label ?? '').toString());
//     }
//   }

//   // 2) mapear FKs desde edges: azul (source) -> rojo (target)
//   //    FK para la columna del lado azul: (tabla azul, col azul) -> (tabla roja, col roja)
//   const fkByLocal = new Map<
//     string, // `${srcNodeId}:${srcFieldId}`
//     { referencedTable: string; referencedColumn: string }
//   >();

//   for (const e of edges) {
//     const srcNodeId = e.source!;
//     const tgtNodeId = e.target!;
//     const srcFieldId = fieldIdFromHandle(e.sourceHandle) || '';
//     const tgtFieldId = fieldIdFromHandle(e.targetHandle) || '';
//     if (!srcNodeId || !tgtNodeId || !srcFieldId || !tgtFieldId) continue;

//     // nombres de tabla y columna referenciada
//     const refTable = tableNameByNodeId.get(tgtNodeId);
//     const refCol = fieldLabelByNodeAndFieldId.get(`${tgtNodeId}:${tgtFieldId}`);
//     if (!refTable || !refCol) continue;

//     fkByLocal.set(`${srcNodeId}:${srcFieldId}`, {
//       referencedTable: refTable,
//       referencedColumn: refCol,
//     });
//   }

//   // 3) construir JSON
//   const tables: ExportedTable[] = [];

//   for (const n of nodes) {
//     if (n.type !== 'table') continue;

//     const data = n.data as TableData | undefined;
//     if (!data) continue;

//     const tableName = tableNameByNodeId.get(n.id)!;
//     const columns: ExportedColumn[] = (data.fields ?? [])
//       .map((field) => {
//         const name = (field.label ?? '').toString().trim();
//         if (!name) return null;

//         const dt = normalizeDataType(field.dataType ?? 'INT');

//         const col: ExportedColumn = {
//           name,
//           type: dt.toLowerCase(),
//         };
//         if (field.isPk) col.primaryKey = true;

//         const fk = fkByLocal.get(`${n.id}:${field.id}`);
//         if (fk) col.foreignKey = fk;

//         return col;
//       })
//       .filter((c): c is ExportedColumn => !!c);

//     tables.push({ name: tableName, columns });
//   }

//   return { tables, sqlQuery: code ?? '' };
// }

export function buildSchemaJSON(
  nodes: Node[],
  edges: Edge[],
  code: string
): ExportedSchema {
  const tableNameByNodeId = new Map<string, string>();
  const fieldLabelByNodeAndFieldId = new Map<string, string>();

  for (const n of nodes) {
    if (n.type !== 'table') continue;
    const data = n.data as TableData | undefined;
    if (!data) continue;

    const tableName = (data.title ?? '').toString().trim() || `tabla_${n.id}`;
    tableNameByNodeId.set(n.id, tableName);

    for (const f of (data.fields ?? [])) {
      const k = `${n.id}:${f.id}`;
      fieldLabelByNodeAndFieldId.set(k, (f.label ?? '').toString());
    }
  }

  const fkByLocal = new Map<string, { referencedTable: string; referencedColumn: string }>();

  for (const e of edges) {
    const srcNodeId = e.source!;
    const tgtNodeId = e.target!;
    const srcFieldId = fieldIdFromHandle(e.sourceHandle) || '';
    const tgtFieldId = fieldIdFromHandle(e.targetHandle) || '';
    if (!srcNodeId || !tgtNodeId || !srcFieldId || !tgtFieldId) continue;

    const refTable = tableNameByNodeId.get(tgtNodeId);
    const refCol = fieldLabelByNodeAndFieldId.get(`${tgtNodeId}:${tgtFieldId}`);
    if (!refTable || !refCol) continue;

    fkByLocal.set(`${srcNodeId}:${srcFieldId}`, {
      referencedTable: refTable,
      referencedColumn: refCol,
    });
  }

  const tables: ExportedTable[] = [];

  for (const n of nodes) {
    if (n.type !== 'table') continue;

    const data = n.data as TableData | undefined;
    if (!data) continue;

    const tableName = tableNameByNodeId.get(n.id)!;
    const columns: ExportedColumn[] = (data.fields ?? [])
      .map((field) => {
        const name = (field.label ?? '').toString().trim();
        if (!name) return null;

        const dt = normalizeDataType(field.dataType ?? 'INT');
        const col: ExportedColumn = {
          name,
          type: dt.toLowerCase(),
        };
        if (field.isPk) col.primaryKey = true;

        const fk = fkByLocal.get(`${n.id}:${field.id}`);
        if (fk) col.foreignKey = fk;

        return col;
      })
      .filter((c): c is ExportedColumn => !!c);

    tables.push({ name: tableName, columns });
  }

  return { tables, sqlQuery: code ?? '' };
}
