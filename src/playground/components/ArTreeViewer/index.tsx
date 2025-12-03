// ArTreeViewer.tsx
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
import { SmartStepEdge } from '@tisoap/react-flow-smart-edge';
import '@xyflow/react/dist/style.css';
import cx from 'clsx';

import { stepNodeTypes, type StepNodeData } from '../ArStepNode';
// import { buildTreeGraphTopDown, type ArbolPayload } from '../../../utils/buildTreeGraphTopDown';
import { 
  buildTreeGraphTopDown, 
  type ArbolPayload, 
  //layoutWithRealSizes 
} from '../../../utils/buildTreeGraph';
import styles from './ArTreeViewer.module.css';

interface Props {
  data: ArbolPayload;
}

type RFNode = Node<StepNodeData>;

const edgeTypes = { smart: SmartStepEdge };

const defaultEdgeOptions = {
  type: 'smart',
  markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
  style: { stroke: '#94a3b8', strokeWidth: 2 },
  pathOptions: { offset: 8, borderRadius: 4 },
} as const;


export const ArTreeViewer = ({ data }: Props) => {
  const built = buildTreeGraphTopDown(data);

  const [nodes, , onNodesChange] = useNodesState<RFNode>(
    built.nodes as Node<StepNodeData>[]
  );
  const [
    edgesState, 
    _setEdgesState, 
    onEdgesChange] = useEdgesState(built.edges);
  const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);

  const handleEdgeClick = (_evt: MouseEvent, edge: Edge): void => {
    setActiveEdgeId(edge.id);
  };

  const handlePaneClick = (): void => setActiveEdgeId(null);

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
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
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



// export const ArTreeViewer = ({ data }: Props) => {
//   const built = buildTreeGraphTopDown(data);
//   const { getNodes } = useReactFlow<RFNode>();

//   const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>(
//     built.nodes as Node<StepNodeData>[]
//   );
//   const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(built.edges);
//   const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);

//   const handleEdgeClick = (_evt: MouseEvent, edge: Edge): void => {
//     setActiveEdgeId(edge.id);
//   };

//   const handlePaneClick = (): void => setActiveEdgeId(null);

//   const edges: Edge[] = edgesState.map((e) =>
//     e.id === activeEdgeId
//       ? { ...e, style: { ...e.style, stroke: '#2563eb', strokeWidth: 3 } }
//       : e
//   );

//     useEffect(() => {
//     const rfNodes = getNodes();
//     if (!rfNodes.length) return;

//     // ¿ya están todos medidos?
//     const allMeasured = rfNodes.every(
//       (n) => n.measured?.width && n.measured?.height
//     );
//     if (!allMeasured) return;

//     // tamaños reales
//     const sizeById = new Map<string, { width: number; height: number }>();
//     rfNodes.forEach((n) => {
//       const w = n.measured!.width;
//       const h = n.measured!.height;
//       sizeById.set(n.id, { width: w, height: h });
//     });

//     const positions = layoutWithRealSizes(data, sizeById, {
//       hGap: 80,
//       vGap: 160, // un poco más de espacio vertical
//     });

//     // calculamos nuevas posiciones y solo hacemos setNodes si cambian
//     let changed = false;
//     const newNodes = nodes.map((n) => {
//       const pos = positions.get(n.id);
//       if (!pos) return n;

//       if (n.position.x !== pos.x || n.position.y !== pos.y) {
//         changed = true;
//         return { ...n, position: pos };
//       }
//       return n;
//     });

//     if (changed) {
//       setNodes(newNodes);
//     }
//   }, [nodes, data, getNodes, setNodes]);


//   return (
//     <div className={cx(styles.viewer)}>
//       <ReactFlow<RFNode>
//         nodes={nodes}
//         edges={edges}
//         nodeTypes={stepNodeTypes}
//         edgeTypes={edgeTypes}
//         defaultEdgeOptions={defaultEdgeOptions}
//         connectionLineType={ConnectionLineType.Step}
//         fitView
//         panOnDrag
//         selectionOnDrag
//         elementsSelectable
//         onNodesChange={onNodesChange}
//         onEdgesChange={onEdgesChange}
//         onEdgeClick={handleEdgeClick}
//         onPaneClick={handlePaneClick}
//         proOptions={{ hideAttribution: true }}
//       >
//         <Background />
//         <Controls />
//       </ReactFlow>
//     </div>
//   );
// };



















