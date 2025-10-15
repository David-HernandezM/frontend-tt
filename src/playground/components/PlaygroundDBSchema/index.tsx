import { useMemo, useState } from 'react';
import { Button } from '../../../shared/Button/Button';
import { Modal } from '../../../shared/Modal';
import { nextPosition, makeFieldId, makeId, nodeTypes } from '../NodeDBTable';
import type { TableData } from '../NodeDBTable';
import type { DataType } from '../../../types';
import {
  ReactFlow, Background, Controls,
  addEdge,
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

/** ---------- helpers lanes/handles ---------- */
const LANE_COUNT = 6;
const HANDLE_SRC_RE = /-in-src-btm-(\d+)$/;
const HANDLE_TGT_RE = /-out-tgt-btm-(\d+)$/;

const fieldIdFromHandle = (h?: string | null) =>
  h ? h.replace(/-(in|out|in-src-btm-\d+|out-tgt-btm-\d+)$/, '') : null;

const isBlue = (h?: string | null) => !!h && h.endsWith('-in');
const isRed  = (h?: string | null) => !!h && h.endsWith('-out');

const laneFromHandle = (h?: string | null) => {
  if (!h) return null;
  const m1 = h.match(HANDLE_SRC_RE);
  if (m1) return parseInt(m1[1], 10);
  const m2 = h.match(HANDLE_TGT_RE);
  return m2 ? parseInt(m2[1], 10) : null;
};

const nextLane = (used: number[], max = LANE_COUNT) => {
  for (let i = 0; i < max; i++) if (!used.includes(i)) return i;
  return used.length % max;
};

/** Aplica tipo a un campo (y marca hasType) */
function applyTypeToField(nodes: Node[], nodeId: string, fieldId: string, type: DataType): Node[] {
  return nodes.map((n) => {
    if (n.id !== nodeId) return n;
    const d = n.data as TableData;
    return {
      ...n,
      data: {
        ...d,
        fields: d.fields.map((f) =>
          f.id === fieldId ? { ...f, dataType: type, hasType: true } : f
        ),
      },
    };
  });
}

/** estilos base/destacado para edges */
const EDGE_BASE = { stroke: '#9aa0a6', strokeWidth: 2 };
const EDGE_HIGHLIGHT = { stroke: '#2563eb', strokeWidth: 3 };

interface Props {
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  onNodesChange: any;
  onEdgesChange: any;
}

export const PlaygroundDBSchema = ({
  nodes, edges, setEdges, setNodes, onEdgesChange, onNodesChange
}: Props) => {

  const [openModal, setOpenModal] = useState(false);

  const addTable = (): void => {
    setNodes((nds) => {
      console.log("NODOS TOTALEEEES: ", nds.length);
      const id = makeId();
      const node: Node = {
        id,
        type: 'table',
        position: nextPosition(nds.length),
        dragHandle: '.drag-handle',
        data: {
          title: `Tabla ${nds.length + 1}`,
          fields: [{ id: makeFieldId(), label: 'Columna1' }],
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

            /** Selección de tipo desde popup.
             *  Si la columna es PK => propagar a columnas conectadas (foráneas).
             */
            onSetDataType: (fieldId: string, type: DataType): void =>
              setNodes((prev) => {
                let next = applyTypeToField(prev, nodeId, fieldId, type);

                const owner = next.find((x) => x.id === nodeId);
                const ownerData = owner?.data as TableData | undefined;
                const updatedField = ownerData?.fields.find((f) => f.id === fieldId);

                if (updatedField?.isPk) {
                  const affectedEdges = edges.filter(
                    (e) => e.target === nodeId && e.targetHandle?.startsWith(`${fieldId}-out-tgt-btm-`)
                  );
                  for (const e of affectedEdges) {
                    const srcNodeId = e.source!;
                    const foreignFieldId = fieldIdFromHandle(e.sourceHandle)!;
                    next = applyTypeToField(next, srcNodeId, foreignFieldId, type);
                  }
                }
                return next;
              }),

            onDeleteField: (fieldId: string): void =>
              setNodes((ns) =>
                ns.map((m) => {
                  if (m.id !== nodeId) return m;
                  const d = m.data as TableData;
                  if (d.fields.length <= 1) return m;
                  return { ...m, data: { ...d, fields: d.fields.filter((f) => f.id !== fieldId) } };
                })
              ),

            /** PK toggle:
             *  - Al apagar la PK: eliminar TODAS las edges que lleguen a esa PK.
             *  - Al encenderla: solo marcamos; las conexiones se crean manualmente.
             */
            onTogglePk: (fieldId: string, value: boolean): void => {
              setNodes((ns) =>
                ns.map((m) => {
                  if (m.id !== nodeId) return m;
                  const d = m.data as TableData;
                  return {
                    ...m,
                    data: { ...d, fields: d.fields.map((f) => (f.id === fieldId ? { ...f, isPk: value } : f)) },
                  };
                })
              );

              if (!value) {
                // quitar edges que apunten a esta PK (nodeId como target)
                setEdges((eds) =>
                  eds
                    .map((e) =>
                      e.target === nodeId && e.targetHandle?.startsWith(`${fieldId}-out-tgt-btm-`)
                        ? null
                        : e
                    )
                    .filter(Boolean) as Edge[]
                );
              }
            },

            onToggleType: (fieldId: string, value: boolean): void =>
              setNodes((ns) =>
                ns.map((m) => {
                  if (m.id !== nodeId) return m;
                  const d = m.data as TableData;
                  return {
                    ...m,
                    data: {
                      ...d,
                      fields: d.fields.map((f) =>
                        f.id === fieldId
                          ? { ...f, hasType: value, dataType: value ? (f.dataType ?? 'INT') : f.dataType }
                          : f
                      ),
                    },
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
                      fields: [...d.fields, { id: makeFieldId(), label: `Columna${idx}` }],
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
                    data: { ...d, fields: d.fields.map((f) => (f.id === fieldId ? { ...f, label: value } : f)) },
                  };
                })
              ),

            onRemove: (): void => {
              setNodes((nds) => nds.filter((m) => m.id !== nodeId));
            },
          } as TableData,
        };
      }),
    [nodes, setNodes, edges]
  );

  /** onConnect: crea edge + hereda tipo desde la PK si ya lo tiene */
  const onConnect = (conn: Connection): void => {
    const sH = conn.sourceHandle ?? '';
    const tH = conn.targetHandle ?? '';

    let blueNodeId: string | null = null;
    let blueFieldId: string | null = null;
    let redNodeId: string | null = null;
    let redFieldId: string | null = null;

    if (isRed(sH) && isBlue(tH)) {
      blueNodeId  = conn.target ?? null;
      blueFieldId = fieldIdFromHandle(tH);
      redNodeId   = conn.source ?? null;
      redFieldId  = fieldIdFromHandle(sH);
    } else if (isBlue(sH) && isRed(tH)) {
      blueNodeId  = conn.source ?? null;
      blueFieldId = fieldIdFromHandle(sH);
      redNodeId   = conn.target ?? null;
      redFieldId  = fieldIdFromHandle(tH);
    } else {
      return;
    }
    if (!blueNodeId || !blueFieldId || !redNodeId || !redFieldId) return;

    // validar PK
    const redNode = nodes.find((n) => n.id === redNodeId);
    const redData = redNode?.data as TableData | undefined;
    const redField = redData?.fields.find((f) => f.id === redFieldId);

    if (!redField?.isPk) {
      setOpenModal(true);
      return;
    }

    // lanes usados
    const usedSrc = edges
      .filter((e) => e.source === blueNodeId && e.sourceHandle?.startsWith(`${blueFieldId}-in-src-btm-`))
      .map((e) => laneFromHandle(e.sourceHandle)!)
      .filter((n) => Number.isFinite(n)) as number[];

    const usedTgt = edges
      .filter((e) => e.target === redNodeId && e.targetHandle?.startsWith(`${redFieldId}-out-tgt-btm-`))
      .map((e) => laneFromHandle(e.targetHandle)!)
      .filter((n) => Number.isFinite(n)) as number[];

    const srcLane = nextLane(usedSrc, LANE_COUNT);
    const tgtLane = nextLane(usedTgt, LANE_COUNT);

    setEdges((eds) =>
      addEdge(
        {
          source: blueNodeId!,
          sourceHandle: `${blueFieldId}-in-src-btm-${srcLane}`,
          target: redNodeId!,
          targetHandle: `${redFieldId}-out-tgt-btm-${tgtLane}`,
          type: 'smart',
          style: EDGE_BASE,
        },
        eds
      )
    );

    // heredar tipo si la PK lo tiene
    if (redField.hasType && redField.dataType) {
      setNodes((prev) => applyTypeToField(prev, blueNodeId!, blueFieldId!, redField.dataType!));
    }
  };

  /** --------- resaltado de edges al seleccionar --------- */
  const onEdgeClick = (_: React.MouseEvent, edge: Edge) => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === edge.id
          ? { ...e, animated: true, style: { ...(e.style ?? {}), ...EDGE_HIGHLIGHT } }
          : { ...e, animated: false, style: { ...(e.style ?? {}), ...EDGE_BASE } }
      )
    );
  };

  const onPaneClick = () => {
    setEdges((eds) =>
      eds.map((e) => ({ ...e, animated: false, style: { ...(e.style ?? {}), ...EDGE_BASE } }))
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
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        fitView
        panOnDrag
      >
        <Background />
        <Controls />
      </ReactFlow>

      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title='Errror:'
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <p
            style={{
              textAlign: 'center',
              color: 'black',
              fontSize: 20,
              padding: "0 50px",
              width: 500
            }}
          >
            No se puede crear la llave foránea, no se encontró ninguna llave primaria
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'end'
            }}
          >
            <Button
              onClick={() => setOpenModal(false)}
            >
              Aceptar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};


