'use client';

import React, { useState, useEffect, useRef } from 'react';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import ScatterPlot from '@/components/charts/ScatterPlot';
import Heatmap from '@/components/charts/Heatmap';
import { PerformancePanel } from '@/components/performance/PerformancePanel';
import { ParticleSystem, GlowEffect } from '@/components/effects/VisualEffects';
import { useDataStream } from '@/hooks/useDataStream';
import { useAdvancedPerformanceMonitor } from '@/hooks/useAdvancedPerformanceMonitor';
import { DataPoint } from '@/lib/types';

type ChartType = 'line' | 'bar' | 'scatter' | 'heatmap';
type Theme = 'light' | 'dark' | 'neon';

export default function EnhancedDashboardClient() {
  const [activeChart, setActiveChart] = useState<ChartType>('line');
  const [theme, setTheme] = useState<Theme>('light');
  const [showPerformance, setShowPerformance] = useState(true);
  const [showParticles, setShowParticles] = useState(false);
  const [dataCount, setDataCount] = useState(1000);
  const [updateInterval, setUpdateInterval] = useState(100);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  const { data, isStreaming, startStream, stopStream, error } = useDataStream({
    initialCount: dataCount,
    updateInterval,
    maxPoints: 50000,
  });

  const {
    metrics,
    history,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    updateMetrics,
  } = useAdvancedPerformanceMonitor();

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring, stopMonitoring]);

  useEffect(() => {
    updateMetrics({
      totalDataPoints: data.length,
      visibleDataPoints: Math.min(data.length, 10000),
    });
  }, [data.length, updateMetrics]);

  const chartConfigs = {
    line: { component: LineChart, name: 'Line Chart', icon: '📈' },
    bar: { component: BarChart, name: 'Bar Chart', icon: '📊' },
    scatter: { component: ScatterPlot, name: 'Scatter Plot', icon: '🔵' },
    heatmap: { component: Heatmap, name: 'Heatmap', icon: '🔥' },
  };

  const themeStyles = {
    light: {
      background: 'bg-gray-50',
      panel: 'bg-white',
      text: 'text-gray-900',
      border: 'border-gray-200',
    },
    dark: {
      background: 'bg-gray-900',
      panel: 'bg-gray-800',
      text: 'text-white',
      border: 'border-gray-700',
    },
    neon: {
      background: 'bg-black',
      panel: 'bg-gray-900 border-cyan-500',
      text: 'text-cyan-100',
      border: 'border-cyan-400',
    },
  };

  const currentTheme = themeStyles[theme];
  const ActiveChartComponent = chartConfigs[activeChart].component;

  return (
    <div 
      ref={dashboardRef}
      className={`min-h-screen transition-all duration-500 ${currentTheme.background} ${currentTheme.text}`}
    >
      {/* Particle Background */}
      {showParticles && dashboardRef.current && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <ParticleSystem
            width={dashboardRef.current.offsetWidth}
            height={dashboardRef.current.offsetHeight}
            particleCount={30}
            color={theme === 'neon' ? '#00ffff' : '#3b82f6'}
            speed={0.5}
          />
        </div>
      )}

      <div className="relative z-10 p-6 space-y-6">
        {/* Header with Controls */}
        <div className={`${currentTheme.panel} rounded-lg p-6 ${currentTheme.border} border shadow-lg`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className={`text-3xl font-bold ${currentTheme.text} mb-2`}>
                🚀 Enhanced Performance Dashboard
              </h1>
              <p className={`text-sm opacity-75 ${currentTheme.text}`}>
                Real-time data visualization with {data.length.toLocaleString()} points @ {metrics.fps} FPS
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Theme Selector */}
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
                className={`px-3 py-2 rounded-lg border ${currentTheme.border} ${currentTheme.panel} ${currentTheme.text}`}
              >
                <option value="light">🌞 Light</option>
                <option value="dark">🌙 Dark</option>
                <option value="neon">⚡ Neon</option>
              </select>

              {/* Data Count Control */}
              <div className="flex items-center gap-2">
                <label className={`text-sm ${currentTheme.text}`}>Points:</label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={dataCount}
                  onChange={(e) => setDataCount(Number(e.target.value))}
                  className="w-20"
                />
                <span className={`text-sm ${currentTheme.text} w-12`}>{dataCount}</span>
              </div>

              {/* Update Interval Control */}
              <div className="flex items-center gap-2">
                <label className={`text-sm ${currentTheme.text}`}>Speed:</label>
                <select
                  value={updateInterval}
                  onChange={(e) => setUpdateInterval(Number(e.target.value))}
                  className={`px-2 py-1 rounded border ${currentTheme.border} ${currentTheme.panel} ${currentTheme.text} text-sm`}
                >
                  <option value={50}>50ms (20 FPS)</option>
                  <option value={100}>100ms (10 FPS)</option>
                  <option value={200}>200ms (5 FPS)</option>
                  <option value={500}>500ms (2 FPS)</option>
                </select>
              </div>

              {/* Effects Toggle */}
              <button
                onClick={() => setShowParticles(!showParticles)}
                className={`px-3 py-2 rounded-lg border transition-all ${
                  showParticles 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : `${currentTheme.border} ${currentTheme.text}`
                }`}
              >
                ✨ Particles
              </button>

              {/* Streaming Control */}
              <button
                onClick={isStreaming ? stopStream : startStream}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  isStreaming
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                {isStreaming ? '⏸️ Stop' : '▶️ Start'}
              </button>
            </div>
          </div>

          {/* Chart Type Selector */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(chartConfigs).map(([type, config]) => (
              <button
                key={type}
                onClick={() => setActiveChart(type as ChartType)}
                className={`px-4 py-2 rounded-lg border transition-all ${
                  activeChart === type
                    ? theme === 'neon' 
                      ? 'bg-cyan-500 text-black border-cyan-400 shadow-lg shadow-cyan-500/25' 
                      : 'bg-blue-500 text-white border-blue-500'
                    : `${currentTheme.border} ${currentTheme.text} hover:bg-opacity-10 hover:bg-blue-500`
                }`}
              >
                {config.icon} {config.name}
              </button>
            ))}
          </div>
        </div>

        {/* Performance Panel */}
        {showPerformance && (
          <GlowEffect intensity={theme === 'neon' ? 1 : 0}>
            <div className={theme === 'neon' ? 'border-2 border-cyan-400 rounded-lg' : ''}>
              <PerformancePanel metrics={metrics} history={history} />
            </div>
          </GlowEffect>
        )}

        {/* Main Chart Display */}
        <GlowEffect intensity={theme === 'neon' ? 0.8 : 0}>
          <div className={`${currentTheme.panel} rounded-lg p-6 ${currentTheme.border} border shadow-lg ${
            theme === 'neon' ? 'border-2 border-cyan-400' : ''
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-semibold ${currentTheme.text}`}>
                {chartConfigs[activeChart].icon} {chartConfigs[activeChart].name}
              </h2>
              
              <div className="flex items-center gap-3">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setZoomLevel(Math.max(0.1, zoomLevel - 0.1))}
                    className={`px-2 py-1 rounded border ${currentTheme.border} ${currentTheme.text} hover:bg-opacity-10 hover:bg-blue-500`}
                  >
                    🔍-
                  </button>
                  <span className={`text-sm ${currentTheme.text} w-12 text-center`}>
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.1))}
                    className={`px-2 py-1 rounded border ${currentTheme.border} ${currentTheme.text} hover:bg-opacity-10 hover:bg-blue-500`}
                  >
                    🔍+
                  </button>
                </div>

                {/* Reset View */}
                <button
                  onClick={() => {
                    setZoomLevel(1);
                    setPanOffset({ x: 0, y: 0 });
                  }}
                  className={`px-3 py-1 rounded border ${currentTheme.border} ${currentTheme.text} hover:bg-opacity-10 hover:bg-blue-500`}
                >
                  🎯 Reset
                </button>

                {/* Performance Toggle */}
                <button
                  onClick={() => setShowPerformance(!showPerformance)}
                  className={`px-3 py-1 rounded border ${currentTheme.border} ${currentTheme.text} hover:bg-opacity-10 hover:bg-blue-500`}
                >
                  📊 Performance
                </button>
              </div>
            </div>

            {error ? (
              <div className="text-red-500 p-8 text-center">
                <p>Error loading data: {error}</p>
                <button
                  onClick={startStream}
                  className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="h-96 relative">
                <ActiveChartComponent
                  data={data}
                  width={800}
                  height={384}
                  margin={{ top: 20, right: 30, bottom: 40, left: 50 }}
                />
                
                {/* Loading Overlay */}
                {data.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-opacity-75 bg-white">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading data...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </GlowEffect>

        {/* Footer Stats */}
        <div className={`${currentTheme.panel} rounded-lg p-4 ${currentTheme.border} border shadow-lg`}>
          <div className="flex flex-wrap justify-between items-center text-sm">
            <div className="flex gap-6">
              <span className={currentTheme.text}>
                📊 Data Points: <strong>{data.length.toLocaleString()}</strong>
              </span>
              <span className={currentTheme.text}>
                ⚡ FPS: <strong>{metrics.fps}</strong>
              </span>
              <span className={currentTheme.text}>
                🔄 Stream: <strong>{isStreaming ? 'Active' : 'Stopped'}</strong>
              </span>
              <span className={currentTheme.text}>
                💾 Memory: <strong>{metrics.memoryUsage}MB</strong>
              </span>
            </div>
            <div className={`text-xs ${currentTheme.text} opacity-75`}>
              Enhanced Performance Dashboard v2.0 | {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}