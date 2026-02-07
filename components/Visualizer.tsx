import React, { useMemo } from 'react';
import { Point, AnimationState, Centroid } from '../types';

interface VisualizerProps {
  points: Point[];
  animState: AnimationState;
  eps?: number;
  width: number;
  height: number;
  showHulls?: boolean;
  title: string;
}

const CLUSTER_COLORS = [
  { main: '#ff4d4d', hull: 'rgba(255, 77, 77, 0.12)', glow: 'rgba(255, 77, 77, 0.4)' }, // Red
  { main: '#4da6ff', hull: 'rgba(77, 166, 255, 0.12)', glow: 'rgba(77, 166, 255, 0.4)' }, // Blue
  { main: '#4dff88', hull: 'rgba(77, 255, 136, 0.12)', glow: 'rgba(77, 255, 136, 0.4)' }, // Green
  { main: '#ffcc33', hull: 'rgba(255, 204, 51, 0.12)', glow: 'rgba(255, 204, 51, 0.4)' }, // Yellow
  { main: '#ff4dff', hull: 'rgba(255, 77, 255, 0.12)', glow: 'rgba(255, 77, 255, 0.4)' }, // Pink
  { main: '#a64dff', hull: 'rgba(166, 77, 255, 0.12)', glow: 'rgba(166, 77, 255, 0.4)' }, // Purple
  { main: '#ff944d', hull: 'rgba(255, 148, 77, 0.12)', glow: 'rgba(255, 148, 77, 0.4)' }, // Orange
  { main: '#4dffff', hull: 'rgba(77, 255, 255, 0.12)', glow: 'rgba(77, 255, 255, 0.4)' }, // Cyan
];

const OUTLIER_COLOR = '#475569'; // Dark Slate for outliers

export const Visualizer: React.FC<VisualizerProps> = ({ points, animState, eps, width, height, showHulls = false, title }) => {
  const isFinished = useMemo(() => animState.message.includes('FINISHED') || animState.message.includes('CONVERGED'), [animState.message]);

  const currentPoint = useMemo(() => 
    animState.currentPointId !== null ? points.find(p => p.id === animState.currentPointId) : null
  , [points, animState.currentPointId]);

  const neighbors = useMemo(() => {
    if (!animState.neighborsIds.length || !currentPoint || isFinished) return [];
    return points.filter(p => animState.neighborsIds.includes(p.id));
  }, [points, animState.neighborsIds, currentPoint, isFinished]);

  const clusterHulls = useMemo(() => {
    if (!showHulls || !eps || isFinished) return [];
    const hulls: Record<number, Point[]> = {};
    points.forEach(p => {
      if (p.clusterId !== null && p.clusterId >= 0 && p.isCore) {
        if (!hulls[p.clusterId]) hulls[p.clusterId] = [];
        hulls[p.clusterId].push(p);
      }
    });
    return Object.entries(hulls);
  }, [points, showHulls, eps, isFinished]);

  const shouldShowRadius = currentPoint && eps && !isFinished;

  return (
    <div className="relative w-full h-full flex flex-col rounded-3xl overflow-hidden shadow-2xl bg-[#080808] border border-white/5">
      <div className="bg-[#111] px-5 py-3 border-b border-white/5 flex justify-between items-center">
         <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${title.includes('DBSCAN') ? 'bg-emerald-500' : 'bg-indigo-500'} ${!isFinished ? 'animate-pulse' : ''}`} />
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/80">{title}</span>
         </div>
         <div className="bg-white/5 px-2 py-0.5 rounded text-[9px] font-mono text-white/40 uppercase tracking-tighter">
            {animState.message}
         </div>
      </div>
      
      <div className="flex-1 relative overflow-hidden">
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="cursor-crosshair select-none">
          <defs>
            <pattern id={`grid-${title}`} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#grid-${title})`} />

          {/* 1. CLUSTER HULLS */}
          {clusterHulls.map(([id, corePoints]) => {
            const colorSet = CLUSTER_COLORS[Number(id) % CLUSTER_COLORS.length];
            return (
              <g key={`hull-${id}`} style={{ mixBlendMode: 'screen' }}>
                {corePoints.map(p => (
                  <circle
                    key={`hull-p-${p.id}`}
                    cx={p.x}
                    cy={p.y}
                    r={eps}
                    fill={colorSet.hull}
                    className="transition-all duration-700 ease-out"
                  />
                ))}
              </g>
            );
          })}

          {/* 2. CENTROIDS */}
          {animState.centroids && animState.centroids.map(c => (
            <g key={`centroid-${c.id}`} style={{ transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
               <circle cx={c.x} cy={c.y} r={18} fill="none" stroke={c.color} strokeWidth="1" strokeDasharray="4 4" className={!isFinished ? "animate-[spin_10s_linear_infinite]" : ""} style={{ transformOrigin: `${c.x}px ${c.y}px` }} />
               <circle cx={c.x} cy={c.y} r={4} fill={c.color} />
               <path d={`M ${c.x-10} ${c.y} L ${c.x+10} ${c.y} M ${c.x} ${c.y-10} L ${c.x} ${c.y+10}`} stroke={c.color} strokeWidth="1.5" />
            </g>
          ))}

          {/* 3. ACTIVE SEARCH RADIUS */}
          {shouldShowRadius && (
            <g>
              <circle 
                cx={currentPoint!.x} 
                cy={currentPoint!.y} 
                r={eps} 
                fill="rgba(255, 255, 255, 0.03)"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="1"
                strokeDasharray="4 2"
              />
              {neighbors.map(n => (
                <line
                  key={`link-${currentPoint!.id}-${n.id}`}
                  x1={currentPoint!.x}
                  y1={currentPoint!.y}
                  x2={n.x}
                  y2={n.y}
                  stroke="rgba(255, 255, 255, 0.15)"
                  strokeWidth="0.5"
                />
              ))}
            </g>
          )}

          {/* 4. POINTS */}
          {points.map((p) => {
            const isCurrent = p.id === animState.currentPointId && !isFinished;
            const isClustered = p.clusterId !== null && p.clusterId >= 0;
            const isNoise = p.clusterId === -1;
            const colorSet = isClustered ? CLUSTER_COLORS[p.clusterId! % CLUSTER_COLORS.length] : null;

            return (
              <g key={p.id} transform={`translate(${p.x}, ${p.y})`}>
                <circle
                  r={isCurrent ? 6 : (isClustered ? 3.5 : 2.5)}
                  fill={isClustered ? colorSet?.main : (isNoise ? 'rgba(71, 85, 105, 0.4)' : 'transparent')}
                  stroke={isClustered ? colorSet?.main : (isNoise ? OUTLIER_COLOR : '#334155')}
                  strokeWidth={isClustered || isNoise ? 1 : 1}
                  className="transition-all duration-300"
                />

                {isCurrent && (
                  <circle r={10} fill="none" stroke="white" strokeWidth="1" className="animate-ping" />
                )}
              </g>
            );
          })}
        </svg>

        {/* 5. LEGEND - ONLY OUTLIERS SHOWN */}
        <div className="absolute bottom-4 left-4 flex gap-4 bg-[#0a0a0a]/80 backdrop-blur-md px-3 py-2 rounded-xl border border-white/5 shadow-xl w-fit">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full border border-slate-600 bg-slate-600/40" style={{ borderColor: OUTLIER_COLOR }} />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outlier / Noise</span>
          </div>
        </div>
      </div>
    </div>
  );
};