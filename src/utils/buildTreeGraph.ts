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
  algebraRelacional: string;
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
type Size = { width: number; height: number };

type LayoutOpts = {
  hGap?: number;
  vGap?: number;
};

export function buildTreeGraphTopDown(
  data: ArbolPayload,
  opts: LayoutOpts = {}
): { nodes: RFNode[]; edges: Edge[] } {
  const hGap = opts.hGap ?? 80;
  const vGap = opts.vGap ?? 120;

  const baseNodes = data.nodos ?? [];

  // --- 0) Root virtual ---
  const existingIds = new Set(baseNodes.map((n) => n.id));
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
    children: [data.rootId],
    step: -1,
  };

  const allNodes: ArStep[] = [virtualRoot, ...baseNodes];

  const originalIndex = new Map<string, number>();
  allNodes.forEach((n, idx) => originalIndex.set(n.id, idx));

  // --- 1) estimar width/height según el texto ---
  const sizeById = new Map<string, Size>();

  for (const n of allNodes) {
    const sqlText = n.sql ?? '';
    const arText =
      n.id === virtualRootId ? data.algebraRelacional : (n.arHeader ?? '');

    const sqlLinesRaw = sqlText ? sqlText.split('\n') : [];
    const arLinesRaw  = arText ? arText.split('\n') : [];

    const maxSqlLine = sqlLinesRaw.reduce((m, l) => Math.max(m, l.length), 0);
    const maxArLine  = arLinesRaw.reduce((m, l) => Math.max(m, l.length), 0);
    const maxLineLen = Math.max(maxSqlLine, maxArLine, n.fase.length, 1);

    const estWidth = Math.min(
      900,
      Math.max(260, 32 + maxLineLen * 7)
    );

    const lineHeight = 18;
    const paddingVertical = 60;
    const innerWidth = estWidth - 32;
    const pxPerChar = 7;
    const charsPerLine = Math.max(
      10,
      Math.floor(innerWidth / pxPerChar)
    );

    const countWrappedLines = (lines: string[]) =>
      lines.reduce((acc, line) => {
        if (!line.length) return acc + 1;
        const wraps = Math.ceil(line.length / charsPerLine);
        return acc + Math.max(1, wraps);
      }, 0);

    const sqlVisibleLines = countWrappedLines(sqlLinesRaw);
    const arVisibleLines  = countWrappedLines(arLinesRaw);
    const visibleLines = sqlVisibleLines + arVisibleLines;

    const totalChars =
      sqlLinesRaw.reduce((a, l) => a + l.length, 0) +
      arLinesRaw.reduce((a, l) => a + l.length, 0);

    const logicalLines = Math.ceil(totalChars / charsPerLine);

    const finalLines = Math.max(visibleLines, logicalLines);

    const estHeight = Math.max(
      140,
      paddingVertical + finalLines * lineHeight + 40
    );

    sizeById.set(n.id, { width: estWidth, height: estHeight });
  }

  // --- 2) niveles BFS ---
  const byId = new Map<string, ArStep>();
  allNodes.forEach((n) => byId.set(n.id, n));

  const childrenOf = (id: string) => byId.get(id)?.children ?? [];

  const levelOf = new Map<string, number>();
  const queue: string[] = [virtualRootId];
  levelOf.set(virtualRootId, 0);

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

  const levels: string[][] = [];
  for (const [id, lvl] of levelOf.entries()) {
    if (!levels[lvl]) levels[lvl] = [];
    levels[lvl].push(id);
  }

  for (const arr of levels) {
    arr.sort(
      (a, b) => (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0)
    );
  }

  // --- 3) X por nivel (Y provisional=0) ---
  const positions = new Map<string, { x: number; y: number }>();

  levels.forEach((ids) => {
    if (!ids || !ids.length) return;

    const sizes = ids.map((id) => sizeById.get(id)!);
    const totalWidth =
      sizes.reduce((acc, s) => acc + s.width, 0) +
      (ids.length - 1) * hGap;

    let x = -totalWidth / 2;

    ids.forEach((id, idx) => {
      positions.set(id, { x, y: 0 });
      x += sizes[idx].width + hGap;
    });
  });

  // --- 4) Y basada en PADRE: y_hijo = y_padre + h_padre + vGap ---
  const parentOf = new Map<string, string>();
  allNodes.forEach((p) => {
    p.children.forEach((c) => parentOf.set(c, p.id));
  });

  const q2: string[] = [virtualRootId];
  const rootPos = positions.get(virtualRootId) ?? { x: 0, y: 0 };
  positions.set(virtualRootId, rootPos);

  while (q2.length) {
    const pid = q2.shift()!;
    const parentPos = positions.get(pid)!;
    const parentSize = sizeById.get(pid)!;

    const baseY = parentPos.y + parentSize.height + vGap;

    for (const ch of childrenOf(pid)) {
      const cur = positions.get(ch)!;
      positions.set(ch, { x: cur.x, y: baseY });
      q2.push(ch);
    }
  }

  // --- 5) nodos RF ---
  const nodes: RFNode[] = allNodes.map((n) => {
    const sz = sizeById.get(n.id)!;
    const pos = positions.get(n.id) ?? { x: 0, y: 0 };

    return {
      id: n.id,
      type: 'step',
      position: pos,
      data: {
        id: n.id,
        fase: n.fase,
        sql: n.sql,
        arActual: n.arActual,
        step: n.step,
        arHeader:
          n.id === virtualRootId ? data.algebraRelacional : (n.arHeader ?? ''),
        isRoot: n.id === virtualRootId,
      },
      width: sz.width,
      height: sz.height,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      draggable: false,
      selectable: true,
    };
  });

  // --- 6) edges ---
  const edges: Edge[] = [];
  for (const parent of allNodes) {
    for (const childId of parent.children) {
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
//   algebraRelacional: string;
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
// type Size = { width: number; height: number };

// type LayoutOpts = {
//   hGap?: number;   // separación mínima horizontal
//   vGap?: number;   // separación mínima vertical
// };


// export function layoutWithRealSizes(
//   data: ArbolPayload,
//   sizeById: Map<string, Size>,
//   opts: LayoutOpts = {}
// ): Map<string, { x: number; y: number }> {
//   const hGap = opts.hGap ?? 80;
//   const vGap = opts.vGap ?? 80;

//   const baseNodes = data.nodos ?? [];

//   // reconstruimos el root virtual con el mismo algoritmo
//   const existingIds = new Set(baseNodes.map((n) => n.id));
//   let virtualRootId = '__ar_root__';
//   let i = 1;
//   while (existingIds.has(virtualRootId)) {
//     virtualRootId = `__ar_root___${i++}`;
//   }

//   const virtualRoot: ArStep = {
//     id: virtualRootId,
//     fase: 'AR',
//     arHeader: data.algebraRelacional,
//     arActual: '',
//     children: [data.rootId],
//     step: -1,
//   };

//   const allNodes: ArStep[] = [virtualRoot, ...baseNodes];

//   const originalIndex = new Map<string, number>();
//   allNodes.forEach((n, idx) => originalIndex.set(n.id, idx));

//   const byId = new Map<string, ArStep>();
//   allNodes.forEach((n) => byId.set(n.id, n));
//   const childrenOf = (id: string) => byId.get(id)?.children ?? [];

//   // --- 1) niveles por BFS (solo para calcular X) ---
//   const levelOf = new Map<string, number>();
//   const queue: string[] = [virtualRootId];
//   levelOf.set(virtualRootId, 0);

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

//   const levels: string[][] = [];
//   for (const [id, lvl] of levelOf.entries()) {
//     if (!levels[lvl]) levels[lvl] = [];
//     levels[lvl].push(id);
//   }

//   for (const arr of levels) {
//     arr.sort(
//       (a, b) => (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0)
//     );
//   }

//   // --- 2) posición X por nivel (Y provisional) ---
//   const positions = new Map<string, { x: number; y: number }>();
//   let currentY = 0;

//   levels.forEach((ids) => {
//     if (!ids || !ids.length) return;

//     const sizes = ids.map((id) => sizeById.get(id)!);
//     const levelMaxH = sizes.reduce((m, s) => Math.max(m, s.height), 0);

//     const totalWidth =
//       sizes.reduce((acc, s) => acc + s.width, 0) +
//       (ids.length - 1) * hGap;

//     let x = -totalWidth / 2;

//     ids.forEach((id, idx) => {
//       const sz = sizes[idx];
//       positions.set(id, { x, y: currentY }); // Y se corregirá luego
//       x += sz.width + hGap;
//     });

//     currentY += levelMaxH + vGap;
//   });

//   // --- 3) reajustar Y en función del PADRE (altura real) ---
//   const parentOf = new Map<string, string>();
//   allNodes.forEach((p) => {
//     p.children.forEach((c) => parentOf.set(c, p.id));
//   });

//   // el root virtual va en y = 0
//   const rootPos = positions.get(virtualRootId) ?? { x: 0, y: 0 };
//   positions.set(virtualRootId, { ...rootPos, y: 0 });

//   const q2: string[] = [virtualRootId];

//   while (q2.length) {
//     const pid = q2.shift()!;
//     const parentPos = positions.get(pid)!;
//     const parentSize = sizeById.get(pid)!;

//     for (const ch of childrenOf(pid)) {
//       q2.push(ch);
//       const childPos = positions.get(ch)!;
//       const newY = parentPos.y + parentSize.height + vGap;
//       positions.set(ch, { x: childPos.x, y: newY });
//     }
//   }

//   return positions;
// }




// export function buildTreeGraphTopDown(
//   data: ArbolPayload,
//   opts: LayoutOpts = {}
// ): { nodes: RFNode[]; edges: Edge[] } {
//   const hGap = opts.hGap ?? 80;
//   // const vGap = opts.vGap ?? 80;
//   const vGap = opts.vGap ?? 120; // antes 80

//   const baseNodes = data.nodos ?? [];

//   // --- 0) Root virtual sin mutar data.original ---
//   const existingIds = new Set(baseNodes.map((n) => n.id));

//   let virtualRootId = '__ar_root__';
//   let i = 1;
//   while (existingIds.has(virtualRootId)) {
//     virtualRootId = `__ar_root___${i++}`;
//   }

//   const virtualRoot: ArStep = {
//     id: virtualRootId,
//     fase: 'AR',
//     arHeader: data.algebraRelacional,
//     arActual: '',
//     children: [data.rootId],
//     step: -1,
//   };

//   const allNodes: ArStep[] = [virtualRoot, ...baseNodes];

//   // índice de orden original para mantener narrativa estable
//   const originalIndex = new Map<string, number>();
//   allNodes.forEach((n, idx) => originalIndex.set(n.id, idx));

//   // --- 1) estimar width/height dinámicamente según el texto ---
//    type Size = { width: number; height: number };
//   const sizeById = new Map<string, Size>();

//     for (const n of allNodes) {
//     const sqlText = n.sql ?? '';
//     const arText =
//       n.id === virtualRootId ? data.algebraRelacional : (n.arHeader ?? '');

//     const sqlLinesRaw = sqlText ? sqlText.split('\n') : [];
//     const arLinesRaw  = arText ? arText.split('\n') : [];

//     // longitud de la línea más larga (solo para estimar ancho)
//     const maxSqlLine = sqlLinesRaw.reduce((m, l) => Math.max(m, l.length), 0);
//     const maxArLine  = arLinesRaw.reduce((m, l) => Math.max(m, l.length), 0);
//     const maxLineLen = Math.max(maxSqlLine, maxArLine, n.fase.length, 1);

//     // 1) ancho estimado
//     const estWidth = Math.min(
//       900,
//       Math.max(260, 32 + maxLineLen * 7)  // 7 px aprox por carácter
//     );

//     // 2) calcular líneas "visuales" teniendo en cuenta el wrap
//     const lineHeight = 18;         // px de alto por línea
//     const paddingVertical = 60;    // header + labels
//     const innerWidth = estWidth - 32; // restar padding horizontal aprox
//     const pxPerChar = 7;
//     const charsPerLine = Math.max(
//       10,
//       Math.floor(innerWidth / pxPerChar)
//     );

//     const countWrappedLines = (lines: string[]) =>
//       lines.reduce((acc, line) => {
//         if (!line.length) return acc + 1;
//         const wraps = Math.ceil(line.length / charsPerLine);
//         return acc + Math.max(1, wraps);
//       }, 0);

//     const sqlVisibleLines = countWrappedLines(sqlLinesRaw);
//     const arVisibleLines  = countWrappedLines(arLinesRaw);
//     const visibleLines = sqlVisibleLines + arVisibleLines;

//     // 🔥 NUEVO: también calculamos líneas "lógicas" por nº total de caracteres
//     const totalChars =
//       sqlLinesRaw.reduce((a, l) => a + l.length, 0) +
//       arLinesRaw.reduce((a, l) => a + l.length, 0);

//     const logicalLines = Math.ceil(totalChars / charsPerLine);

//     // nos quedamos con el peor caso
//     const finalLines = Math.max(visibleLines, logicalLines);

//     // 3) alto estimado usando las líneas finales + margen extra
//     const estHeight = Math.max(
//       140,
//       paddingVertical + finalLines * lineHeight + 40 // margen extra
//     );

//     sizeById.set(n.id, { width: estWidth, height: estHeight });
//   }


//   // --- 2) niveles por BFS desde el root virtual ---
//   const byId = new Map<string, ArStep>();
//   allNodes.forEach((n) => byId.set(n.id, n));

//   const childrenOf = (id: string) => byId.get(id)?.children ?? [];

//   const levelOf = new Map<string, number>();
//   const queue: string[] = [virtualRootId];
//   levelOf.set(virtualRootId, 0);

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

//   // --- 3) agrupar por nivel y ordenar por índice original ---
//   const levels: string[][] = [];
//   for (const [id, lvl] of levelOf.entries()) {
//     if (!levels[lvl]) levels[lvl] = [];
//     levels[lvl].push(id);
//   }

//   for (const arr of levels) {
//     arr.sort(
//       (a, b) =>
//         (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0)
//     );
//   }

//   // --- 4) calcular posiciones usando las dimensiones estimadas ---
//   const positions = new Map<string, { x: number; y: number }>();

//     let currentY = 0;
//   levels.forEach((ids) => {
//     if (!ids || !ids.length) return;

//     const sizes = ids.map((id) => sizeById.get(id)!);
//     const levelMaxH = sizes.reduce((m, s) => Math.max(m, s.height), 0);

//     const totalWidth =
//       sizes.reduce((acc, s) => acc + s.width, 0) +
//       (ids.length - 1) * hGap;

//     let x = -totalWidth / 2;

//     ids.forEach((id, idx) => {
//       const sz = sizes[idx];
//       positions.set(id, { x, y: currentY });
//       x += sz.width + hGap;
//     });

//     // 🔥 NUEVO: gap extra proporcional a la altura del nivel
//     const extraGap = Math.round(levelMaxH * 0.2); // 20% de la altura del nodo más alto

//     currentY += levelMaxH + vGap + extraGap;
//   });


//   // --- 5) construir nodos RF con posición y tamaño estimados ---
//   const nodes: RFNode[] = allNodes.map((n) => {
//     const sz = sizeById.get(n.id)!;
//     const pos = positions.get(n.id) ?? { x: 0, y: 0 };

//     return {
//       id: n.id,
//       type: 'step',
//       position: pos,
//       data: {
//         id: n.id,
//         fase: n.fase,
//         sql: n.sql,
//         arActual: n.arActual,
//         step: n.step,
//         arHeader:
//           n.id === virtualRootId ? data.algebraRelacional : (
//             n.arHeader ?? ''
//             // n.arHeader ? n.arHeader + "HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA2HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA3HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA4HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA5HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA7HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA9 HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA10HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA11HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA12HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA13HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA14HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA15HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA16 HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA17HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA18HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA19HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA20HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA21 HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA21HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA22HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA23" : ''
//           ),
//         isRoot: n.id === virtualRootId,
//       },
//       width: sz.width,
//       height: sz.height,
//       sourcePosition: Position.Bottom,
//       targetPosition: Position.Top,
//       draggable: false,
//       selectable: true,
//     };
//   });

//   // --- 6) edges ---
//   const edges: Edge[] = [];
//   for (const parent of allNodes) {
//     for (const childId of parent.children) {
//       if (!byId.has(childId)) continue;

//       edges.push({
//         id: `e-${parent.id}-${childId}`,
//         source: parent.id,
//         target: childId,
//         type: 'smoothstep',
//         markerEnd: { type: 'arrowclosed', width: 18, height: 18 },
//         style: { stroke: '#94a3b8', strokeWidth: 2 },
//       });
//     }
//   }

//   return { nodes, edges };
// }





























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
//   algebraRelacional: string;
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
//   /** ancho mínimo y máximo del nodo (en px) */
//   minW?: number;
//   maxW?: number;
//   /** “ancho” promedio de un carácter monoespaciado */
//   charW?: number;
//   nodeH?: number;
//   hGap?: number;
//   vGap?: number;
//   centerX?: number;
// };

// // helper: longitud de la línea más larga
// const longestLine = (text: string | undefined): number => {
//   if (!text) return 0;
//   return text
//     .split('\n')
//     .reduce((max, line) => Math.max(max, line.length), 0);
// };

// export function buildTreeGraphTopDown(
//   data: ArbolPayload,
//   opts: LayoutOpts = {}
// ): { nodes: RFNode[]; edges: Edge[] } {
//   const minW   = opts.minW   ?? 260;
//   const maxW   = opts.maxW   ?? 900;
//   const charW  = opts.charW  ?? 8;   // px aprox por carácter
//   const nodeH  = opts.nodeH  ?? 140;
//   const hGap   = opts.hGap   ?? 80;
//   const vGap   = opts.vGap   ?? 120;
//   const centerX = opts.centerX ?? 0;

//   const baseNodes = data.nodos ?? [];

//   // ids existentes
//   const existingIds = new Set(baseNodes.map(n => n.id));

//   // id del root virtual, garantizando que no choque
//   let virtualRootId = '__ar_root__';
//   let i = 1;
//   while (existingIds.has(virtualRootId)) {
//     virtualRootId = `__ar_root___${i++}`;
//   }

//   const virtualRoot: ArStep = {
//     id: virtualRootId,
//     fase: 'AR',
//     arHeader: data.algebraRelacional,
//     arActual: '',
//     children: [data.rootId],
//     step: -1,
//   };

//   const allNodes: ArStep[] = [virtualRoot, ...baseNodes];
//   const localRootId = virtualRootId;

//   // Índices
//   const byId = new Map<string, ArStep>();
//   allNodes.forEach((n) => byId.set(n.id, n));

//   const originalIndex = new Map<string, number>();
//   allNodes.forEach((n, idx) => {
//     originalIndex.set(n.id, idx);
//   });

//   // 0) calcular ancho estimado por nodo
//   const nodeWidth = new Map<string, number>();
//   for (const n of allNodes) {
//     const headerText =
//       n.id === virtualRootId
//         ? data.algebraRelacional
//         : n.arHeader ?? '';

//     const sqlText = n.sql ?? '';

//     const maxChars = Math.max(
//       longestLine(headerText),
//       longestLine(sqlText),
//       10 // mínimo por si viene casi vacío
//     );

//     // ancho = padding base + chars * anchoPromedio
//     const w = Math.min(
//       maxW,
//       Math.max(minW, 80 + maxChars * charW)
//     );
//     nodeWidth.set(n.id, w);
//   }

//   // 1) niveles por BFS
//   const levelOf = new Map<string, number>();
//   const childrenOf = (id: string) => byId.get(id)?.children ?? [];

//   const queue: string[] = [localRootId];
//   levelOf.set(localRootId, 0);

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

//   // 2) agrupar por nivel y ordenar por índice original
//   const levels: string[][] = [];
//   for (const id of levelOf.keys()) {
//     const lvl = levelOf.get(id)!;
//     if (!levels[lvl]) levels[lvl] = [];
//     levels[lvl].push(id);
//   }

//   for (const arr of levels) {
//     arr.sort(
//       (a, b) =>
//         (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0)
//     );
//   }

//   // 3) posiciones (usando el ancho específico de cada nodo)
//   const positions = new Map<string, { x: number; y: number }>();
//   levels.forEach((ids, lvl) => {
//     if (!ids || ids.length === 0) return;

//     const widths = ids.map((id) => nodeWidth.get(id) ?? minW);
//     const totalWidth =
//       widths.reduce((acc, w) => acc + w, 0) +
//       (ids.length - 1) * hGap;

//     let x = centerX - totalWidth / 2;
//     const y = lvl * (nodeH + vGap);

//     ids.forEach((id, idx) => {
//       const w = widths[idx];
//       positions.set(id, { x, y });
//       x += w + hGap;
//     });
//   });

//   // 4) nodos RF
//   const nodes: RFNode[] = allNodes.map((n) => ({
//     id: n.id,
//     type: 'step',
//     position: positions.get(n.id) ?? { x: 0, y: 0 },
//     data: {
//       id: n.id,
//       fase: n.fase,
//       sql: n.sql,
//       arActual: n.arActual,
//       step: n.step,
//       arHeader:
//         n.id === virtualRootId
//           ? data.algebraRelacional
//           : n.arHeader ?? '',
//       isRoot: n.id === virtualRootId,
//     },
//     width: nodeWidth.get(n.id) ?? minW,
//     height: nodeH,
//     sourcePosition: Position.Bottom,
//     targetPosition: Position.Top,
//     draggable: false,
//     selectable: true,
//   }));

//   // 5) edges
//   const edges: Edge[] = [];
//   for (const parent of allNodes) {
//     for (const childId of parent.children) {
//       if (!byId.has(childId)) continue;

//       edges.push({
//         id: `e-${parent.id}-${childId}`,
//         source: parent.id,
//         target: childId,
//         type: 'smoothstep',
//         markerEnd: { type: 'arrowclosed', width: 18, height: 18 },
//         style: { stroke: '#94a3b8', strokeWidth: 2 },
//       });
//     }
//   }

//   return { nodes, edges };
// }




