'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface StressTestResult {
  timestamp: number;
  dataPoints: number;
  fps: number;
  memoryUsage: number;
  renderTime: number;
}

interface StressTestProps {
  isRunning: boolean;
  onStressTestComplete: (results: StressTestResult[]) => void;
  onDataPointChange: (count: number) => void;
  onStop: () => void;
  currentFps: number;
  currentMemory: number;
}

export function StressTest({
  isRunning,
  onStressTestComplete,
  onDataPointChange,
  onStop,
  currentFps,
  currentMemory
}: StressTestProps) {
  const [testResults, setTestResults] = useState<StressTestResult[]>([]);
  const [currentDataPoints, setCurrentDataPoints] = useState(1000);
  const [testPhase, setTestPhase] = useState<'initializing' | 'running' | 'completed' | 'failed'>('initializing');
  const [maxSustainableLoad, setMaxSustainableLoad] = useState(0);
  const [testProgress, setTestProgress] = useState(0);
  
  const testIntervalRef = useRef<NodeJS.Timeout>();
  const testStartTimeRef = useRef<number>(0);
  const consecutiveLowFpsRef = useRef(0);
  
  const FPS_THRESHOLD = 30; // Minimum acceptable FPS
  const MEMORY_THRESHOLD = 0.85; // 85% of available memory
  const MAX_DATA_POINTS = 50000;
  const TEST_STEP_SIZE = 2000;
  const STEP_DURATION = 3000; // 3 seconds per step
  const MAX_LOW_FPS_COUNT = 2; // Allow 2 consecutive low FPS readings before stopping

  const calculateRenderTime = useCallback(() => {
    const start = performance.now();
    // Simulate some calculation work
    for (let i = 0; i < 1000; i++) {
      Math.random() * Math.random();
    }
    return performance.now() - start;
  }, []);

  const recordTestResult = useCallback(() => {
    const result: StressTestResult = {
      timestamp: Date.now(),
      dataPoints: currentDataPoints,
      fps: currentFps,
      memoryUsage: currentMemory,
      renderTime: calculateRenderTime()
    };
    
    setTestResults(prev => [...prev, result]);
    return result;
  }, [currentDataPoints, currentFps, currentMemory, calculateRenderTime]);

  const checkPerformanceThresholds = useCallback((result: StressTestResult) => {
    // Check FPS threshold
    if (result.fps < FPS_THRESHOLD) {
      consecutiveLowFpsRef.current++;
      if (consecutiveLowFpsRef.current >= MAX_LOW_FPS_COUNT) {
        return 'fps_failure';
      }
    } else {
      consecutiveLowFpsRef.current = 0;
    }

    // Check memory threshold
    const memoryPercentage = result.memoryUsage / (1024 * 1024 * 1024); // Convert to GB approximation
    if (memoryPercentage > MEMORY_THRESHOLD) {
      return 'memory_failure';
    }

    return 'ok';
  }, []);

  const stopTest = useCallback((reason: 'manual' | 'fps_failure' | 'memory_failure' | 'completed') => {
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = undefined;
    }
    
    setTestPhase(reason === 'completed' ? 'completed' : 'failed');
    
    // Set maximum sustainable load
    if (testResults.length > 0) {
      const validResults = testResults.filter(r => r.fps >= FPS_THRESHOLD);
      const maxLoad = validResults.length > 0 
        ? Math.max(...validResults.map(r => r.dataPoints))
        : currentDataPoints - TEST_STEP_SIZE;
      setMaxSustainableLoad(maxLoad);
    }
    
    // Reset data points to normal level after test
    setTimeout(() => {
      onDataPointChange(1000); // Reset to safe level
    }, 1000);
    
    onStressTestComplete(testResults);
    onStop();
  }, [testResults, currentDataPoints, onStressTestComplete, onStop, onDataPointChange]);

  useEffect(() => {
    if (!isRunning) {
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
      }
      return;
    }

    // Initialize test
    setTestResults([]);
    setCurrentDataPoints(1000);
    setTestPhase('initializing');
    setTestProgress(0);
    testStartTimeRef.current = Date.now();
    consecutiveLowFpsRef.current = 0;
    onDataPointChange(1000);

    // Start the test after a brief delay
    setTimeout(() => {
      setTestPhase('running');
      
      testIntervalRef.current = setInterval(() => {
        const result = recordTestResult();
        const performanceCheck = checkPerformanceThresholds(result);
        
        if (performanceCheck !== 'ok') {
          stopTest(performanceCheck as 'fps_failure' | 'memory_failure');
          return;
        }

        // Increase data points for next iteration
        const nextDataPoints = currentDataPoints + TEST_STEP_SIZE;
        
        if (nextDataPoints > MAX_DATA_POINTS) {
          stopTest('completed');
          return;
        }

        setCurrentDataPoints(nextDataPoints);
        onDataPointChange(nextDataPoints);
        
        // Update progress
        const progress = (nextDataPoints / MAX_DATA_POINTS) * 100;
        setTestProgress(progress);
        
      }, STEP_DURATION);
    }, 1000);

    return () => {
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
        testIntervalRef.current = undefined;
      }
      // Reset to safe state on cleanup
      setTestResults([]);
      setCurrentDataPoints(1000);
      setTestPhase('initializing');
      setTestProgress(0);
      consecutiveLowFpsRef.current = 0;
    };
  }, [isRunning, recordTestResult, checkPerformanceThresholds, stopTest, onDataPointChange]);

  if (!isRunning && testResults.length === 0) {
    return null;
  }

  const getTestStatusColor = () => {
    switch (testPhase) {
      case 'initializing': return 'text-blue-400';
      case 'running': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getTestStatusMessage = () => {
    switch (testPhase) {
      case 'initializing': return 'Preparing stress test...';
      case 'running': return `Testing ${currentDataPoints.toLocaleString()} data points...`;
      case 'completed': return `Test completed successfully! Max load: ${maxSustainableLoad.toLocaleString()} points`;
      case 'failed': return `Performance threshold reached at ${currentDataPoints.toLocaleString()} points`;
      default: return 'Test status unknown';
    }
  };

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-200">Stress Test Monitor</h3>
        {isRunning && (
          <button
            onClick={() => stopTest('manual')}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors"
          >
            Stop Test
          </button>
        )}
      </div>

      {/* Test Status */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          {testPhase === 'running' && (
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
          )}
          <span className={`text-sm font-medium ${getTestStatusColor()}`}>
            {getTestStatusMessage()}
          </span>
        </div>
        
        {testPhase === 'running' && (
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${testProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Current Metrics */}
      {isRunning && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-800/50 rounded p-3">
            <div className="text-xs text-gray-400">Current Load</div>
            <div className="text-lg font-bold text-white">
              {(currentDataPoints / 1000).toFixed(0)}k
            </div>
            <div className="text-xs text-gray-500">data points</div>
          </div>
          
          <div className="bg-gray-800/50 rounded p-3">
            <div className="text-xs text-gray-400">Performance</div>
            <div className={`text-lg font-bold ${currentFps >= FPS_THRESHOLD ? 'text-green-400' : 'text-red-400'}`}>
              {currentFps} FPS
            </div>
            <div className="text-xs text-gray-500">
              {currentFps >= FPS_THRESHOLD ? 'Good' : 'Critical'}
            </div>
          </div>
        </div>
      )}

      {/* Test Results Summary */}
      {testResults.length > 0 && !isRunning && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-800/50 rounded p-3">
              <div className="text-xs text-gray-400">Max Sustainable</div>
              <div className="text-lg font-bold text-green-400">
                {(maxSustainableLoad / 1000).toFixed(0)}k
              </div>
              <div className="text-xs text-gray-500">data points</div>
            </div>
            
            <div className="bg-gray-800/50 rounded p-3">
              <div className="text-xs text-gray-400">Test Duration</div>
              <div className="text-lg font-bold text-blue-400">
                {Math.round((testResults[testResults.length - 1]?.timestamp - testResults[0]?.timestamp) / 1000)}s
              </div>
              <div className="text-xs text-gray-500">seconds</div>
            </div>
            
            <div className="bg-gray-800/50 rounded p-3">
              <div className="text-xs text-gray-400">Steps Completed</div>
              <div className="text-lg font-bold text-purple-400">
                {testResults.length}
              </div>
              <div className="text-xs text-gray-500">test steps</div>
            </div>
          </div>

          {/* Performance Graph */}
          <div className="bg-gray-800/30 rounded p-3">
            <div className="text-xs text-gray-400 mb-2">Performance Over Time</div>
            <div className="h-16 flex items-end space-x-1">
              {testResults.map((result, index) => {
                const height = Math.max(10, (result.fps / 60) * 100);
                const isGood = result.fps >= FPS_THRESHOLD;
                return (
                  <div
                    key={index}
                    className={`flex-1 rounded-sm ${isGood ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ height: `${height}%` }}
                    title={`${result.dataPoints} points: ${result.fps} FPS`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Start</span>
              <span>End</span>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3">
            <div className="text-sm font-medium text-blue-300 mb-1">Recommendations</div>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• Optimal data load: {(maxSustainableLoad * 0.8 / 1000).toFixed(0)}k points (80% of max)</li>
              <li>• Consider virtualization above {(maxSustainableLoad / 2 / 1000).toFixed(0)}k points</li>
              <li>• Enable Web Workers for loads above {(maxSustainableLoad / 1000).toFixed(0)}k points</li>
              {maxSustainableLoad < 10000 && (
                <li>• Performance may be limited by device capabilities</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}