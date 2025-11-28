// buildTreeGraphTopDown.ts
import { type Edge, type Node, Position } from '@xyflow/react';

export type ArStep = {
  id: string;
  fase: string;
  sql?: string;
  arHeader?: string;
  arActual: string;
  children: string[];
  step: number;
};

export type ArbolPayload = {
  algebraRelacional: string,
  rootId: string;
  nodos: ArStep[];
};

export type StepNodeData = {
  id: string;
  fase: string;
  sql?: string;
  arActual: string;
  step: number;
  arHeader: string;
  isRoot?: boolean;
};

type RFNode = Node<StepNodeData>;

type LayoutOpts = {
  nodeW?: number;
  nodeH?: number;
  hGap?: number;
  vGap?: number;
  centerX?: number;
};

export function buildTreeGraphTopDown(
  data: ArbolPayload,
  opts: LayoutOpts = {}
): { nodes: RFNode[]; edges: Edge[] } {
  const nodeW = opts.nodeW ?? 360;
  const nodeH = opts.nodeH ?? 140;
  const hGap  = opts.hGap  ?? 80;
  const vGap  = opts.vGap  ?? 120;
  const centerX = opts.centerX ?? 0;

  // 0) NO mutamos data.nodos ni data.rootId
  const baseNodes = data.nodos ?? [];

  // ids existentes
  const existingIds = new Set(baseNodes.map(n => n.id));

  // id del root virtual, garantizando que no choque
  let virtualRootId = '__ar_root__';
  let i = 1;
  while (existingIds.has(virtualRootId)) {
    virtualRootId = `__ar_root___${i++}`;
  }

  const virtualRoot: ArStep = {
    id: virtualRootId,
    fase: 'AR',
    arHeader: data.algebraRelacional,
    arActual: '',
    children: [data.rootId],   // cuelga del root REAL
    step: -1,                  // ya no se usa para ordenar, pero lo dejamos
  };

  const allNodes: ArStep[] = [virtualRoot, ...baseNodes];
  const localRootId = virtualRootId;

  // Índices
  const byId = new Map<string, ArStep>();
  allNodes.forEach(n => byId.set(n.id, n));

  const originalIndex = new Map<string, number>();
  allNodes.forEach((n, idx) => {
    originalIndex.set(n.id, idx);
  });

  // 1) niveles por BFS
  const levelOf = new Map<string, number>();
  const childrenOf = (id: string) => byId.get(id)?.children ?? [];

  const queue: string[] = [localRootId];
  levelOf.set(localRootId, 0);

  while (queue.length) {
    const cur = queue.shift()!;
    const lvl = levelOf.get(cur)!;
    for (const ch of childrenOf(cur)) {
      if (!levelOf.has(ch)) {
        levelOf.set(ch, lvl + 1);
        queue.push(ch);
      }
    }
  }

  // 2) agrupar por nivel y ordenar por índice original (no por step)
  const levels: string[][] = [];
  for (const id of levelOf.keys()) {
    const lvl = levelOf.get(id)!;
    if (!levels[lvl]) levels[lvl] = [];
    levels[lvl].push(id);
  }

  for (const arr of levels) {
    arr.sort(
      (a, b) =>
        (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0)
    );
  }

  // 3) posiciones
  const positions = new Map<string, { x: number; y: number }>();
  levels.forEach((ids, lvl) => {
    if (!ids) return;

    const totalWidth = ids.length * nodeW + (ids.length - 1) * hGap;
    const xStart = centerX - totalWidth / 2;

    ids.forEach((id, idx) => {
      const x = xStart + idx * (nodeW + hGap);
      const y = lvl * (nodeH + vGap);
      positions.set(id, { x, y });
    });
  });

  // 4) nodos RF
  const nodes: RFNode[] = allNodes.map((n) => ({
    id: n.id,
    type: 'step',
    position: positions.get(n.id) ?? { x: 0, y: 0 },
    data: {
      id: n.id,
      fase: n.fase,
      sql: n.sql,
      arActual: n.arActual,
      step: n.step,
      arHeader: n.id === virtualRootId ? data.algebraRelacional : (n.arHeader ?? ''),
      isRoot: n.id === virtualRootId,
    },
    width: nodeW,
    height: nodeH,
    sourcePosition: Position.Bottom,
    targetPosition: Position.Top,
    draggable: false,
    selectable: true,
  }));

  // 5) edges
  const edges: Edge[] = [];
  for (const parent of allNodes) {
    for (const childId of parent.children) {
      // si por algún motivo apunta a un id inexistente, lo saltamos
      if (!byId.has(childId)) continue;

      edges.push({
        id: `e-${parent.id}-${childId}`,
        source: parent.id,
        target: childId,
        type: 'smoothstep',
        markerEnd: { type: 'arrowclosed', width: 18, height: 18 },
        style: { stroke: '#94a3b8', strokeWidth: 2 },
      });
    }
  }

  return { nodes, edges };
}


















