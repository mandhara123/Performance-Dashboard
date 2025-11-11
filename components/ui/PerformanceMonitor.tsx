'use client';

import React, { useEffect, useState } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { PerformanceMetrics } from '@/lib/types';

export interface PerformanceMonitorProps {
  className?: string;
  showGraph?: boolean;
  compact?: boolean;
}

export default function PerformanceMonitor({
  className = '',
  showGraph = true,
  compact = false,
}: PerformanceMonitorProps) {
  const { 
    metrics, 
    performanceHistory, 
    averageMetrics,
    performanceStatus,
    actions: { measureOperation }
  } = usePerformanceMonitor({
    updateInterval: 1000,
    enableMemoryTracking: true,
    maxSampleSize: 60,
  });

  const [stressTestActive, setStressTestActive] = useState(false);

  // Stress test function
  const runStressTest = () => {
    setStressTestActive(true);
    
    const stressTest = () => {
      return measureOperation(() => {
        // Simulate heavy computation
        const start = performance.now();
        while (performance.now() - start < 10) {
          // Busy wait for 10ms
          Math.random() * Math.random();
        }
        return true;
      });
    };

    // Run stress test for 5 seconds
    const interval = setInterval(() => {
      stressTest();
    }, 16); // ~60fps

    setTimeout(() => {
      clearInterval(interval);
      setStressTestActive(false);
    }, 5000);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (isGood: boolean): string => {
    return isGood ? 'text-green-600' : 'text-red-600';
  };

  const getStatusBg = (isGood: boolean): string => {
    return isGood ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  const MetricCard = ({ 
    title, 
    value, 
    unit, 
    isGood, 
    average 
  }: { 
    title: string; 
    value: number; 
    unit: string; 
    isGood: boolean; 
    average?: number;
  }) => (
    <div className={`p-3 rounded-lg border ${getStatusBg(isGood)}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <div className={`text-xs ${getStatusColor(isGood)}`}>
          {isGood ? '✓' : '⚠'}
        </div>
      </div>
      <div className="mt-1">
        <span className={`text-2xl font-bold ${getStatusColor(isGood)}`}>
          {typeof value === 'number' ? value.toFixed(1) : '0.0'}
        </span>
        <span className="text-sm text-gray-500 ml-1">{unit}</span>
      </div>
      {average !== undefined && (
        <div className="text-xs text-gray-500 mt-1">
          Avg: {average.toFixed(1)} {unit}
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-4 px-3 py-1 bg-gray-900 text-white rounded-full text-xs ${className}`}>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${performanceStatus.fps ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{metrics.fps} FPS</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${performanceStatus.memory ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{metrics.memoryUsage} MB</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-2 h-2 rounded-full ${performanceStatus.renderTime ? 'bg-green-400' : 'bg-red-400'}`} />
          <span>{metrics.renderTime.toFixed(1)}ms</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Performance Monitor</h3>
          <p className="text-sm text-gray-500">
            Real-time performance metrics and system health
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            performanceStatus.overall 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {performanceStatus.overall ? 'Optimal' : 'Degraded'}
          </div>
          
          <button
            onClick={runStressTest}
            disabled={stressTestActive}
            className={`px-3 py-1 text-xs rounded ${
              stressTestActive
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {stressTestActive ? 'Testing...' : 'Stress Test'}
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="Frame Rate"
            value={metrics.fps}
            unit="FPS"
            isGood={performanceStatus.fps}
            average={averageMetrics.fps}
          />
          
          <MetricCard
            title="Memory Usage"
            value={metrics.memoryUsage}
            unit="MB"
            isGood={performanceStatus.memory}
            average={averageMetrics.memoryUsage}
          />
          
          <MetricCard
            title="Render Time"
            value={metrics.renderTime}
            unit="ms"
            isGood={performanceStatus.renderTime}
            average={averageMetrics.renderTime}
          />
          
          <MetricCard
            title="Processing"
            value={metrics.dataProcessingTime}
            unit="ms"
            isGood={metrics.dataProcessingTime < 50}
            average={averageMetrics.dataProcessingTime}
          />
        </div>

        {/* Performance Graph */}
        {showGraph && performanceHistory.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Performance Trend (Last 60s)</h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* FPS Graph */}
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-600 mb-2">FPS Over Time</div>
                <div className="h-20 flex items-end gap-1">
                  {performanceHistory.slice(-30).map((metric, index) => (
                    <div
                      key={index}
                      className={`flex-1 rounded-t ${
                        metric.fps >= 55 ? 'bg-green-400' : metric.fps >= 30 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{
                        height: `${Math.max(2, (metric.fps / 60) * 100)}%`
                      }}
                      title={`${metric.fps} FPS`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>60</span>
                </div>
              </div>

              {/* Memory Graph */}
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-600 mb-2">Memory Usage</div>
                <div className="h-20 flex items-end gap-1">
                  {performanceHistory.slice(-30).map((metric, index) => {
                    const maxMemory = Math.max(...performanceHistory.map(m => m.memoryUsage));
                    return (
                      <div
                        key={index}
                        className={`flex-1 rounded-t ${
                          metric.memoryUsage < 50 ? 'bg-green-400' : 
                          metric.memoryUsage < 100 ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                        style={{
                          height: `${Math.max(2, (metric.memoryUsage / Math.max(maxMemory, 100)) * 100)}%`
                        }}
                        title={`${metric.memoryUsage.toFixed(1)} MB`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>MB</span>
                </div>
              </div>

              {/* Render Time Graph */}
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-600 mb-2">Render Time</div>
                <div className="h-20 flex items-end gap-1">
                  {performanceHistory.slice(-30).map((metric, index) => (
                    <div
                      key={index}
                      className={`flex-1 rounded-t ${
                        metric.renderTime < 16.67 ? 'bg-green-400' : 
                        metric.renderTime < 33.33 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{
                        height: `${Math.max(2, (metric.renderTime / 50) * 100)}%`
                      }}
                      title={`${metric.renderTime.toFixed(2)} ms`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>50ms</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Tips */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Performance Tips</h4>
          <div className="text-xs text-blue-700 space-y-1">
            {!performanceStatus.fps && (
              <div>• FPS is low - consider reducing data points or enabling data aggregation</div>
            )}
            {!performanceStatus.memory && (
              <div>• Memory usage is high - try clearing old data or reducing cache size</div>
            )}
            {!performanceStatus.renderTime && (
              <div>• Render time is high - consider optimizing chart complexity</div>
            )}
            {performanceStatus.overall && (
              <div>✓ All performance metrics are within optimal ranges</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}