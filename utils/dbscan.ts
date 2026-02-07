import { Point, AnimationStep } from '../types';

// Euclidean distance
const dist = (p1: Point, p2: Point) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const getNeighbors = (points: Point[], point: Point, eps: number) => {
  return points.filter(p => dist(point, p) <= eps).map(p => p.id);
};

// Generator function for DBSCAN to allow step-by-step animation
export function* dbscanGenerator(
  initialPoints: Point[],
  eps: number,
  minPts: number
): Generator<AnimationStep, void, unknown> {
  const points = initialPoints; // Note: In a real app we might clone, but here we assume the runner handles state updates based on these steps
  let clusterId = 0;
  
  // We maintain a local visited set to ensure logic correctness within the generator,
  // even though the UI updates its own state based on yielded events.
  const visited = new Set<number>();
  const clustered = new Set<number>();

  for (const point of points) {
    if (visited.has(point.id)) continue;

    visited.add(point.id);
    yield { type: 'visiting', pointId: point.id };

    const neighborIds = getNeighbors(points, point, eps);
    yield { type: 'neighbors', pointId: point.id, neighborIds };

    if (neighborIds.length < minPts) {
      yield { type: 'noise', pointId: point.id };
    } else {
      // Start new cluster
      const currentClusterId = clusterId;
      clusterId++;
      
      yield { type: 'cluster_start', clusterId: currentClusterId, pointId: point.id };
      clustered.add(point.id);
      
      // Expand cluster
      // Use a queue for neighbors to visit
      let seeds = [...neighborIds];
      
      // We need to process seeds. Note: seeds array grows!
      for (let i = 0; i < seeds.length; i++) {
        const seedId = seeds[i];
        const seedPoint = points.find(p => p.id === seedId);
        
        if (!seedPoint) continue;

        // Visual feedback for checking this seed
        if (!visited.has(seedId)) {
            yield { type: 'visiting', pointId: seedId };
            visited.add(seedId);
            
            const seedNeighbors = getNeighbors(points, seedPoint, eps);
            // Enable visualization for seed neighbor checks to show "neighborhoods" logic
            yield { type: 'neighbors', pointId: seedId, neighborIds: seedNeighbors };

            if (seedNeighbors.length >= minPts) {
                // Merge neighbors
                for (const nId of seedNeighbors) {
                    if (!seeds.includes(nId)) {
                        seeds.push(nId);
                    }
                }
                yield { type: 'cluster_add', clusterId: currentClusterId, pointId: seedId, isCore: true };
            } else {
                yield { type: 'cluster_add', clusterId: currentClusterId, pointId: seedId, isCore: false };
            }
        }

        if (!clustered.has(seedId)) {
            clustered.add(seedId);
            // Ensure visual consistency if it was previously noise or just unvisited
            yield { type: 'cluster_add', clusterId: currentClusterId, pointId: seedId, isCore: false }; 
        }
      }
    }
  }

  yield { type: 'finished' };
}
