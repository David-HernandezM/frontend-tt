// PlaygroundDBSchema.tsx
import { useMemo } from 'react';
import { Button } from '../../../shared/Button/Button';
import { nextPosition, makeFieldId, makeId, nodeTypes } from '../NodeDBTable';
import type { TableData } from '../NodeDBTable'; // ✅ este es el tipo correcto
import {
  ReactFlow, Background, Controls,
  useNodesState, useEdgesState, addEdge,
  ConnectionLineType, type Node, type Edge, type Connection
} from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import { SmartStepEdge } from '@tisoap/react-flow-smart-edge';
import styles from './playground_schema.module.css';
import '@xyflow/react/dist/style.css';

const defaultEdgeOptions = {
  type: 'step',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  style: { stroke: '#9aa0a6', strokeWidth: 2 },
  pathOptions: { offset: 8, borderRadius: 4 },
} as const;

const edgeTypes = { smart: SmartStepEdge };

const initialEdges: Edge[] = [];
const initialNodes: Node[] = [];

interface Props {
  nodes: Node[],
  edges: Edge[],
  setNodes: any,
  setEdges: any,
  onNodesChange: any,
  onEdgesChange: any
}

export const PlaygroundDBSchema = ({nodes, edges, setEdges, setNodes, onEdgesChange, onNodesChange}: Props) => {
  // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  // const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const addTable = (): void => {
    setNodes((nds) => {
      const id = makeId();
      const node: Node = {
        id,
        type: 'table',
        position: nextPosition(nds.length),
        dragHandle: '.drag-handle',
       data: {
          title: `Tabla ${nds.length + 1}`,
          fields: [{ id: makeFieldId(), label: 'Columna 1' }],
        } as TableData,
      };
      return [...nds, node];
    });
  };

  const nodesWithActions: Node[] = useMemo(
    () =>
      nodes.map((n) => {
        if (n.type !== 'table') return n;
        const nodeId = n.id;

        return {
          ...n,
          data: {
            ...(n.data as TableData),

            onDeleteField: (fieldId: string): void =>
              setNodes((ns) =>
                ns.map((m) => {
                  if (m.id !== nodeId) return m;
                  const d = m.data as TableData;
                  if (d.fields.length <= 1) return m;
                  return { ...m, data: { ...d, fields: d.fields.filter((field) => field.id !== fieldId) } };
                })
              ),

            onTogglePk: (fieldId: string, value: boolean): void =>
              setNodes((ns) =>
                ns.map((m) => {
                  if (m.id !== nodeId) return m;
                  const d = m.data as TableData;
                  return {
                    ...m,
                    data: { ...d, fields: d.fields.map((field) => (field.id === fieldId ? { ...field, isPk: value } : field)) },
                  };
                })
              ),

            onToggleType: (fieldId: string, value: boolean): void =>
              setNodes((ns) =>
                ns.map((m) => {
                  if (m.id !== nodeId) return m;
                  const d = m.data as TableData;
                  return {
                    ...m,
                    data: { ...d, fields: d.fields.map((field) => (field.id === fieldId ? { ...field, hasType: value } : field)) },
                  };
                })
              ),

            onAddField: (): void =>
              setNodes((nds) =>
                nds.map((m) => {
                  if (m.id !== nodeId) return m;
                  const d = m.data as TableData;
                  const idx = d.fields.length + 1;
                  return {
                    ...m,
                    data: {
                      ...d,
                      fields: [...d.fields, { id: makeFieldId(), label: `Columna ${idx}` }],
                    },
                  };
                })
              ),

            onRenameTitle: (value: string): void =>
              setNodes((nds) =>
                nds.map((m) => (m.id === nodeId ? { ...m, data: { ...(m.data as TableData), title: value } } : m))
              ),

            onRenameField: (fieldId: string, value: string): void =>
              setNodes((nds) =>
                nds.map((m) => {
                  if (m.id !== nodeId) return m;
                  const d = m.data as TableData;
                  return {
                    ...m,
                    data: { ...d, fields: d.fields.map((field) => (field.id === fieldId ? { ...field, label: value } : field)) },
                  };
                })
              ),

            onRemove: (): void =>
              setNodes((nds) => nds.filter((m) => m.id !== nodeId)),
          } as TableData,
        };
      }),
    [nodes, setNodes]
  );

  // 👇 Reancla el source al handle inferior si viene del rojo lateral

