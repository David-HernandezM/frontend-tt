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
import styles from './playground_schema.module.css';
import '@xyflow/react/dist/style.css';
import { SmoothStepEdge, type EdgeProps } from '@xyflow/react';

const errors = [
  "No se puede crear la llave foránea, no se encontró ninguna llave primaria.",
  "Solo se puede crear un máximo de 15 tablas.",
  "Solo se pueden asignar un máximo de 15 columnas a cada tabla.",
  "No se puede dejar en blanco el nombre de una tabla o columna.",
];

export const OffsetSmoothStepEdge = (props: EdgeProps) => {
  const offset = (props.data?.offset as number) ?? 0;
  const borderRadius = (props.data?.borderRadius as number) ?? 10;

  return (
    <SmoothStepEdge
      {...props}
      pathOptions={{ offset, borderRadius }}
    />
  );
};

const defaultEdgeOptions = {
  type: 'osmooth', //'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  style: { stroke: '#9aa0a6', strokeWidth: 2 },
  // pathOptions: { offset: 12, borderRadius: 6 },
  // pathOptions: { borderRadius: 10 },
} as const;

// const edgeTypes = { smart: SmartStepEdge };
const edgeTypes = { osmooth: OffsetSmoothStepEdge };

/** ---------- helpers lanes/handles ---------- */
// const LANE_COUNT = 6;
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
  nameIsEmpty: (val: boolean) => void
}

