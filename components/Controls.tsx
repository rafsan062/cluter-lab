import React from 'react';
import { Play, Pause, RotateCw, RefreshCw, Info } from 'lucide-react';
import { DatasetType, AlgoConfig } from '../types';
import { Tooltip } from './Tooltip';

interface ControlsProps {
  config: AlgoConfig;
  setConfig: (c: AlgoConfig) => void;
  datasetType: DatasetType;
  setDatasetType: (t: DatasetType) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
  onReset: () => void;
  onRegenerate: () => void;
  speed: number;
  setSpeed: (s: number) => void;
  progress: number;
}

export const Controls: React.FC<ControlsProps> = ({
  config,
  setConfig,
  datasetType,
  setDatasetType,
  isPlaying,
  onPlayPause,
  onReset,
  onRegenerate,
  speed,
  setSpeed,
  progress
}) => {
  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-slate-800 p-6 space-y-8 min-w-[320px] overflow-y-auto">
      <div>
        <h1 className="text-2xl font-black text-white mb-2 tracking-tighter italic">
           CLUSTERING<span className="text-indigo-500">LAB</span>
        </h1>
        <p className="text-slate-500 text-xs leading-relaxed uppercase tracking-widest font-bold">Density vs Centroid Comparison</p>
      </div>

      {/* Dataset Selection */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">Dataset Architecture</label>
        <div className="grid grid-cols-2 gap-2">
            {(['smiley', 'moons', 'blobs', 'circles', 'random'] as DatasetType[]).map((type) => (
                <button
                    key={type}
                    onClick={() => setDatasetType(type)}
                    className={`px-3 py-2 text-[10px] font-bold rounded border transition-all uppercase tracking-widest ${
                        datasetType === type 
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
                        : 'bg-[#111] border-slate-800 text-slate-500 hover:border-slate-600'
                    }`}
                >
                    {type}
                </button>
            ))}
        </div>
        <button 
            onClick={onRegenerate}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[10px] font-bold text-slate-400 uppercase tracking-widest transition-colors"
        >
            <RefreshCw size={12} /> New Sampling
        </button>
      </div>

      {/* Parameters */}
      <div className="space-y-6 pt-6 border-t border-slate-900">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">DBSCAN Config</label>
        
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Epsilon (Radius)</span>
                    <span className="text-indigo-400">{config.eps}px</span>
                </div>
                <input 
                    type="range" min="10" max="80" value={config.eps} 
                    onChange={(e) => setConfig({ ...config, eps: Number(e.target.value) })}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Min Points</span>
                    <span className="text-indigo-400">{config.minPts}</span>
                </div>
                <input 
                    type="range" min="2" max="15" value={config.minPts} 
                    onChange={(e) => setConfig({ ...config, minPts: Number(e.target.value) })}
                    className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
            </div>
        </div>

        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 pt-4 block">K-Means Config</label>
        <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <span>Clusters (K)</span>
                <span className="text-indigo-400">{config.k}</span>
            </div>
            <input 
                type="range" min="2" max="8" value={config.k} 
                onChange={(e) => setConfig({ ...config, k: Number(e.target.value) })}
                className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
        </div>
      </div>

      {/* Playback */}
      <div className="space-y-6 pt-6 border-t border-slate-900">
        <div className="flex items-center gap-2">
             <button
                onClick={onPlayPause}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded font-black text-[11px] uppercase tracking-widest transition-all ${
                    isPlaying 
                    ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_15px_rgba(217,119,6,0.2)]' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(5,150,105,0.2)]'
                }`}
             >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                {isPlaying ? 'PAUSE' : 'RUN EXPERIMENT'}
             </button>
             
             <button
                onClick={onReset}
                className="p-3 rounded bg-[#111] text-slate-500 hover:bg-slate-900 border border-slate-800"
             >
                <RotateCw size={14} />
             </button>
        </div>

        <div className="space-y-2">
             <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-600">
                <span>Playback Velocity</span>
                <span>{speed}x</span>
             </div>
             <input 
                type="range" min="1" max="100" value={speed} 
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full h-1 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-slate-600"
            />
        </div>
      </div>
        
        <div className="mt-auto pt-6 border-t border-slate-900">
             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-700 mb-2">
                 <span>Experiment Pipeline</span>
                 <span>{Math.round(progress)}%</span>
             </div>
             <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                 <div className="h-full bg-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${progress}%` }} />
             </div>
        </div>
    </div>
  );
};