// // buildTreeGraphTopDown.ts
// import { type Edge, type Node, Position } from '@xyflow/react';

// export type ArStep = {
//   id: string;
//   fase: string;
//   sql?: string;
//   arHeader?: string;
//   arActual: string;
//   children: string[];
//   step: number;
// };

// export type ArbolPayload = {
//   algebraRelacional: string,
//   rootId: string;
//   nodos: ArStep[];
// };

// export type StepNodeData = {
//   id: string;
//   fase: string;
//   sql?: string;
//   arActual: string;
//   step: number;
//   arHeader: string;
//   isRoot?: boolean;
// };

// type RFNode = Node<StepNodeData>;

// type LayoutOpts = {
//   nodeW?: number;     // ancho estimado de nodo
//   nodeH?: number;     // alto estimado de nodo
//   hGap?: number;      // separación horizontal entre hermanos
//   vGap?: number;      // separación vertical entre niveles
//   centerX?: number;   // centro horizontal del lienzo
// };

// /** Construye un layout top-down sencillo (sin librerías) */
// export function buildTreeGraphTopDown(
//   data: ArbolPayload,
//   opts: LayoutOpts = {}
// ): { nodes: RFNode[]; edges: Edge[] } {
//   const nodeW = opts.nodeW ?? 360;
//   const nodeH = opts.nodeH ?? 140;
//   const hGap  = opts.hGap  ?? 80;
//   const vGap  = opts.vGap  ?? 120;
//   const centerX = opts.centerX ?? 0;

//   data.nodos.push({
//     id: "n0",
//     fase: "AR",
//     arHeader: data.algebraRelacional,
//     arActual: "",
//     children: [data.rootId],
//     step: 0
//   });
//   data.rootId = "n0";

//   // Índices
//   const byId = new Map<string, ArStep>();
//   data.nodos.forEach(n => byId.set(n.id, n));

//   // 1) niveles por BFS desde root
//   const levelOf = new Map<string, number>();
//   const childrenOf = (id: string) => byId.get(id)?.children ?? [];

//   const queue: string[] = [data.rootId];
//   levelOf.set(data.rootId, 0);

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

//   // 2) agrupar por nivel y ordenar (por step para mantener narrativa)
//   const levels: string[][] = [];
//   for (const id of levelOf.keys()) {
//     const lvl = levelOf.get(id)!;
//     if (!levels[lvl]) levels[lvl] = [];
//     levels[lvl].push(id);
//   }
//   for (const arr of levels) {
//     arr.sort((a, b) => (byId.get(a)!.step) - (byId.get(b)!.step));
//   }

//   // 3) calcular X por cada nivel (centro a izquierda/derecha)
//   const positions = new Map<string, { x: number; y: number }>();
//   levels.forEach((ids, lvl) => {
//     if (!ids) return;

//     const totalWidth = ids.length * nodeW + (ids.length - 1) * hGap;
//     let xStart = centerX - totalWidth / 2;

//     ids.forEach((id, idx) => {
//       const x = xStart + idx * (nodeW + hGap);
//       const y = lvl * (nodeH + vGap);
//       positions.set(id, { x, y });
//     });
//   });

//   // 4) nodos RF
//   const nodes: RFNode[] = data.nodos.map(n => ({
//     id: n.id,
//     type: 'step',
//     position: positions.get(n.id) ?? { x: 0, y: 0 },
//     data: { id: n.id, fase: n.fase, sql: n.sql, arActual: n.arActual, step: n.step, arHeader: n.id == "n0" ? data.algebraRelacional : n.arHeader ?? "", isRoot: n.id == "n0" },
//     width: nodeW,
//     height: nodeH,
//     sourcePosition: Position.Bottom,
//     targetPosition: Position.Top,
//     draggable: false,
//     selectable: true,
//   }));