const HANDLE_SUFFIX_RE = /-(in|out|in-src-btm|out-tgt-btm)$/;
// helpers
const fieldIdFromHandle = (h?: string | null): string | null =>
  h ? h.replace(/-(in|out|in-src-btm-\d+|out-tgt-btm-\d+)$/, '') : null;

const isBlue = (h?: string | null) => !!h && h.endsWith('-in');
const isRed  = (h?: string | null) => !!h && h.endsWith('-out');

// calcula el siguiente lane disponible 0..LANE_COUNT-1
const nextLane = (used: number[], max = 6) => {
  for (let i = 0; i < max; i++) if (!used.includes(i)) return i;
  return used.length % max; // si están todos ocupados, rota
};

const laneFromHandle = (h: string | null | undefined) => {
  if (!h) return null;
  const m = h.match(/-(in-src-btm|out-tgt-btm)-(\d+)$/);
  return m ? parseInt(m[2], 10) : null;
};

const onConnect = (conn: Connection): void => {
  const sH = conn.sourceHandle ?? '';
  const tH = conn.targetHandle ?? '';

  // identificar azul y rojo según arrastre
  let blueNodeId: string | null = null;
  let blueFieldId: string | null = null;
  let redNodeId: string | null = null;
  let redFieldId: string | null = null;

  if (isRed(sH) && isBlue(tH)) {
    // arrastraron rojo -> azul
    blueNodeId  = conn.target ?? null;
    blueFieldId = fieldIdFromHandle(tH);
    redNodeId   = conn.source ?? null;
    redFieldId  = fieldIdFromHandle(sH);
  } else if (isBlue(sH) && isRed(tH)) {
    // azul -> rojo
    blueNodeId  = conn.source ?? null;
    blueFieldId = fieldIdFromHandle(sH);
    redNodeId   = conn.target ?? null;
    redFieldId  = fieldIdFromHandle(tH);
  } else {
    return; // inválido
  }

  if (!blueNodeId || !blueFieldId || !redNodeId || !redFieldId) return;

  // validar PK en la columna roja (destino)
  const redNode = nodes.find((n) => n.id === redNodeId);
  const redData = redNode?.data as TableData | undefined;
  const redField = redData?.fields.find((f) => f.id === redFieldId);
  if (!redField?.isPk) return;

  // lanes usados actualmente en el ORIGEN (azul) y DESTINO (rojo)
  const usedSrc = edges
    .filter((e) => e.source === blueNodeId && e.sourceHandle?.startsWith(`${blueFieldId}-in-src-btm-`))
    .map((e) => laneFromHandle(e.sourceHandle)!)
    .filter((n) => Number.isFinite(n)) as number[];

  const usedTgt = edges
    .filter((e) => e.target === redNodeId && e.targetHandle?.startsWith(`${redFieldId}-out-tgt-btm-`))
    .map((e) => laneFromHandle(e.targetHandle)!)
    .filter((n) => Number.isFinite(n)) as number[];

  const srcLane = nextLane(usedSrc, 6);
  const tgtLane = nextLane(usedTgt, 6);

  setEdges((eds) =>
    addEdge(
      {
        source: blueNodeId,
        sourceHandle: `${blueFieldId}-in-src-btm-${srcLane}`,
        target: redNodeId,
        targetHandle: `${redFieldId}-out-tgt-btm-${tgtLane}`,
        type: 'smart', // o 'step'
      },
      eds
    )
  );
};
  return (
    <div className={styles.playground}>
      <Button onClick={addTable}>Agregar +</Button>

      <ReactFlow
        edgeTypes={edgeTypes}
        nodes={nodesWithActions}
        edges={edges}
        defaultEdgeOptions={{ ...defaultEdgeOptions, type: 'smart' }}
        connectionLineType={ConnectionLineType.Step}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        panOnDrag
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};






























