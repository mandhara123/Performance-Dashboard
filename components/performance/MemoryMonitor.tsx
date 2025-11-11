'use client';

import React, { useState, useEffect, useRef } from 'react';

interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface MemoryMonitorProps {
  isVisible?: boolean;
  className?: string;
}

export function MemoryMonitor({ isVisible = true, className = '' }: MemoryMonitorProps) {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [memoryHistory, setMemoryHistory] = useState<number[]>([]);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isVisible) return;

    const updateMemoryInfo = () => {
      // Check if performance.memory is available (Chrome/Edge)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const info: MemoryInfo = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
        
        setMemoryInfo(info);
        
        // Update history for trend (keep last 20 measurements)
        setMemoryHistory(prev => {
          const newHistory = [...prev, memory.usedJSHeapSize];
          return newHistory.slice(-20);
        });
      }
    };

    // Initial measurement
    updateMemoryInfo();
    
    // Update every 2 seconds
    intervalRef.current = setInterval(updateMemoryInfo, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isVisible]);

  if (!isVisible || !memoryInfo) return null;

  const formatBytes = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  const getUsagePercentage = (): number => {
    return (memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100;
  };

  const getMemoryStatus = (percentage: number): { color: string; status: string } => {
    if (percentage < 60) return { color: 'text-green-500', status: 'Good' };
    if (percentage < 80) return { color: 'text-yellow-500', status: 'Fair' };
    return { color: 'text-red-500', status: 'High' };
  };

  const usagePercentage = getUsagePercentage();
  const { color, status } = getMemoryStatus(usagePercentage);

  // Calculate trend (increasing/decreasing)
  const getTrend = (): 'up' | 'down' | 'stable' => {
    if (memoryHistory.length < 5) return 'stable';
    
    const recent = memoryHistory.slice(-3);
    const earlier = memoryHistory.slice(-6, -3);
    
    const recentAvg = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, val) => sum + val, 0) / earlier.length;
    
    const diff = ((recentAvg - earlierAvg) / earlierAvg) * 100;
    
    if (diff > 5) return 'up';
    if (diff < -5) return 'down';
    return 'stable';
  };

  const trend = getTrend();

  return (
    <div className={`bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 min-w-[200px] ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400 font-medium">Memory Usage</span>
        <div className="flex items-center space-x-1">
          {trend === 'up' && <span className="text-red-400 text-xs">↗</span>}
          {trend === 'down' && <span className="text-green-400 text-xs">↘</span>}
          {trend === 'stable' && <span className="text-gray-400 text-xs">→</span>}
          <div className={`w-2 h-2 rounded-full ${
            usagePercentage < 60 ? 'bg-green-500' : 
            usagePercentage < 80 ? 'bg-yellow-500' : 'bg-red-500'
          }`}></div>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Used:</span>
          <span className={`text-sm font-bold ${color}`}>
            {formatBytes(memoryInfo.usedJSHeapSize)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Total:</span>
          <span className="text-sm font-medium text-gray-300">
            {formatBytes(memoryInfo.totalJSHeapSize)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Limit:</span>
          <span className="text-sm font-medium text-gray-300">
            {formatBytes(memoryInfo.jsHeapSizeLimit)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Status:</span>
          <span className={`text-xs font-medium ${color}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Memory Usage Bar */}
      <div className="mt-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Usage</span>
          <span>{usagePercentage.toFixed(1)}%</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              usagePercentage < 60 ? 'bg-green-500' : 
              usagePercentage < 80 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Memory History Sparkline */}
      <div className="mt-2">
        <div className="text-xs text-gray-400 mb-1">Trend</div>
        <div className="h-8 flex items-end space-x-px">
          {memoryHistory.slice(-10).map((value, index) => {
            const height = Math.max(2, (value / Math.max(...memoryHistory)) * 100);
            return (
              <div
                key={index}
                className={`flex-1 rounded-sm ${
                  index === memoryHistory.slice(-10).length - 1 ? color.replace('text-', 'bg-') : 'bg-gray-600'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}