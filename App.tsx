import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Controls } from './components/Controls';
import { Visualizer } from './components/Visualizer';
import { generateDataset } from './utils/generators';
import { dbscanGenerator } from './utils/dbscan';
import { kmeansGenerator } from './utils/kmeans';
import { Point, DatasetType, AlgoConfig, AnimationState, AnimationStep } from './types';

const INITIAL_CONFIG: AlgoConfig = {
  eps: 32,
  minPts: 4,
  k: 3
};

const WIDTH = 600;
const HEIGHT = 600;
const POINT_COUNT = 500;

function App() {
  const [points, setPoints] = useState<Point[]>([]);
  const [kmPoints, setKmPoints] = useState<Point[]>([]);
  const [datasetType, setDatasetType] = useState<DatasetType>('smiley');
  const [config, setConfig] = useState<AlgoConfig>(INITIAL_CONFIG);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(30);
  const [finished, setFinished] = useState(false);

  const [dbscanState, setDbscanState] = useState<AnimationState>({
    currentPointId: null,
    neighborsIds: [],
    scanning: false,
    message: "Ready"
  });
  const [kmeansState, setKmeansState] = useState<AnimationState>({
    currentPointId: null,
    neighborsIds: [],
    scanning: false,
    message: "Ready",
    centroids: []
  });

  const dbscanGenRef = useRef<Generator<AnimationStep, void, unknown> | null>(null);
  const kmeansGenRef = useRef<Generator<AnimationStep, void, unknown> | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const initData = useCallback(() => {
    const rawPoints = generateDataset(datasetType, WIDTH, HEIGHT, POINT_COUNT);
    setPoints(rawPoints);
    setKmPoints(rawPoints.map(p => ({ ...p, clusterId: null, visited: false })));
    resetAnimation();
  }, [datasetType]);

  useEffect(() => {
    initData();
  }, [initData]);

  const resetAnimation = () => {
    setIsPlaying(false);
    setFinished(false);
    setDbscanState({ currentPointId: null, neighborsIds: [], scanning: false, message: "IDLE" });
    setKmeansState({ currentPointId: null, neighborsIds: [], scanning: false, message: "IDLE", centroids: [] });
    dbscanGenRef.current = null;
    kmeansGenRef.current = null;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    setPoints(prev => prev.map(p => ({ ...p, clusterId: null, visited: false, isCore: false })));
    setKmPoints(prev => prev.map(p => ({ ...p, clusterId: null, visited: false })));
  };

  const handleConfigChange = (newConfig: AlgoConfig) => {
    setConfig(newConfig);
    resetAnimation();
  };

  const step = useCallback(() => {
    if (!dbscanGenRef.current) dbscanGenRef.current = dbscanGenerator(points, config.eps, config.minPts);
    if (!kmeansGenRef.current) kmeansGenRef.current = kmeansGenerator(kmPoints, config.k, WIDTH, HEIGHT);

    const dbscanSteps = Math.max(1, Math.floor(speed / 3));
    const kmeansSteps = Math.max(1, Math.floor(speed / 15));

    let localDbscanDone = false;
    let localKmeansDone = false;

    // 1. Process DBSCAN Steps
    setPoints(prevPoints => {
      let nextPoints = [...prevPoints];
      let lastAction: AnimationStep | null = null;
      
      for(let i = 0; i < dbscanSteps; i++) {
        const result = dbscanGenRef.current!.next();
        if (result.done) {
          localDbscanDone = true;
          break;
        }
        lastAction = result.value;
        const action = lastAction;

        if (action.type === 'visiting') {
          const idx = nextPoints.findIndex(p => p.id === action.pointId);
          if (idx !== -1) nextPoints[idx] = { ...nextPoints[idx], visited: true };
        } else if (action.type === 'cluster_start' || action.type === 'cluster_add') {
          const idx = nextPoints.findIndex(p => p.id === action.pointId);
          if (idx !== -1) {
            nextPoints[idx] = { 
              ...nextPoints[idx], 
              clusterId: action.clusterId, 
              isCore: action.type === 'cluster_start' || (action as any).isCore 
            };
          }
        } else if (action.type === 'noise') {
          const idx = nextPoints.findIndex(p => p.id === action.pointId);
          if (idx !== -1) nextPoints[idx] = { ...nextPoints[idx], clusterId: -1 };
        }
      }

      // Update DBSCAN visual state based on the LAST action in this batch
      if (localDbscanDone) {
        const clustered = nextPoints.filter(p => p.clusterId !== null && p.clusterId >= 0);
        const clusterCount = new Set(clustered.map(p => p.clusterId)).size;
        const outlierCount = nextPoints.filter(p => p.clusterId === -1).length;
        setDbscanState({
          currentPointId: null,
          neighborsIds: [],
          scanning: false,
          message: `FINISHED: ${clusterCount} CLUSTERS • ${outlierCount} OUTLIERS`
        });
      } else if (lastAction) {
        setDbscanState(s => ({
          ...s,
          currentPointId: lastAction!.type === 'visiting' || lastAction!.type === 'neighbors' ? (lastAction as any).pointId : s.currentPointId,
          neighborsIds: lastAction!.type === 'neighbors' ? (lastAction as any).neighborIds : s.neighborsIds,
          message: lastAction!.type === 'cluster_start' ? `CLUSTERING: #${(lastAction as any).clusterId + 1}` : s.message
        }));
      }

      return nextPoints;
    });

    // 2. Process K-Means Steps
    for(let j = 0; j < kmeansSteps; j++) {
      const kmResult = kmeansGenRef.current!.next();
      if (kmResult.done) {
        localKmeansDone = true;
        break;
      }
      const action = kmResult.value;
      if (action.type === 'kmeans_move') {
        setKmeansState(s => ({ ...s, centroids: action.centroids, message: "UPDATING CENTROIDS" }));
      } else if (action.type === 'kmeans_assign') {
        setKmPoints(prev => {
          const next = [...prev];
          action.points.forEach(a => {
            const idx = next.findIndex(p => p.id === a.id);
            if (idx !== -1) next[idx] = { ...next[idx], clusterId: a.clusterId };
          });
          return next;
        });
        setKmeansState(s => ({ ...s, message: "ASSIGNING POINTS" }));
      }
    }

    if (localKmeansDone) {
      setKmeansState(s => ({ ...s, message: "CONVERGED" }));
    }

    if (localDbscanDone && localKmeansDone) {
      setFinished(true);
      setIsPlaying(false);
    } else if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(step);
    }
  }, [points, kmPoints, config, speed, isPlaying]);

  useEffect(() => {
    if (isPlaying && !finished) {
      animationFrameRef.current = requestAnimationFrame(step);
    }
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, finished, step]);

  const visitedCount = points.filter(p => p.visited).length;
  const progress = points.length > 0 ? (visitedCount / points.length) * 100 : 0;

  return (
    <div className="flex h-screen w-full bg-[#050505] overflow-hidden font-sans text-slate-400">
      <Controls 
        config={config} setConfig={handleConfigChange}
        datasetType={datasetType} setDatasetType={setDatasetType}
        isPlaying={isPlaying} onPlayPause={() => setIsPlaying(!isPlaying)}
        onReset={resetAnimation} onRegenerate={initData}
        speed={speed} setSpeed={setSpeed} progress={progress}
      />
      
      <main className="flex-1 p-10 grid grid-cols-2 gap-10 h-full relative">
         <Visualizer 
            points={points} 
            animState={dbscanState} 
            eps={config.eps} 
            width={WIDTH}
            height={HEIGHT}
            showHulls
            title="DBSCAN (Density Propagation)"
         />
         <Visualizer 
            points={kmPoints} 
            animState={kmeansState} 
            width={WIDTH}
            height={HEIGHT}
            title="K-Means (Centroid Convergence)"
         />
      </main>
    </div>
  );
}

export default App;
