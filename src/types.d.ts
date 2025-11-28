// types.ts (helper opcional)
export type DataType = 'INT' | 'VARCHAR' | 'DATE';  

export interface Nodo {
  id: string;
  fase: string;
  sql: string;
  arHeader: string;
  arActual: string;
  children: string[];
  step: number;
}

export interface Arbol {
  rootId: string;
  nodos: Nodo[];
}

export interface ConvertionResult {
  algebraRelacional: string;
  arbol: Arbol;
}