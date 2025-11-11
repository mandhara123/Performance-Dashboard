'use client';

import React, { useState, useEffect, useRef } from 'react';

interface FPSCounterProps {
  isVisible?: boolean;
  className?: string;
}

export function FPSCounter({ isVisible = true, className = '' }: FPSCounterProps) {
  const [fps, setFps] = useState(60);
  const [avgFps, setAvgFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!isVisible) return;

    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) { // Update every second
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);

        // Keep history for average calculation (last 10 seconds)
        fpsHistoryRef.current.push(currentFps);
        if (fpsHistoryRef.current.length > 10) {
          fpsHistoryRef.current.shift();
        }

        // Calculate average FPS
        const avg = fpsHistoryRef.current.reduce((sum, fps) => sum + fps, 0) / fpsHistoryRef.current.length;
        setAvgFps(Math.round(avg));

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(measureFPS);
    };

    animationFrameRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const getFpsColor = (fps: number) => {
    if (fps >= 50) return 'text-green-500';
    if (fps >= 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getFpsStatus = (fps: number) => {
    if (fps >= 50) return 'Excellent';
    if (fps >= 30) return 'Good';
    return 'Poor';
  };

  return (
    <div className={`bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 min-w-[180px] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">Performance</span>
        <div className={`w-2 h-2 rounded-full ${fps >= 50 ? 'bg-green-500' : fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">FPS:</span>
          <span className={`text-lg font-bold ${getFpsColor(fps)}`}>
            {fps}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Avg:</span>
          <span className={`text-sm font-medium ${getFpsColor(avgFps)}`}>
            {avgFps}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Status:</span>
          <span className={`text-xs font-medium ${getFpsColor(fps)}`}>
            {getFpsStatus(fps)}
          </span>
        </div>
      </div>

      {/* FPS History Bar */}
      <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 ${
            fps >= 50 ? 'bg-green-500' : fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(fps / 60 * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}