export const PlaygroundDBSchema = ({
  nodes, edges, setEdges, setNodes, onEdgesChange, onNodesChange, nameIsEmpty
}: Props) => {

  const [openModal, setOpenModal] = useState(false);
  const [errorIndex, setErrorIndex] = useState(0);
  const [tableIndexTitleIsWhite, setTableIndexTitleIsWhite] = useState<string[]>([]);
  const [columnIndexEmptyName, setColumnIndexEmptyName] = useState<string[]>([]);

  const addTable = (): void => {
    setNodes((nds) => {
      console.log("NODOS TOTALEEEES: ", nds.length);

      if (nds.length == 15) {
        setErrorIndex(1);
        setOpenModal(true);
        return nds;
      };

      const id = makeId();
      const node: Node = {
        id,
        type: 'table',
        position: nextPosition(nds.length),
        dragHandle: '.drag-handle',
        data: {
          title: `tabla${nds.length + 1}`,
          fields: [{ id: makeFieldId(), label: 'Columna1' }],
        } as TableData,
      };
      return [...nds, node];
    });
  };

    // 👇 helpers para saber si un field es FK (tiene edges saliendo)
  const isFieldFK = (nodeId: string, fieldId: string): boolean =>
    edges.some(
      (e) =>
        e.source === nodeId &&
        e.sourceHandle?.startsWith(`${fieldId}-in-src-btm-`)
    );

  // 👇 (opcional) cuántos edges salen/entran por field — lo usamos en #2
  const degreeMaps = (() => {
    const outDeg = new Map<string, number>(); // key: `${nodeId}:${fieldId}`
    const inDeg  = new Map<string, number>(); // key: `${nodeId}:${fieldId}`

    for (const e of edges) {
      const srcField = e.sourceHandle?.replace(/-(in|out|in-src-btm-\d+|out-tgt-btm-\d+)$/, '') || '';
      const tgtField = e.targetHandle?.replace(/-(in|out|in-src-btm-\d+|out-tgt-btm-\d+)$/, '') || '';
      if (srcField) {
        const k = `${e.source}:${srcField}`;
        outDeg.set(k, (outDeg.get(k) ?? 0) + 1);
      }
      if (tgtField) {
        const k = `${e.target}:${tgtField}`;
        inDeg.set(k, (inDeg.get(k) ?? 0) + 1);
      }
    }
    return { outDeg, inDeg };
  })();

  const nodesWithActions: Node[] = useMemo(
    () =>
      nodes.map((n) => {
        if (n.type !== 'table') return n;
        const nodeId = n.id;

        return {
          ...n,
          data: {
            ...(n.data as TableData),
            isTypeLocked: (fieldId: string) => isFieldFK(nodeId, fieldId),
            lanesFor: (fieldId: string) => {
              const out = degreeMaps.outDeg.get(`${nodeId}:${fieldId}`) ?? 0;
              const inn = degreeMaps.inDeg.get(`${nodeId}:${fieldId}`) ?? 0;
              // deja un margen extra para que no se peguen
              return {
                src: Math.max(6, out + 2),
                tgt: Math.max(6, inn + 2),
              };
            },




            onSetDataType: (fieldId: string, type: DataType): void =>
              setNodes((prev) => {
                if (isFieldFK(nodeId, fieldId)) return prev;

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
              setNodes((ns) => {
                if (isFieldFK(nodeId, fieldId)) return ns;

                return ns.map((m) => {
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
              }),

            onAddField: (): void =>
              setNodes((nds) =>
                nds.map((m) => {
                  if (m.id !== nodeId) return m;
                  const d = m.data as TableData;
                  const idx = d.fields.length + 1;

                  if (d.fields.length > 9) {
                    setErrorIndex(2);
                    setOpenModal(true);
                    return m;
                  }

                  return {
                    ...m,
                    data: {
                      ...d,
                      fields: [...d.fields, { id: makeFieldId(), label: `Columna${idx}` }],
                    },
                  };
                })
              ),

            onRenameTitle: (value: string): void => {
              if (value.length > 30) return;

              let tableId: null | string = null;

              setNodes((nds) =>
                nds.map((m) => {
                  if (m.id === nodeId) {tableId = m.id};
                  return (m.id === nodeId ? { ...m, data: { ...(m.data as TableData), title: value } } : m);
                })
              )

              if (tableId && value.trim().length == 0) {
                let values = [
                  ...tableIndexTitleIsWhite,
                  tableId
                ]

                setTableIndexTitleIsWhite(values);

                nameIsEmpty(columnIndexEmptyName.length > 0 || values.length > 0);

              } else if (tableId && value.trim().length > 0) {
                const values = tableIndexTitleIsWhite.filter(value => value != tableId);
                
                setTableIndexTitleIsWhite(
                  values
                );

                nameIsEmpty(columnIndexEmptyName.length > 0 || values.length > 0);
              }
            },

            onRenameField: (fieldId: string, value: string): void => {
              if (value.length > 20) return;

              setNodes((nds) =>
                nds.map((m) => {
                  if (m.id !== nodeId) return m;
                  const d = m.data as TableData;
                  return {
                    ...m,
                    data: { ...d, fields: d.fields.map((f) => (f.id === fieldId ? { ...f, label: value } : f)) },
                  };
                })
              );

              if (value.trim().length == 0) {
                let values = [
                  ...columnIndexEmptyName,
                  fieldId
                ];

                setColumnIndexEmptyName(values);

                nameIsEmpty(values.length > 0 || tableIndexTitleIsWhite.length > 0);
              } else {
                let values = columnIndexEmptyName.filter(value => value != fieldId);
                setColumnIndexEmptyName(
                  values
                );

                nameIsEmpty(values.length > 0 || tableIndexTitleIsWhite.length > 0);
              }
            },

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
      setErrorIndex(0);
      setOpenModal(true);
      return;
    }

    const pkType = redField.dataType ?? 'INT'; // Si no tiene tipo, asignamos "INT"

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id !== blueNodeId) return node;
        const data = node.data as TableData;
        return {
          ...node,
          data: {
            ...data,
            fields: data.fields.map((field) => {
              if (field.id === blueFieldId) {
                // Asignamos el tipo de la PK a la FK
                return { ...field, dataType: pkType, hasType: true };
              }
              return field;
            }),
          },
        };
      })
    );

    // lanes usados
    const srcMax = (degreeMaps.outDeg.get(`${blueNodeId}:${blueFieldId}`) ?? 0) + 2;
    const tgtMax = (degreeMaps.inDeg.get(`${redNodeId}:${redFieldId}`) ?? 0) + 2;
    const maxSrc = Math.max(6, srcMax);
    const maxTgt = Math.max(6, tgtMax);

    const nextLane = (used: number[], max: number) => {
      for (let i = 0; i < max; i++) if (!used.includes(i)) return i;
      return used.length % max; // fallback
    };

    const usedSrc = edges
      .filter((e) => e.source === blueNodeId && e.sourceHandle?.startsWith(`${blueFieldId}-in-src-btm-`))
      .map((e) => laneFromHandle(e.sourceHandle)!)
      .filter((n) => Number.isFinite(n)) as number[];

    const usedTgt = edges
      .filter((e) => e.target === redNodeId && e.targetHandle?.startsWith(`${redFieldId}-out-tgt-btm-`))
      .map((e) => laneFromHandle(e.targetHandle)!)
      .filter((n) => Number.isFinite(n)) as number[];

    // const srcLane = nextLane(usedSrc, LANE_COUNT);
    // const tgtLane = nextLane(usedTgt, LANE_COUNT);
    const srcLane = nextLane(usedSrc, maxSrc);
    const tgtLane = nextLane(usedTgt, maxTgt);

    const lane = Math.max(srcLane, tgtLane);      // un índice estable por arista
    const LANE_OFFSET = 10;                        // separación entre líneas en el trayecto

    setEdges((eds) =>
      addEdge(
        {
          source: blueNodeId!,
          sourceHandle: `${blueFieldId}-in-src-btm-${srcLane}`,
          target: redNodeId!,
          targetHandle: `${redFieldId}-out-tgt-btm-${tgtLane}`,
          type: 'osmooth', //'smoothstep', //'smart',
          // pathOptions: { offset: 8 + lane * LANE_OFFSET, borderRadius: 10 },
          // pathOptions: { offset: 8 + lane * LANE_OFFSET, borderRadius: 10 },
          data: { offset: 8 + lane * LANE_OFFSET, borderRadius: 10 },
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

  /** --------- resaltado de edges --------- */
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
        defaultEdgeOptions={{
          ...defaultEdgeOptions,
          // type: 'smart',
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange  }
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
            {/* No se puede crear la llave foránea, no se encontró ninguna llave primaria */}
            { errors[errorIndex] }
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





















