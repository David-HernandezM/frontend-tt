// importSchemaJSON.ts
import type { Node, Edge } from '@xyflow/react';
import { makeNodeId, makeFieldId, nextPosition } from '../playground/components/NodeDBTable';
import type { TableData } from '../playground/components/NodeDBTable';
import type { ExportedSchema } from './schemaExport';
import { normalizeDataType } from '../shared/consts';
// import { normalizeDataType } from '../types';

// const LANE_COUNT = 9999; // práctico infinito (o calcula dinámico si prefieres)
const HANDLE_SRC = (fieldId: string, lane: number) => `${fieldId}-in-src-btm-${lane}`;
const HANDLE_TGT = (fieldId: string, lane: number) => `${fieldId}-out-tgt-btm-${lane}`;
const laneFromHandle = (h?: string | null) => {
  if (!h) return null;
  const m = h.match(/-(in-src-btm|out-tgt-btm)-(\d+)$/);
  return m ? parseInt(m[2], 10) : null;
};
const nextLane = (used: number[]) => {
  // primer hueco libre
  let i = 0;
  for (;; i++) if (!used.includes(i)) return i;
};

export function importSchemaJSON(
  input: string | ExportedSchema
): { nodes: Node[]; edges: Edge[]; code: string } {
  const schema: ExportedSchema = typeof input === 'string' ? JSON.parse(input) : input;

  // 1) crear nodos (tipos: si es int → no mostrar tipo seleccionado)
  const nodes: Node[] = (schema.tables ?? []).map((table, idx) => {
    const nodeId = makeNodeId();

    const fields = (table.columns ?? []).map((col) => {
      const dt = normalizeDataType(col.type ?? 'INT');
      const isDefault = dt === 'INT';
      return {
        id: makeFieldId(),
        label: col.name ?? '',
        isPk: !!col.primaryKey,
        hasType: !isDefault,         // no mostrar badge si es INT default
        dataType: isDefault ? undefined : dt,
      };
    });

    const data: TableData = {
      title: table.name ?? `Tabla ${idx + 1}`,
      fields,
      onRemove: () => {},
    };

    return {
      id: nodeId,
      type: 'table',
      position: nextPosition(idx),
      dragHandle: '.drag-handle',
      data,
    };
  });

  // índices de búsqueda por nombre para reconstruir FKs
  const nodeIdByTableName = new Map<string, string>();
  const fieldIdByTableAndColumn = new Map<string, string>(); // `${table}:${column}` -> fieldId

  for (const n of nodes) {
    if (n.type !== 'table') continue;
    const data = n.data as TableData;
    nodeIdByTableName.set(data.title, n.id);
    for (const f of data.fields) {
      fieldIdByTableAndColumn.set(`${data.title}:${f.label}`, f.id);
    }
  }

  // 2) crear edges a partir de foreignKey
  const edges: Edge[] = [];
  for (const table of (schema.tables ?? [])) {
    for (const col of (table.columns ?? [])) {
      const fk = (col as any).foreignKey as { referencedTable: string; referencedColumn: string } | undefined;
      if (!fk) continue;

      const childNodeId = nodeIdByTableName.get(table.name);
      const childFieldId = fieldIdByTableAndColumn.get(`${table.name}:${col.name}`);
      const parentNodeId = nodeIdByTableName.get(fk.referencedTable);
      const parentFieldId = fieldIdByTableAndColumn.get(`${fk.referencedTable}:${fk.referencedColumn}`);

      if (!childNodeId || !childFieldId || !parentNodeId || !parentFieldId) continue;

      // elegir lane libre en origen (azul) y destino (rojo)
      const usedSrc = edges
        .filter(e => e.source === childNodeId && e.sourceHandle?.startsWith(`${childFieldId}-in-src-btm-`))
        .map(e => laneFromHandle(e.sourceHandle)!)
        .filter(Number.isFinite) as number[];
      const usedTgt = edges
        .filter(e => e.target === parentNodeId && e.targetHandle?.startsWith(`${parentFieldId}-out-tgt-btm-`))
        .map(e => laneFromHandle(e.targetHandle)!)
        .filter(Number.isFinite) as number[];

      const srcLane = nextLane(usedSrc);
      const tgtLane = nextLane(usedTgt);

      edges.push({
        id: `e-${childNodeId}-${childFieldId}-${parentNodeId}-${parentFieldId}-${srcLane}-${tgtLane}`,
        source: childNodeId,
        sourceHandle: HANDLE_SRC(childFieldId, srcLane),
        target: parentNodeId,
        targetHandle: HANDLE_TGT(parentFieldId, tgtLane),
        type: 'smart', // o 'step' según tu config
      });
    }
  }

  const code = schema.sqlQuery ?? '';
  return { nodes, edges, code };
}