// // Dentro de ArTreeViewer.tsx (arriba del componente)

// import type { Edge, Node } from '@xyflow/react';
// import type { StepNodeData } from '../ArStepNode';


// type RFNode = Node<StepNodeData>;

// type LayoutOpts = {
//   hGap?: number;
//   vGap?: number;
// };


// function computeTreeLayoutFromRF(
//   nodes: RFNode[],
//   edges: Edge[],
//   opts: LayoutOpts = {}
// ): Record<string, { x: number; y: number }> {
//   const hGap = opts.hGap ?? 80;  // separación horizontal mínima
//   const vGap = opts.vGap ?? 80;  // separación vertical mínima

//   if (!nodes.length) return {};

//   // Index rápido
//   const nodeById = new Map<string, RFNode>();
//   nodes.forEach((n) => nodeById.set(n.id, n));

//   // Raíz = nodo con data.isRoot === true
//   const root = nodes.find((n) => (n.data as StepNodeData).isRoot);
//   if (!root) return {};

//   const rootId = root.id;

//   const childrenOf = (id: string) =>
//     edges.filter((e) => e.source === id).map((e) => e.target);

//   // 1) niveles por BFS
//   const levelOf = new Map<string, number>();
//   const queue: string[] = [rootId];
//   levelOf.set(rootId, 0);

//   while (queue.length) {
//     const cur = queue.shift()!;
//     const lvl = levelOf.get(cur)!;
//     for (const ch of childrenOf(cur)) {
//       if (!levelOf.has(ch)) {
//         levelOf.set(ch, lvl + 1);
//         queue.push(ch);
//       }
//     }
//   }

//   // 2) agrupar ids por nivel
//   const levels: string[][] = [];
//   for (const [id, lvl] of levelOf.entries()) {
//     if (!levels[lvl]) levels[lvl] = [];
//     levels[lvl].push(id);
//   }

//   // 3) calcular posiciones usando width/height reales
//   const positions: Record<string, { x: number; y: number }> = {};
//   let currentY = 0;

//   levels.forEach((ids, lvl) => {
//     if (!ids || ids.length === 0) return;

//     // anchos y altos por nodo en el nivel
//     const widths = ids.map(
//       (id) => nodeById.get(id)?.width ?? 300
//     );
//     const heights = ids.map(
//       (id) => nodeById.get(id)?.height ?? 140
//     );

//     const levelMaxH = heights.reduce((a, b) => Math.max(a, b), 0);

//     // total de ancho del nivel = suma de anchos + gaps
//     const totalWidth =
//       widths.reduce((acc, w) => acc + w, 0) +
//       (ids.length - 1) * hGap;

//     // centramos aprox. en X=0 (luego el fitView se encarga de centrar en pantalla)
//     let x = -totalWidth / 2;

//     ids.forEach((id, idx) => {
//       const w = widths[idx];
//       positions[id] = { x, y: currentY };
//       x += w + hGap;
//     });

//     currentY += levelMaxH + vGap;
//   });

//   return positions;
// }



// // ArTreeViewer.tsx
// import { useEffect, useState, type MouseEvent } from 'react';
// import {
//   ReactFlow,
//   Background,
//   Controls,
//   useNodesState,
//   useEdgesState,
//   MarkerType,
//   ConnectionLineType,
// } from '@xyflow/react';
// import { SmartStepEdge } from '@tisoap/react-flow-smart-edge';
// import '@xyflow/react/dist/style.css';
// import cx from 'clsx';

// import { stepNodeTypes } from '../ArStepNode';
// import { buildTreeGraphTopDown, type ArbolPayload } from '../../../utils/buildTreeGraph';
// // import { buildTreeGraphTopDown, type ArbolPayload } from '../../../utils/buildTreeGraphTopDown';
// import styles from './ArTreeViewer.module.css';

// // ⬅️ helper nuevo (el de arriba)

// interface Props {
//   data: ArbolPayload;
// }

// const edgeTypes = { smart: SmartStepEdge };

// const defaultEdgeOptions = {
//   type: 'smart',
//   markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
//   style: { stroke: '#94a3b8', strokeWidth: 2 },
//   pathOptions: { offset: 8, borderRadius: 4 },
// } as const;

