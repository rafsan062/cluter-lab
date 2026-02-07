import { Point, Centroid, AnimationStep } from '../types';

const dist = (p1: {x: number, y: number}, p2: {x: number, y: number}) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const CLUSTER_COLORS = [
  '#ff3333', '#33ccff', '#33ff77', '#ffcc33', '#ff33cc', '#9933ff', '#ff6600', '#00ffcc'
];

export function* kmeansGenerator(
  points: Point[],
  k: number,
  width: number,
  height: number
): Generator<AnimationStep, void, unknown> {
  // Initialize centroids randomly within data bounds
  let centroids: Centroid[] = Array.from({ length: k }, (_, i) => ({
    id: i,
    x: Math.random() * width,
    y: Math.random() * height,
    color: CLUSTER_COLORS[i % CLUSTER_COLORS.length]
  }));

  yield { type: 'kmeans_move', centroids: [...centroids] };

  let converged = false;
  let iterations = 0;
  const maxIterations = 50;

  while (!converged && iterations < maxIterations) {
    iterations++;
    
    // 1. Assignment Step
    const assignments = points.map(p => {
      let minDist = Infinity;
      let clusterId = 0;
      centroids.forEach((c, idx) => {
        const d = dist(p, c);
        if (d < minDist) {
          minDist = d;
          clusterId = idx;
        }
      });
      return { id: p.id, clusterId };
    });

    yield { type: 'kmeans_assign', points: assignments };

    // 2. Update Step
    const nextCentroids = centroids.map((c, idx) => {
      const assignedPoints = assignments.filter(a => a.clusterId === idx);
      if (assignedPoints.length === 0) return c;

      const pObjs = assignedPoints.map(a => points.find(p => p.id === a.id)!);
      const avgX = pObjs.reduce((sum, p) => sum + p.x, 0) / pObjs.length;
      const avgY = pObjs.reduce((sum, p) => sum + p.y, 0) / pObjs.length;
      
      return { ...c, x: avgX, y: avgY };
    });

    // Check convergence
    converged = nextCentroids.every((c, i) => dist(c, centroids[i]) < 0.1);
    centroids = nextCentroids;

    yield { type: 'kmeans_move', centroids: [...centroids] };
  }

  yield { type: 'finished' };
}
