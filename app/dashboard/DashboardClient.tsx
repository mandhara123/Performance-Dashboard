'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataPoint, FilterOptions } from '@/lib/types';
import { useDataStream } from '@/hooks/useDataStream';
import { useDataWorker } from '@/hooks/useDataWorker';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import ScatterPlot from '@/components/charts/ScatterPlot';
import Heatmap from '@/components/charts/Heatmap';
import FilterPanel from '@/components/controls/FilterPanel';
import TimeRangeSelector from '@/components/controls/TimeRangeSelector';
import DataTable from '@/components/ui/DataTable';
import PerformanceMonitor from '@/components/ui/PerformanceMonitor';
import { FPSCounter } from '@/components/performance/FPSCounter';
import { MemoryMonitor } from '@/components/performance/MemoryMonitor';
import { DataControls } from '@/components/performance/DataControls';
import { StressTest } from '@/components/performance/StressTest';
import { PerformanceReport } from '@/components/performance/PerformanceReport';

export interface DashboardClientProps {
  initialData: DataPoint[];
}

type ChartType = 'line' | 'bar' | 'scatter' | 'heatmap';

export default function DashboardClient({ initialData }: DashboardClientProps) {
  const [activeChart, setActiveChart] = useState<ChartType>('line');
  const [showTable, setShowTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentFps, setCurrentFps] = useState(60);
  const [currentMemory, setCurrentMemory] = useState(0);
  const [dataPointCount, setDataPointCount] = useState(5000);
  const [updateFrequency, setUpdateFrequency] = useState(200);
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [stressTestResults, setStressTestResults] = useState<any[]>([]);

  // Data streaming hook
  const {
    data,
    filteredData,
    isStreaming,
    filters,
    actions,
    stats,
  } = useDataStream({
    initialData,
    updateInterval: updateFrequency,
    maxDataPoints: dataPointCount,
    enableRealtime: true,
  });

  // Web Worker hook
  const dataWorker = useDataWorker();

  // Chart component mapping
  const chartComponents = useMemo(() => ({
    line: LineChart,
    bar: BarChart,
    scatter: ScatterPlot,
    heatmap: Heatmap,
  }), []);

  const ActiveChartComponent = chartComponents[activeChart];

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<FilterOptions>) => {
    actions.updateFilters(newFilters);
  }, [actions]);

  // Data generation controls
  const handleGenerateData = useCallback((count: number) => {
    actions.generateTestData(count);
  }, [actions]);

  const handleClearData = useCallback(() => {
    actions.clearData();
  }, [actions]);

  // Toggle streaming
  const toggleStreaming = useCallback(() => {
    if (isStreaming) {
      actions.stopStreaming();
    } else {
      actions.startStreaming();
    }
  }, [isStreaming, actions]);

  // Performance monitoring handlers
  const handleDataPointCountChange = useCallback((count: number) => {
    setDataPointCount(count);
    // Generate new data set with the specified count (with safety limit)
    const safeCount = Math.min(count, 10000); // Limit to 10k for performance
    actions.clearData();
    actions.generateTestData(safeCount);
  }, [actions]);

  const handleUpdateFrequencyChange = useCallback((frequency: number) => {
    setUpdateFrequency(frequency);
    // Note: Update interval change will take effect on next render
  }, []);

  const handleStressTestToggle = useCallback((enabled: boolean) => {
    setIsStressTesting(enabled);
    
    if (enabled) {
      // Stop normal streaming during stress test
      actions.stopStreaming();
    } else {
      // Reset to normal settings when stopping stress test
      actions.stopStreaming(); // Ensure any test intervals are cleared
      handleDataPointCountChange(1000); // Reset to smaller, safer dataset
      handleUpdateFrequencyChange(200);
      
      // Restart normal streaming after a brief delay
      setTimeout(() => {
        actions.startStreaming();
      }, 500);
    }
  }, [actions, handleDataPointCountChange, handleUpdateFrequencyChange]);

  const handleStressTestComplete = useCallback((results: any[]) => {
    setStressTestResults(results);
    setIsStressTesting(false);
    
    // Ensure clean state after stress test
    actions.stopStreaming();
    setTimeout(() => {
      handleDataPointCountChange(1000);
      actions.startStreaming();
    }, 1000);
  }, [actions, handleDataPointCountChange]);

  return (
    <div className="container mx-auto px-4 py-6 relative">
      {/* Performance Monitoring Panel - Top Right */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        <FPSCounter 
          isVisible={true}
          className="shadow-lg"
        />
        <MemoryMonitor 
          isVisible={true}
          className="shadow-lg"
        />
      </div>

      {/* Enhanced Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Chart Type Selector */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart Type</h3>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(chartComponents).map((chartType) => (
              <button
                key={chartType}
                onClick={() => setActiveChart(chartType as ChartType)}
                className={`px-4 py-2 text-sm rounded-md border transition-colors capitalize ${
                  activeChart === chartType
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {chartType}
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-2">
              <button
                onClick={toggleStreaming}
                className={`flex-1 px-3 py-2 text-xs rounded font-medium ${
                  isStreaming
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isStreaming ? 'Stop' : 'Start'} Stream
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 px-3 py-2 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Data Controls */}
        <div className="lg:col-span-2 xl:col-span-1">
          <DataControls
            dataPointCount={dataPointCount}
            updateFrequency={updateFrequency}
            onDataPointCountChange={handleDataPointCountChange}
            onUpdateFrequencyChange={handleUpdateFrequencyChange}
            onStressTestToggle={handleStressTestToggle}
            isStressTesting={isStressTesting}
            className="h-full"
          />
        </div>

        {/* Enhanced Statistics */}
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Statistics</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-gray-600 text-xs">Total Points</span>
                <span className="font-bold text-lg">{stats.totalPoints.toLocaleString()}</span>
              </div>
              <div>
                <span className="block text-gray-600 text-xs">Filtered</span>
                <span className="font-bold text-lg">{stats.filteredPoints.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-gray-600 text-xs">Categories</span>
                <span className="font-medium">{stats.categories.length}</span>
              </div>
              <div>
                <span className="block text-gray-600 text-xs">Streaming</span>
                <span className={`font-medium ${isStreaming ? 'text-green-600' : 'text-red-600'}`}>
                  {isStreaming ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Performance Indicators */}
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-2">Performance Status</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Target Load</div>
                  <div className="font-medium">{(dataPointCount / 1000).toFixed(0)}k pts</div>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <div className="text-gray-500">Update Rate</div>
                  <div className="font-medium">{Math.round(1000 / updateFrequency)} Hz</div>
                </div>
              </div>
            </div>

            {/* Web Worker Status */}
            {dataWorker.isWorkerReady() && (
              <div className="flex items-center gap-2 text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Web Worker Ready
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stress Test Panel - When Active */}
      {(isStressTesting || stressTestResults.length > 0) && (
        <div className="mb-8">
          <StressTest
            isRunning={isStressTesting}
            onStressTestComplete={handleStressTestComplete}
            onDataPointChange={handleDataPointCountChange}
            onStop={() => handleStressTestToggle(false)}
            currentFps={currentFps}
            currentMemory={currentMemory}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Left Sidebar - Filters and Time Range */}
        <div className="xl:col-span-1 space-y-6">
          <FilterPanel
            filters={filters}
            onFiltersChange={handleFilterChange}
            availableCategories={stats.categories}
            dataCount={stats.filteredPoints}
          />
          
          <TimeRangeSelector
            timeRange={filters.timeRange}
            onTimeRangeChange={(timeRange) => handleFilterChange({ timeRange })}
            dataTimeRange={stats.timeRange.start > 0 ? stats.timeRange : { 
              start: Date.now() - (24 * 60 * 60 * 1000), 
              end: Date.now() 
            }}
          />
        </div>

        {/* Main Chart Area */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            {/* Chart Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {activeChart} Chart
                </h2>
                <p className="text-sm text-gray-600">
                  {filteredData.length.toLocaleString()} data points • Real-time visualization
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showTable}
                    onChange={(e) => setShowTable(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  Show Data Table
                </label>
              </div>
            </div>

            {/* Chart Content */}
            <div className="p-6">
              {filteredData.length > 0 ? (
                <div className="chart-container">
                  <ActiveChartComponent
                    data={filteredData}
                    width={800}
                    height={500}
                    enableInteraction={true}
                    className="w-full"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-96 text-gray-500">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p className="text-lg font-medium">No data available</p>
                    <p className="text-sm">Generate some data or adjust your filters</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Data Table */}
          {showTable && (
            <div className="mt-6">
              <DataTable
                data={filteredData.slice(0, 1000)} // Limit to 1k rows for performance
                height={400}
                searchTerm={searchTerm}
                onRowClick={(dataPoint) => {
                  console.log('Row clicked:', dataPoint);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Performance Report and Monitor */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PerformanceReport 
          data={filteredData}
          stressTestResults={stressTestResults}
          className="lg:col-span-2"
        />
        
        <PerformanceMonitor
          showGraph={true}
          compact={false}
        />
      </div>

      {/* Search Bar for Table */}
      {showTable && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto">
          <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Data
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by category, ID, or value..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}