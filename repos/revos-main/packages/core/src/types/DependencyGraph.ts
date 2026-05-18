export interface DependencyGraph {
  nodes: string[];
  edges: {
    from: string;
    to: string;
  }[];
}