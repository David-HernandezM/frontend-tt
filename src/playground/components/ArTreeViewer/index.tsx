import { useState, type MouseEvent } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Edge,
  type Node,
  MarkerType,
  ConnectionLineType,
} from '@xyflow/react';
import { SmartStepEdge } from '@tisoap/react-flow-smart-edge'; // 👈
import '@xyflow/react/dist/style.css';
import cx from 'clsx';

import { stepNodeTypes, type StepNodeData } from '../ArStepNode';
import { buildTreeGraphTopDown, type ArbolPayload } from '../../../utils/buildTreeGraph';
import styles from './ArTreeViewer.module.css';

interface Props {
  data: ArbolPayload;
}

type RFNode = Node<StepNodeData>;

// 👇 registra el edge “smart”
const edgeTypes = { smart: SmartStepEdge };

const defaultEdgeOptions = {
  type: 'smart', // 👈 usa el inteligente por defecto
  markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
  style: { stroke: '#94a3b8', strokeWidth: 2 },
  // para SmartStepEdge puedes pasar opciones de ruta:
  pathOptions: { offset: 8, borderRadius: 4 },
} as const;

export const ArTreeViewer = ({ data }: Props) => {
  const built = buildTreeGraphTopDown(data);

  const [nodes, , onNodesChange] = useNodesState<RFNode>(
    built.nodes as Node<StepNodeData>[]
  );
  const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(built.edges);
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);

  const handleEdgeClick = (_evt: MouseEvent, edge: Edge): void => {
    setActiveEdgeId(edge.id);
  };

  const handlePaneClick = (): void => setActiveEdgeId(null);

  // resalta la arista seleccionada
  const edges: Edge[] = edgesState.map((e) =>
    e.id === activeEdgeId
      ? { ...e, style: { ...e.style, stroke: '#2563eb', strokeWidth: 3 } }
      : e
  );

  return (
    <div className={cx(styles.viewer)}>
      <ReactFlow<RFNode>
        nodes={nodes}
        edges={edges}
        nodeTypes={stepNodeTypes}
        edgeTypes={edgeTypes}                 // 👈 registra smart edge
        defaultEdgeOptions={defaultEdgeOptions} // 👈 flechas + estilo por defecto
        connectionLineType={ConnectionLineType.Step}
        fitView
        panOnDrag
        selectionOnDrag
        elementsSelectable
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgeClick={handleEdgeClick}
        onPaneClick={handlePaneClick}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};