// // PlaygroundDBSchema.tsx
// import { useMemo } from 'react';
// import { Button } from '../../../shared/Button/Button';
// import { nextPosition, makeFieldId, makeId, nodeTypes } from '../NodeDBTable';
// import type { TableData } from '../NodeDBTable'; // ✅ este es el tipo correcto
// import {
//   ReactFlow, Background, Controls,
//   useNodesState, useEdgesState, addEdge,
//   ConnectionLineType, type Node, type Edge, type Connection
// } from '@xyflow/react';
// import { MarkerType } from '@xyflow/react';
// import { SmartStepEdge } from '@tisoap/react-flow-smart-edge';
// import styles from './playground_schema.module.css';
// import '@xyflow/react/dist/style.css';

// const defaultEdgeOptions = {
//   type: 'step',
//   markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
//   style: { stroke: '#9aa0a6', strokeWidth: 2 },
//   pathOptions: { offset: 8, borderRadius: 4 },
// } as const;

// const edgeTypes = { smart: SmartStepEdge };

// const initialEdges: Edge[] = [];
// const initialNodes: Node[] = [];

// interface Props {
//   nodes: Node[],
//   edges: Edge[],
//   setNodes: any,
//   setEdges: any,
//   onNodesChange: any,
//   onEdgesChange: any
// }

