// schemaImport.ts
import type { Node, Edge } from '@xyflow/react';
import type { ExportedSchema } from './schemaToJSON'; 
// import type { TableData, DataType } from '@/playground/components/NodeDBTable';
import type { TableData } from '../playground/components/NodeDBTable';
import type { DataType } from '../types';
// import { makeNodeId, makeFieldId, nextPosition } from '@/playground/components/NodeDBTable';
import { makeNodeId, makeFieldId, nextPosition } from '../playground/components/NodeDBTable';

// Ajusta esta lista a tu unión DataType
const ALLOWED: DataType[] = ['INT', 'DATE', 'VARCHAR' as DataType];

const toDataType = (t?: string): DataType | undefined => {
  const up = (t ?? '').toUpperCase();
  return (ALLOWED as string[]).includes(up) ? (up as DataType) : undefined;
};

// lanes para separar rutas
const LANE_COUNT = 6;
const HANDLE_SRC = (fieldId: string, lane: number) => `${fieldId}-in-src-btm-${lane}`;
const HANDLE_TGT = (fieldId: string, lane: number) => `${fieldId}-out-tgt-btm-${lane}`;
// const laneFromHandle = (h?: string | null) => {
//   if (!h) return null;
//   const m = h.match(/-(in-src-btm|out-tgt-btm)-(\d+)$/);
//   return m ? parseInt(m[2], 10) : null;
// };

const nextLane = (used: number[], max = LANE_COUNT) => {
  for (let i = 0; i < max; i++) if (!used.includes(i)) return i;
  return used.length % max;
};

/**
 * Convierte JSON -> { nodes, edges, code }
 * - Crea nodos y columnas (PK/type).
 * - Reconstruye edges para cada foreignKey.
 */
export function importSchemaJSON(
  input: string | ExportedSchema
): { nodes: Node[]; edges: Edge[]; code: string } {
  const schema: ExportedSchema = typeof input === 'string' ? JSON.parse(input) : input;

  // 1) Crear nodos y mapear nombres/columnas a ids
  const nodes: Node[] = [];
  const nodeIdByTable = new Map<string, string>();
  const fieldIdByTableAndColumn = new Map<string, string>(); // `${table}:${column}` -> fieldId

  (schema.tables ?? []).forEach((table, idx) => {
    const nodeId = makeNodeId();
    const fields = (table.columns ?? []).map((col) => {
      const dt = toDataType(col.type);
      const fieldId = makeFieldId();
      fieldIdByTableAndColumn.set(`${table.name}:${col.name}`, fieldId);

      return {
        id: fieldId,
        label: col.name ?? '',
        isPk: !!col.primaryKey,
        hasType: !!dt,
        dataType: dt,
      };
    });

    const data: TableData = {
      title: table.name ?? `Tabla ${idx + 1}`,
      fields,
      onRemove: () => {}, // placeholder; el padre inyectará acciones
    };

    nodes.push({
      id: nodeId,
      type: 'table',
      position: nextPosition(idx),
      dragHandle: '.drag-handle',
      data,
    });

    nodeIdByTable.set(table.name, nodeId);
  });

  // 2) Crear edges desde columnas con foreignKey
  const edges: Edge[] = [];
  const usedSrcLanes = new Map<string, number[]>(); // `${nodeId}:${fieldId}` -> lanes usados
  const usedTgtLanes = new Map<string, number[]>(); // `${nodeId}:${fieldId}` -> lanes usados

  const pushLane = (map: Map<string, number[]>, key: string, lane: number) => {
    const arr = map.get(key) ?? [];
    arr.push(lane);
    map.set(key, arr);
  };

  (schema.tables ?? []).forEach((table) => {
    const srcNodeId = nodeIdByTable.get(table.name);
    if (!srcNodeId) return;

    (table.columns ?? []).forEach((col) => {
      const fk = (col as any).foreignKey as
        | { referencedTable: string; referencedColumn: string }
        | undefined;
      if (!fk) return;

      const srcFieldId = fieldIdByTableAndColumn.get(`${table.name}:${col.name}`);
      const tgtNodeId = nodeIdByTable.get(fk.referencedTable);
      const tgtFieldId = fieldIdByTableAndColumn.get(`${fk.referencedTable}:${fk.referencedColumn}`);

      if (!srcFieldId || !tgtNodeId || !tgtFieldId) return;

      const srcKey = `${srcNodeId}:${srcFieldId}`;
      const tgtKey = `${tgtNodeId}:${tgtFieldId}`;

      const usedS = usedSrcLanes.get(srcKey) ?? [];
      const usedT = usedTgtLanes.get(tgtKey) ?? [];
      const laneS = nextLane(usedS, LANE_COUNT);
      const laneT = nextLane(usedT, LANE_COUNT);

      edges.push({
        id: `e-${srcNodeId}-${srcFieldId}__${tgtNodeId}-${tgtFieldId}-${laneS}-${laneT}`,
        source: srcNodeId,
        sourceHandle: HANDLE_SRC(srcFieldId, laneS),
        target: tgtNodeId,
        targetHandle: HANDLE_TGT(tgtFieldId, laneT),
        type: 'smart', // o 'step' si no usas smart-edge
      });

      pushLane(usedSrcLanes, srcKey, laneS);
      pushLane(usedTgtLanes, tgtKey, laneT);
    });
  });

  const code = schema.sqlQuery ?? '';
  return { nodes, edges, code };
}

/** Helper opcional */
export function loadSchemaFromJSON(
  input: string | ExportedSchema,
  setNodes: (v: Node[]) => void,
  setEdges: (v: Edge[]) => void,
  setCode: (v: string) => void
) {
  const { nodes, edges, code } = importSchemaJSON(input);
  setNodes(nodes);
  setEdges(edges);
  setCode(code);
}
