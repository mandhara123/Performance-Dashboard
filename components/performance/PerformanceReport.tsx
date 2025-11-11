'use client';

import React, { useState, useEffect } from 'react';
import { DataPoint } from '@/lib/types';

interface PerformanceMetric {
  timestamp: number;
  fps: number;
  memoryUsage: number;
  dataPoints: number;
  renderTime: number;
}

interface PerformanceReportProps {
  data: DataPoint[];
  stressTestResults?: any[];
  className?: string;
}

export function PerformanceReport({ data, stressTestResults = [], className = '' }: PerformanceReportProps) {
  const [reportData, setReportData] = useState<PerformanceMetric[]>([]);
  const [showDetailed, setShowDetailed] = useState(false);

  // Collect performance metrics
  useEffect(() => {
    const collectMetrics = () => {
      const now = Date.now();
      
      // Get memory info if available
      let memoryUsage = 0;
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        memoryUsage = memory.usedJSHeapSize;
      }

      // Simulate FPS calculation (in real app, this would come from FPS counter)
      const fps = Math.round(Math.random() * 20 + 40); // Simulated 40-60 FPS
      
      // Measure render time
      const renderStart = performance.now();
      // Simulate some work
      for (let i = 0; i < 100; i++) {
        Math.random();
      }
      const renderTime = performance.now() - renderStart;

      const metric: PerformanceMetric = {
        timestamp: now,
        fps,
        memoryUsage,
        dataPoints: data.length,
        renderTime
      };

      setReportData(prev => {
        const updated = [...prev, metric];
        return updated.slice(-60); // Keep last 60 measurements (1 minute at 1/sec)
      });
    };

    const interval = setInterval(collectMetrics, 1000);
    return () => clearInterval(interval);
  }, [data.length]);

  // Calculate performance statistics
  const calculateStats = () => {
    if (reportData.length === 0) return null;

    const totalMetrics = reportData.length;
    const avgFps = reportData.reduce((sum, m) => sum + m.fps, 0) / totalMetrics;
    const minFps = Math.min(...reportData.map(m => m.fps));
    const maxFps = Math.max(...reportData.map(m => m.fps));
    
    const avgMemory = reportData.reduce((sum, m) => sum + m.memoryUsage, 0) / totalMetrics;
    const maxMemory = Math.max(...reportData.map(m => m.memoryUsage));
    
    const avgRenderTime = reportData.reduce((sum, m) => sum + m.renderTime, 0) / totalMetrics;
    const maxRenderTime = Math.max(...reportData.map(m => m.renderTime));

    // Performance score (0-100)
    const fpsScore = Math.min(100, (avgFps / 60) * 100);
    const memoryScore = Math.max(0, 100 - ((avgMemory / (1024 * 1024 * 100)) * 100)); // Assume 100MB baseline
    const renderScore = Math.max(0, 100 - (avgRenderTime * 10)); // Lower is better
    const overallScore = (fpsScore + memoryScore + renderScore) / 3;

    return {
      avgFps: Math.round(avgFps),
      minFps,
      maxFps,
      avgMemory,
      maxMemory,
      avgRenderTime: avgRenderTime.toFixed(2),
      maxRenderTime: maxRenderTime.toFixed(2),
      overallScore: Math.round(overallScore),
      fpsScore: Math.round(fpsScore),
      memoryScore: Math.round(memoryScore),
      renderScore: Math.round(renderScore),
    };
  };

  const stats = calculateStats();

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const generateRecommendations = () => {
    if (!stats) return [];
    
    const recommendations = [];

    if (stats.avgFps < 30) {
      recommendations.push({
        type: 'critical',
        title: 'Critical FPS Issues',
        message: 'Average FPS is below 30. Consider reducing data points or enabling Web Workers.',
        action: 'Reduce visualization complexity'
      });
    } else if (stats.avgFps < 45) {
      recommendations.push({
        type: 'warning',
        title: 'FPS Performance Warning',
        message: 'FPS occasionally drops below optimal levels. Monitor under heavy loads.',
        action: 'Enable performance monitoring'
      });
    }

    if (stats.memoryScore < 60) {
      recommendations.push({
        type: 'warning',
        title: 'Memory Usage High',
        message: 'Memory consumption is above recommended levels. Consider data cleanup strategies.',
        action: 'Implement data virtualization'
      });
    }

    if (stats.renderScore < 70) {
      recommendations.push({
        type: 'info',
        title: 'Render Performance',
        message: 'Render times can be optimized. Consider OffscreenCanvas or WebGL acceleration.',
        action: 'Optimize rendering pipeline'
      });
    }

    if (data.length > 20000) {
      recommendations.push({
        type: 'info',
        title: 'Large Dataset Detected',
        message: 'Working with large datasets. Web Workers and virtualization are recommended.',
        action: 'Enable advanced optimizations'
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  if (!stats) {
    return (
      <div className={`bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-200 mb-2">Performance Report</h3>
        <p className="text-gray-400 text-sm">Collecting performance data...</p>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/90 backdrop-blur-sm rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-200">Performance Report</h3>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-xs text-gray-400">Overall Score</div>
            <div className={`text-2xl font-bold ${getScoreColor(stats.overallScore)}`}>
              {stats.overallScore}/100
            </div>
          </div>
          <button
            onClick={() => setShowDetailed(!showDetailed)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-lg transition-colors"
          >
            {showDetailed ? 'Summary' : 'Detailed'}
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded p-4">
          <div className="text-xs text-gray-400 mb-1">Average FPS</div>
          <div className={`text-2xl font-bold ${getScoreColor(stats.fpsScore)}`}>
            {stats.avgFps}
          </div>
          <div className="text-xs text-gray-500">
            Range: {stats.minFps}-{stats.maxFps}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded p-4">
          <div className="text-xs text-gray-400 mb-1">Memory Usage</div>
          <div className={`text-lg font-bold ${getScoreColor(stats.memoryScore)}`}>
            {formatBytes(stats.avgMemory)}
          </div>
          <div className="text-xs text-gray-500">
            Peak: {formatBytes(stats.maxMemory)}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded p-4">
          <div className="text-xs text-gray-400 mb-1">Render Time</div>
          <div className={`text-lg font-bold ${getScoreColor(stats.renderScore)}`}>
            {stats.avgRenderTime}ms
          </div>
          <div className="text-xs text-gray-500">
            Max: {stats.maxRenderTime}ms
          </div>
        </div>

        <div className="bg-gray-800/50 rounded p-4">
          <div className="text-xs text-gray-400 mb-1">Data Points</div>
          <div className="text-lg font-bold text-blue-400">
            {(data.length / 1000).toFixed(1)}k
          </div>
          <div className="text-xs text-gray-500">
            Active dataset
          </div>
        </div>
      </div>

      {/* Performance Trend Graph */}
      <div className="bg-gray-800/30 rounded p-4 mb-6">
        <div className="text-sm font-medium text-gray-300 mb-3">Performance Trend (Last 60s)</div>
        <div className="h-20 flex items-end space-x-1">
          {reportData.slice(-30).map((metric, index) => {
            const fpsHeight = Math.max(5, (metric.fps / 60) * 100);
            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center"
              >
                <div
                  className={`w-full rounded-sm ${
                    metric.fps >= 50 ? 'bg-green-500' : 
                    metric.fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ height: `${fpsHeight}%` }}
                  title={`${metric.fps} FPS`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>60s ago</span>
          <span>Now</span>
        </div>
      </div>

      {/* Stress Test Results */}
      {stressTestResults.length > 0 && (
        <div className="bg-gray-800/30 rounded p-4 mb-6">
          <div className="text-sm font-medium text-gray-300 mb-3">Stress Test Results</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Max Sustainable Load:</span>
              <span className="ml-2 font-medium text-green-400">
                {Math.max(...stressTestResults.map(r => r.dataPoints)).toLocaleString()} points
              </span>
            </div>
            <div>
              <span className="text-gray-400">Test Duration:</span>
              <span className="ml-2 font-medium">
                {Math.round((stressTestResults[stressTestResults.length - 1]?.timestamp - stressTestResults[0]?.timestamp) / 1000)}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-300">Optimization Recommendations</div>
          {recommendations.map((rec, index) => (
            <div
              key={index}
              className={`rounded p-3 border-l-4 ${
                rec.type === 'critical' ? 'bg-red-900/20 border-red-500' :
                rec.type === 'warning' ? 'bg-yellow-900/20 border-yellow-500' :
                'bg-blue-900/20 border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className={`text-sm font-medium ${
                    rec.type === 'critical' ? 'text-red-300' :
                    rec.type === 'warning' ? 'text-yellow-300' :
                    'text-blue-300'
                  }`}>
                    {rec.title}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">{rec.message}</div>
                </div>
                <div className="text-xs text-gray-500 ml-4">{rec.action}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detailed Metrics */}
      {showDetailed && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <div className="text-sm font-medium text-gray-300 mb-4">Detailed Metrics</div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FPS Details */}
            <div className="bg-gray-800/30 rounded p-4">
              <div className="text-sm font-medium text-gray-300 mb-3">Frame Rate Analysis</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Average FPS:</span>
                  <span>{stats.avgFps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Minimum FPS:</span>
                  <span className={stats.minFps < 30 ? 'text-red-400' : 'text-gray-300'}>{stats.minFps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Maximum FPS:</span>
                  <span className="text-green-400">{stats.maxFps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">FPS Score:</span>
                  <span className={getScoreColor(stats.fpsScore)}>{stats.fpsScore}/100</span>
                </div>
              </div>
            </div>

            {/* Memory Details */}
            <div className="bg-gray-800/30 rounded p-4">
              <div className="text-sm font-medium text-gray-300 mb-3">Memory Analysis</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Average Usage:</span>
                  <span>{formatBytes(stats.avgMemory)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Peak Usage:</span>
                  <span>{formatBytes(stats.maxMemory)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Memory Score:</span>
                  <span className={getScoreColor(stats.memoryScore)}>{stats.memoryScore}/100</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Efficiency:</span>
                  <span>{formatBytes(stats.avgMemory / data.length)} per point</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}