// export const ArTreeViewer = ({ data }: Props) => {
//   // 1) construir estructura base (sin layout “bueno”)
//   const built = buildTreeGraphTopDown(data);

//   const [nodes, setNodes, onNodesChange] = useNodesState<RFNode>(
//     built.nodes as Node<StepNodeData>[]
//   );
//   const [edgesState, setEdgesState, onEdgesChange] = useEdgesState(built.edges);
//   const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);

//   // bandera para no entrar en loop de layout
//   const [layoutDone, setLayoutDone] = useState(false);

//   // cuando cambia el árbol (data), reseteamos nodos/edges y layoutDone
//   useEffect(() => {
//     const fresh = buildTreeGraphTopDown(data);
//     setNodes(fresh.nodes as Node<StepNodeData>[]);
//     setEdgesState(fresh.edges);
//     setLayoutDone(false);
//   }, [data, setNodes, setEdgesState]);

//   // 2) cuando los nodos ya tengan width/height, calculamos layout dinámico
//   useEffect(() => {
//     if (layoutDone) return;
//     if (!nodes.length) return;

//     // esperamos a que TODOS tengan width y height (medidos por React Flow)
//     const allMeasured = nodes.every(
//       (n) => typeof n.width === 'number' && typeof n.height === 'number'
//     );
//     if (!allMeasured) return;

//     const positions = computeTreeLayoutFromRF(
//       nodes,
//       edgesState,
//       { hGap: 80, vGap: 80 }
//     );

//     setNodes((nds) =>
//       nds.map((n) => ({
//         ...n,
//         position: positions[n.id] ?? n.position,
//       }))
//     );
//     setLayoutDone(true);
//   }, [nodes, edgesState, layoutDone, setNodes]);

//   const handleEdgeClick = (_evt: MouseEvent, edge: Edge): void => {
//     setActiveEdgeId(edge.id);
//   };

//   const handlePaneClick = (): void => setActiveEdgeId(null);

//   const edges: Edge[] = edgesState.map((e) =>
//     e.id === activeEdgeId
//       ? { ...e, style: { ...e.style, stroke: '#2563eb', strokeWidth: 3 } }
//       : e
//   );

//   return (
//     <div className={cx(styles.viewer)}>
//       <ReactFlow<RFNode>
//         nodes={nodes}
//         edges={edges}
//         nodeTypes={stepNodeTypes}
//         edgeTypes={edgeTypes}
//         defaultEdgeOptions={defaultEdgeOptions}
//         connectionLineType={ConnectionLineType.Step}
//         fitView
//         panOnDrag
//         selectionOnDrag
//         elementsSelectable
//         onNodesChange={onNodesChange}
//         onEdgesChange={onEdgesChange}
//         onEdgeClick={handleEdgeClick}
//         onPaneClick={handlePaneClick}
//         proOptions={{ hideAttribution: true }}
//       >
//         <Background />
//         <Controls />
//       </ReactFlow>
//     </div>
//   );
// };




































// function computeTreeLayoutFromRF(
//   nodes: RFNode[],
//   edges: Edge[],
//   opts: LayoutOpts = {}
// ): Record<string, { x: number; y: number }> {
//   const hGap = opts.hGap ?? 80;  // separación horizontal mínima
//   const vGap = opts.vGap ?? 80;  // separación vertical mínima

//   if (!nodes.length) return {};

//   // Index rápido
//   const nodeById = new Map<string, RFNode>();
//   nodes.forEach((n) => nodeById.set(n.id, n));

//   // Raíz = nodo con data.isRoot === true
//   const root = nodes.find((n) => (n.data as StepNodeData).isRoot);
//   if (!root) return {};

//   const rootId = root.id;

//   const childrenOf = (id: string) =>
//     edges.filter((e) => e.source === id).map((e) => e.target);

//   // 1) niveles por BFS
//   const levelOf = new Map<string, number>();
//   const queue: string[] = [rootId];
//   levelOf.set(rootId, 0);

//   while (queue.length) {
//     const cur = queue.shift()!;
//     const lvl = levelOf.get(cur)!;
//     for (const ch of childrenOf(cur)) {
//       if (!levelOf.has(ch)) {
//         levelOf.set(ch, lvl + 1);
//         queue.push(ch);
//       }
//     }
//   }

