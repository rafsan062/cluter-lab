import { Point } from '../types';

// Helper for random normal distribution (Box-Muller transform)
function randomNormal(mean = 0, sd = 1) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random(); 
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v) * sd + mean;
}

export const generateDataset = (type: string, width: number, height: number, count: number): Point[] => {
  const points: Point[] = [];
  const padding = 50;
  const w = width - padding * 2;
  const h = height - padding * 2;
  const cx = width / 2;
  const cy = height / 2;

  let idCounter = 0;
  const addPoint = (x: number, y: number) => {
    points.push({
      id: idCounter++,
      x,
      y,
      clusterId: null,
      visited: false
    });
  };

  switch (type) {
    case 'smiley': {
      // Face Outline (Ring)
      const r = Math.min(w, h) / 2.2;
      for (let i = 0; i < count * 0.6; i++) {
        const angle = Math.random() * Math.PI * 2;
        // Add some thickness to the ring
        const dist = r + randomNormal(0, 15);
        addPoint(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
      }
      
      // Eyes
      const eyeOffset = r * 0.4;
      const eyeRadius = r * 0.15;
      // Left Eye
      for (let i = 0; i < count * 0.1; i++) {
        addPoint(
          cx - eyeOffset + randomNormal(0, eyeRadius * 0.6), 
          cy - eyeOffset * 0.5 + randomNormal(0, eyeRadius * 0.6)
        );
      }
      // Right Eye
      for (let i = 0; i < count * 0.1; i++) {
        addPoint(
          cx + eyeOffset + randomNormal(0, eyeRadius * 0.6), 
          cy - eyeOffset * 0.5 + randomNormal(0, eyeRadius * 0.6)
        );
      }

      // Mouth (Arc)
      for (let i = 0; i < count * 0.2; i++) {
        const angle = Math.PI * 0.2 + Math.random() * Math.PI * 0.6;
        const mouthR = r * 0.6;
        const thickness = randomNormal(0, 5);
        addPoint(
          cx + Math.cos(angle) * (mouthR + thickness), 
          cy + Math.sin(angle) * (mouthR + thickness)
        );
      }
      break;
    }

    case 'moons': {
      const radius = Math.min(w, h) / 4;
      // Top moon
      for (let i = 0; i < count / 2; i++) {
        const angle = Math.PI * (Math.random());
        addPoint(
          cx - radius/2 + Math.cos(angle) * radius + randomNormal(0, 10),
          cy - radius/2 - Math.sin(angle) * radius + randomNormal(0, 10)
        );
      }
      // Bottom moon
      for (let i = 0; i < count / 2; i++) {
        const angle = Math.PI + Math.PI * (Math.random());
        addPoint(
          cx + radius/2 + Math.cos(angle) * radius + randomNormal(0, 10),
          cy + radius/2 - Math.sin(angle) * radius + randomNormal(0, 10)
        );
      }
      break;
    }

    case 'circles': {
      const r1 = Math.min(w, h) / 6;
      const r2 = Math.min(w, h) / 2.5;
      
      // Inner circle
      for (let i = 0; i < count * 0.3; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = randomNormal(r1, 8);
        addPoint(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
      }
      
      // Outer circle
      for (let i = 0; i < count * 0.7; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = randomNormal(r2, 10);
        addPoint(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist);
      }
      break;
    }

    case 'blobs': {
      const blobs = 3;
      for (let b = 0; b < blobs; b++) {
        const bx = padding + Math.random() * w;
        const by = padding + Math.random() * h;
        for (let i = 0; i < count / blobs; i++) {
          addPoint(bx + randomNormal(0, 30), by + randomNormal(0, 30));
        }
      }
      break;
    }

    default: // Random
      for (let i = 0; i < count; i++) {
        addPoint(padding + Math.random() * w, padding + Math.random() * h);
      }
  }

  return points;
};