// export const PlaygroundDBSchema = ({nodes, edges, setEdges, setNodes, onEdgesChange, onNodesChange}: Props) => {
//   // const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
//   // const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

//   const addTable = (): void => {
//     setNodes((nds) => {
//       const id = makeId();
//       const node: Node = {
//         id,
//         type: 'table',
//         position: nextPosition(nds.length),
//         dragHandle: '.drag-handle',
//        data: {
//           title: `Tabla ${nds.length + 1}`,
//           fields: [{ id: makeFieldId(), label: 'Columna 1' }],
//         } as TableData,
//       };
//       return [...nds, node];
//     });
//   };

//   const nodesWithActions: Node[] = useMemo(
//     () =>
//       nodes.map((n) => {
//         if (n.type !== 'table') return n;
//         const nodeId = n.id;

//         return {
//           ...n,
//           data: {
//             ...(n.data as TableData),
//             onSetDataType: (fieldId: string, type: DataType): void =>
//               setNodes(ns => ns.map(m => {
//                 if (m.id !== nodeId) return m;
//                 const d = m.data as TableData;
//                 return {
//                   ...m,
//                   data: {
//                     ...d,
//                     fields: d.fields.map(f => f.id === fieldId ? { ...f, dataType: type, hasType: true } : f)
//                   }
//                 };
//               })),


