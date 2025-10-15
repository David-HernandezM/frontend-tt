// schemaExport.ts
import type { Node, Edge } from '@xyflow/react';
import { 
  type TableData, 
  // type DataType, 
  makeFieldId, 
  makeNodeId,
  nextPosition
} from '../playground/components/NodeDBTable/';
import type { DataType } from '../types';

export type ExportedColumn = {
  name: string;
  type?: string;          // omitido si no hay tipo
  primaryKey?: true;      // solo aparece si es PK
};

export type ExportedTable = {
  name: string;
  columns: ExportedColumn[];
};

export type ExportedSchema = {
  tables: ExportedTable[];
  sqlQuery: string;
};

const ALLOWED_TYPES: DataType[] = ['INT', 'DATE', 'VARCHAR'];

/**
 * Convierte el estado de React Flow (nodes/edges) + code a un JSON de esquema.
 * - Usa node.data.title como nombre de tabla.
 * - Para cada field: label => name, dataType (si existe) => type (lowercase),
 *   isPk => primaryKey: true.
 * - Omite propiedades extra.
 */
export function buildSchemaJSON(
  nodes: Node[],          // o Node<TableData>[] si ya tipaste los nodos
  _edges: Edge[],         // reservado para futuras FKs
  code: string
): ExportedSchema {
  const tables: ExportedTable[] = [];

  for (const n of nodes) {
    if (n.type !== 'table') continue;

    const data = n.data as TableData | undefined;
    if (!data) continue;

    const tableName = (data.title ?? '').toString().trim() || `tabla_${n.id}`;

    const columns: ExportedColumn[] = (data.fields ?? [])
      .map((field) => {
        const name = (field.label ?? '').toString().trim();
        if (!name) return null; // omite columnas sin nombre

        const col: ExportedColumn = { name };

        // si tiene tipo, lo ponemos en minúsculas
        if (field.hasType && field.dataType) {
          col.type = String(field.dataType).toLowerCase();
        }

        // si es PK, añadimos la bandera
        if (field.isPk) {
          col.primaryKey = true as const;
        }

        return col;
      })
      .filter((c): c is ExportedColumn => !!c);

    tables.push({ name: tableName, columns });
  }

  return {
    tables,
    sqlQuery: code ?? ''
  };
}

function toDataType(t?: string): DataType | undefined {
  if (!t) return undefined;
  const up = t.toUpperCase();
  return (ALLOWED_TYPES as string[]).includes(up) ? (up as DataType) : undefined;
}

/**
 * Convierte el JSON exportado -> { nodes, edges, code } para React Flow.
 * - Crea un nodo 'table' por cada tabla, con sus columnas.
 * - Edges se deja vacío (el JSON actual no trae FKs).
 * - sqlQuery se restaura tal cual.
 */
export function importSchemaJSON(
  input: string | ExportedSchema
): { nodes: Node[]; edges: Edge[]; code: string } {
  const schema: ExportedSchema = typeof input === 'string' ? JSON.parse(input) : input;

  const nodes: Node[] = (schema.tables ?? []).map((table, idx) => {
    const nodeId = makeNodeId();

    const fields = (table.columns ?? []).map((col) => {
      const dt = toDataType(col.type);
      return {
        id: makeFieldId(),
        label: col.name ?? '',
        isPk: !!col.primaryKey,
        hasType: !!dt,
        dataType: dt,
      };
    });

    const data: TableData = {
      title: table.name ?? `Tabla ${idx + 1}`,
      fields,
      onRemove: () => {}
    };

    return {
      id: nodeId,
      type: 'table',
      position: nextPosition(idx),
      dragHandle: '.drag-handle',
      data,
    };
  });

  const edges: Edge[] = []; // el JSON aún no incluye relaciones
  const code = schema.sqlQuery ?? '';

  return { nodes, edges, code };
}

/** Helper opcional para “cargar” directo a tus estados */
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

export const schemaJSONToString = (scchema: ExportedSchema): String => {
    return JSON.stringify(scchema, null, 2);
}