//   // 2) agrupar ids por nivel
//   const levels: string[][] = [];
//   for (const [id, lvl] of levelOf.entries()) {
//     if (!levels[lvl]) levels[lvl] = [];
//     levels[lvl].push(id);
//   }

//   // 3) calcular posiciones usando width/height reales
//   const positions: Record<string, { x: number; y: number }> = {};
//   let currentY = 0;

//   levels.forEach((ids, lvl) => {
//     if (!ids || ids.length === 0) return;

//     // anchos y altos por nodo en el nivel
//     const widths = ids.map(
//       (id) => nodeById.get(id)?.width ?? 300
//     );
//     const heights = ids.map(
//       (id) => nodeById.get(id)?.height ?? 140
//     );

//     const levelMaxH = heights.reduce((a, b) => Math.max(a, b), 0);

//     // total de ancho del nivel = suma de anchos + gaps
//     const totalWidth =
//       widths.reduce((acc, w) => acc + w, 0) +
//       (ids.length - 1) * hGap;

//     // centramos aprox. en X=0 (luego el fitView se encarga de centrar en pantalla)
//     let x = -totalWidth / 2;

//     ids.forEach((id, idx) => {
//       const w = widths[idx];
//       positions[id] = { x, y: currentY };
//       x += w + hGap;
//     });

//     currentY += levelMaxH + vGap;
//   });

//   return positions;
// }




















// import { useState, type MouseEvent } from 'react';
// import {
//   ReactFlow,
//   Background,
//   Controls,
//   useNodesState,
//   useEdgesState,
//   type Edge,
//   type Node,
//   MarkerType,
//   ConnectionLineType,
// } from '@xyflow/react';
// import { SmartStepEdge } from '@tisoap/react-flow-smart-edge'; // 👈
// import '@xyflow/react/dist/style.css';
// import cx from 'clsx';

// import { stepNodeTypes, type StepNodeData } from '../ArStepNode';
// import { buildTreeGraphTopDown, type ArbolPayload } from '../../../utils/buildTreeGraph';
// import styles from './ArTreeViewer.module.css';

// interface Props {
//   data: ArbolPayload;
// }

// type RFNode = Node<StepNodeData>;

// // 👇 registra el edge “smart”
// const edgeTypes = { smart: SmartStepEdge };

// const defaultEdgeOptions = {
//   type: 'smart', // 👈 usa el inteligente por defecto
//   markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
//   style: { stroke: '#94a3b8', strokeWidth: 2 },
//   // para SmartStepEdge puedes pasar opciones de ruta:
//   pathOptions: { offset: 8, borderRadius: 4 },
// } as const;

// export const ArTreeViewer = ({ data }: Props) => {
//   const built = buildTreeGraphTopDown(data);

//   const [nodes, , onNodesChange] = useNodesState<RFNode>(
//     built.nodes as Node<StepNodeData>[]
//   );
//   const [edgesState, _setEdgesState, onEdgesChange] = useEdgesState(built.edges);
//   const [activeEdgeId, setActiveEdgeId] = useState<string | null>(null);

//   const handleEdgeClick = (_evt: MouseEvent, edge: Edge): void => {
//     setActiveEdgeId(edge.id);
//   };

//   const handlePaneClick = (): void => setActiveEdgeId(null);

//   // resalta la arista seleccionada
//   const edges: Edge[] = edgesState.map((e) =>
//     e.id === activeEdgeId
//       ? { ...e, style: { ...e.style, stroke: '#2563eb', strokeWidth: 3 } }
//       : e
//   );

//   return (
//     <div className={cx(styles.viewer)}>
//       <ReactFlow<RFNode>
//         nodes={nodes}
//         edges={edges}
//         nodeTypes={stepNodeTypes}
//         edgeTypes={edgeTypes}                 // 👈 registra smart edge
//         defaultEdgeOptions={defaultEdgeOptions} // 👈 flechas + estilo por defecto
//         connectionLineType={ConnectionLineType.Step}
//         fitView
//         panOnDrag
//         selectionOnDrag
//         elementsSelectable
//         onNodesChange={onNodesChange}
//         onEdgesChange={onEdgesChange}
//         onEdgeClick={handleEdgeClick}
//         onPaneClick={handlePaneClick}
//         proOptions={{ hideAttribution: true }}
//       >
//         <Background />
//         <Controls />
//       </ReactFlow>
//     </div>
//   );
// };
