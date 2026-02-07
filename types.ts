export interface Point {
  id: number;
  x: number;
  y: number;
  clusterId: number | null; // null = unassigned, -1 = noise, >= 0 = cluster index
  visited: boolean;
  isCore?: boolean;
}

export interface Centroid {
  id: number;
  x: number;
  y: number;
  color: string;
}

export type DatasetType = 'smiley' | 'moons' | 'blobs' | 'circles' | 'random';

export interface AlgoConfig {
  eps: number;
  minPts: number;
  k: number;
}

export interface AnimationState {
  currentPointId: number | null;
  neighborsIds: number[];
  scanning: boolean;
  message: string;
  centroids?: Centroid[];
}

export type AnimationStep = 
  | { type: 'visiting'; pointId: number }
  | { type: 'neighbors'; pointId: number; neighborIds: number[] }
  | { type: 'noise'; pointId: number }
  | { type: 'cluster_start'; clusterId: number; pointId: number }
  | { type: 'cluster_add'; clusterId: number; pointId: number; isCore: boolean }
  | { type: 'kmeans_assign'; points: { id: number, clusterId: number }[] }
  | { type: 'kmeans_move'; centroids: Centroid[] }
  | { type: 'finished' };