//             onDeleteField: (fieldId: string): void =>
//               setNodes((ns) =>
//                 ns.map((m) => {
//                   if (m.id !== nodeId) return m;
//                   const d = m.data as TableData;
//                   if (d.fields.length <= 1) return m;
//                   return { ...m, data: { ...d, fields: d.fields.filter((field) => field.id !== fieldId) } };
//                 })
//               ),

//             onTogglePk: (fieldId: string, value: boolean): void =>
//               setNodes((ns) =>
//                 ns.map((m) => {
//                   if (m.id !== nodeId) return m;
//                   const d = m.data as TableData;
//                   return {
//                     ...m,
//                     data: { ...d, fields: d.fields.map((field) => (field.id === fieldId ? { ...field, isPk: value } : field)) },
//                   };
//                 })
//               ),

//             onToggleType: (fieldId: string, value: boolean): void =>
//               setNodes(ns => ns.map(m => {
//                 if (m.id !== nodeId) return m;
//                 const d = m.data as TableData;
//                 return {
//                   ...m,
//                   data: {
//                     ...d,
//                     fields: d.fields.map(f =>
//                       f.id === fieldId ? { ...f, hasType: value, dataType: value ? (f.dataType ?? 'INT') : 'INT' } : f
//                     )
//                   }
//                 };
//               })),

//             onAddField: (): void =>
//               setNodes((nds) =>
//                 nds.map((m) => {
//                   if (m.id !== nodeId) return m;
//                   const d = m.data as TableData;
//                   const idx = d.fields.length + 1;
//                   return {
//                     ...m,
//                     data: {
//                       ...d,
//                       fields: [...d.fields, { id: makeFieldId(), label: `Columna ${idx}` }],
//                     },
//                   };
//                 })
//               ),

//             onRenameTitle: (value: string): void =>
//               setNodes((nds) =>
//                 nds.map((m) => (m.id === nodeId ? { ...m, data: { ...(m.data as TableData), title: value } } : m))
//               ),

//             onRenameField: (fieldId: string, value: string): void =>
//               setNodes((nds) =>
//                 nds.map((m) => {
//                   if (m.id !== nodeId) return m;
//                   const d = m.data as TableData;
//                   return {
//                     ...m,
//                     data: { ...d, fields: d.fields.map((field) => (field.id === fieldId ? { ...field, label: value } : field)) },
//                   };
//                 })
//               ),

//             onRemove: (): void =>
//               setNodes((nds) => nds.filter((m) => m.id !== nodeId)),
//           } as TableData,
//         };
//       }),
//     [nodes, setNodes]
//   );

//   // 👇 Reancla el source al handle inferior si viene del rojo lateral

// const HANDLE_SUFFIX_RE = /-(in|out|in-src-btm|out-tgt-btm)$/;
// // helpers
// const fieldIdFromHandle = (h?: string | null): string | null =>
//   h ? h.replace(/-(in|out|in-src-btm-\d+|out-tgt-btm-\d+)$/, '') : null;