//   // 5) edges
//   const edges: Edge[] = [];
//   for (const parent of data.nodos) {
//     for (const childId of parent.children) {
//       edges.push({
//         id: `e-${parent.id}-${childId}`,
//         source: parent.id,
//         target: childId,
//         type: 'smoothstep',           // recto y claro
//         markerEnd: { type: 'arrowclosed', width: 18, height: 18 },
//         style: { stroke: '#94a3b8', strokeWidth: 2 },
//       });
//     }
//   }

//   return { nodes, edges };
// }






































// import type { Edge, Node } from '@xyflow/react';
// import { MarkerType } from '@xyflow/react';
// import type { StepNodeData } from '../playground/components/ArStepNode';

// export type ArbolNode = {
//   id: string;
//   fase: string;
//   sql: string;
//   arHeader: string;
//   arActual: string;
//   children: string[];
//   step: number;
// };

// export type ArbolPayload = {
//   rootId: string;
//   nodos: ArbolNode[];
// };

// export type BuiltTreeGraph = {
//   nodes: Node<StepNodeData>[];
//   edges: Edge[];
// };

// type Position = { x: number; y: number };

// const layoutTree = (
//   rootId: string,
//   byId: Map<string, ArbolNode>,
//   levelGap = 140,
//   siblingGap = 28
// ): Map<string, Position> => {
//   const pos = new Map<string, Position>();
//   const sizeMemo = new Map<string, number>();

//   const subtreeLeaves = (id: string): number => {
//     if (sizeMemo.has(id)) return sizeMemo.get(id)!;
//     const n = byId.get(id);
//     if (!n) { sizeMemo.set(id, 1); return 1; }
//     if (n.children.length === 0) { sizeMemo.set(id, 1); return 1; }
//     const sum = n.children.map(subtreeLeaves).reduce((a, b) => a + b, 0);
//     sizeMemo.set(id, sum);
//     return sum;
//   };

//   let cursorY = 0;

//   const assign = (id: string, level: number, centerY: number): void => {
//     const n = byId.get(id);
//     if (!n) return;

//     const x = level * 360;
//     let y = centerY;

//     if (n.children.length > 0) {
//       const leaves = subtreeLeaves(id);
//       let childStartY = centerY - ((leaves - 1) * siblingGap) / 2;
//       const childCenters: number[] = [];

//       for (const c of n.children) {
//         const cLeaves = subtreeLeaves(c);
//         const height = (cLeaves - 1) * siblingGap;
//         const cCenter = childStartY + height / 2;
//         assign(c, level + 1, cCenter);
//         childCenters.push(cCenter);
//         childStartY += cLeaves * siblingGap;
//       }

//       y = (Math.min(...childCenters) + Math.max(...childCenters)) / 2;
//     } else {
//       if (centerY === 0) {
//         y = cursorY;
//         cursorY += siblingGap;
//       }
//     }

//     pos.set(id, { x, y });
//   };

//   const totalLeaves = subtreeLeaves(rootId);
//   const totalHeight = (totalLeaves - 1) * siblingGap;
//   const startCenterY = totalHeight / 2;
//   assign(rootId, 0, startCenterY);

//   const minY = Math.min(...Array.from(pos.values()).map((p) => p.y));
//   if (minY < 0) {
//     for (const [k, v] of pos) pos.set(k, { x: v.x + 40, y: v.y - minY + levelGap });
//   } else {
//     for (const [k, v] of pos) pos.set(k, { x: v.x + 40, y: v.y + levelGap });
//   }

//   return pos;
// };

// export const buildTreeGraph = (payload: ArbolPayload): BuiltTreeGraph => {
//   const { rootId, nodos } = payload;

//   const byId = new Map<string, ArbolNode>(nodos.map((n) => [n.id, n]));
//   const pos = layoutTree(rootId, byId);

//   const nodes: Node<StepNodeData>[] = nodos.map((n) => ({
//     id: n.id,
//     type: 'step',
//     position: pos.get(n.id) ?? { x: 0, y: 0 },
//     data: { id: n.id, fase: n.fase, sql: n.sql, arActual: n.arActual, step: n.step },
//     draggable: false,
//     selectable: true,
//   }));

//   const edges: Edge[] = [];
  
    
//     for (const parent of nodos) {
//     for (const childId of parent.children) {
//         const e: Edge = {
//         id: `e-${parent.id}-${childId}`,
//         source: parent.id,
//         sourceHandle: 'out',
//         target: childId,
//         targetHandle: 'in',
//         type: 'smart',
//         markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 }, // ← aquí
//         style: { stroke: '#94a3b8', strokeWidth: 2 },
//         };
//         edges.push(e);
//     }
//     }

//   return { nodes, edges };
// };