// const isBlue = (h?: string | null) => !!h && h.endsWith('-in');
// const isRed  = (h?: string | null) => !!h && h.endsWith('-out');

// // calcula el siguiente lane disponible 0..LANE_COUNT-1
// const nextLane = (used: number[], max = 6) => {
//   for (let i = 0; i < max; i++) if (!used.includes(i)) return i;
//   return used.length % max; // si están todos ocupados, rota
// };

// const laneFromHandle = (h: string | null | undefined) => {
//   if (!h) return null;
//   const m = h.match(/-(in-src-btm|out-tgt-btm)-(\d+)$/);
//   return m ? parseInt(m[2], 10) : null;
// };

// const onConnect = (conn: Connection): void => {
//   const sH = conn.sourceHandle ?? '';
//   const tH = conn.targetHandle ?? '';

//   // identificar azul y rojo según arrastre
//   let blueNodeId: string | null = null;
//   let blueFieldId: string | null = null;
//   let redNodeId: string | null = null;
//   let redFieldId: string | null = null;

//   if (isRed(sH) && isBlue(tH)) {
//     // arrastraron rojo -> azul
//     blueNodeId  = conn.target ?? null;
//     blueFieldId = fieldIdFromHandle(tH);
//     redNodeId   = conn.source ?? null;
//     redFieldId  = fieldIdFromHandle(sH);
//   } else if (isBlue(sH) && isRed(tH)) {
//     // azul -> rojo
//     blueNodeId  = conn.source ?? null;
//     blueFieldId = fieldIdFromHandle(sH);
//     redNodeId   = conn.target ?? null;
//     redFieldId  = fieldIdFromHandle(tH);
//   } else {
//     return; // inválido
//   }

//   if (!blueNodeId || !blueFieldId || !redNodeId || !redFieldId) return;

//   // validar PK en la columna roja (destino)
//   const redNode = nodes.find((n) => n.id === redNodeId);
//   const redData = redNode?.data as TableData | undefined;
//   const redField = redData?.fields.find((f) => f.id === redFieldId);
//   if (!redField?.isPk) return;

//   // lanes usados actualmente en el ORIGEN (azul) y DESTINO (rojo)
//   const usedSrc = edges
//     .filter((e) => e.source === blueNodeId && e.sourceHandle?.startsWith(`${blueFieldId}-in-src-btm-`))
//     .map((e) => laneFromHandle(e.sourceHandle)!)
//     .filter((n) => Number.isFinite(n)) as number[];

//   const usedTgt = edges
//     .filter((e) => e.target === redNodeId && e.targetHandle?.startsWith(`${redFieldId}-out-tgt-btm-`))
//     .map((e) => laneFromHandle(e.targetHandle)!)
//     .filter((n) => Number.isFinite(n)) as number[];

//   const srcLane = nextLane(usedSrc, 6);
//   const tgtLane = nextLane(usedTgt, 6);

//   setEdges((eds) =>
//     addEdge(
//       {
//         source: blueNodeId,
//         sourceHandle: `${blueFieldId}-in-src-btm-${srcLane}`,
//         target: redNodeId,
//         targetHandle: `${redFieldId}-out-tgt-btm-${tgtLane}`,
//         type: 'smart', // o 'step'
//       },
//       eds
//     )
//   );
// };
//   return (
//     <div className={styles.playground}>
//       <Button onClick={addTable}>Agregar +</Button>

//       <ReactFlow
//         edgeTypes={edgeTypes}
//         nodes={nodesWithActions}
//         edges={edges}
//         defaultEdgeOptions={{ ...defaultEdgeOptions, type: 'smart' }}
//         connectionLineType={ConnectionLineType.Step}
//         nodeTypes={nodeTypes}
//         onNodesChange={onNodesChange}
//         onEdgesChange={onEdgesChange}
//         onConnect={onConnect}
//         fitView
//         panOnDrag
//       >
//         <Background />
//         <Controls />
//       </ReactFlow>
//     </div>
//   );
// };






























