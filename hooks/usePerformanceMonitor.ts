'use client';

import { useState, useEffect, useCallback } from 'react';
import { PerformanceMetrics } from '@/lib/types';
import { PerformanceUtils } from '@/lib/performanceUtils';

export interface UsePerformanceMonitorOptions {
  updateInterval?: number;
  enableMemoryTracking?: boolean;
  maxSampleSize?: number;
}

export function usePerformanceMonitor({
  updateInterval = 1000,
  enableMemoryTracking = true,
  maxSampleSize = 60,
}: UsePerformanceMonitorOptions = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    dataProcessingTime: 0,
    lastUpdate: Date.now(),
    frameCount: 0,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetrics[]>([]);

  const updateMetrics = useCallback(() => {
    const currentMetrics = PerformanceUtils.getPerformanceMetrics();
    
    setMetrics(currentMetrics);
    
    setPerformanceHistory((prev: PerformanceMetrics[]) => {
      const newHistory = [...prev, currentMetrics];
      // Keep only the most recent samples
      if (newHistory.length > maxSampleSize) {
        newHistory.shift();
      }
      return newHistory;
    });
  }, [maxSampleSize]);

  const startMonitoring = useCallback(() => {
    if (enableMemoryTracking) {
      PerformanceUtils.initializeMemoryBaseline();
    }
    setIsMonitoring(true);
  }, [enableMemoryTracking]);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const measureOperation = useCallback(<T,>(operation: () => T): T => {
    const { result, time } = PerformanceUtils.measureRenderTime(operation);
    
    setMetrics((prev: PerformanceMetrics) => ({
      ...prev,
      dataProcessingTime: time,
      lastUpdate: Date.now(),
    }));
    
    return result;
  }, []);

  const getAverageMetrics = useCallback(() => {
    if (performanceHistory.length === 0) return metrics;
    
    const avgMetrics = performanceHistory.reduce(
      (acc, metric) => ({
        fps: acc.fps + metric.fps,
        memoryUsage: acc.memoryUsage + metric.memoryUsage,
        renderTime: acc.renderTime + metric.renderTime,
        dataProcessingTime: acc.dataProcessingTime + metric.dataProcessingTime,
        lastUpdate: Math.max(acc.lastUpdate, metric.lastUpdate),
        frameCount: acc.frameCount + metric.frameCount,
      }),
      { fps: 0, memoryUsage: 0, renderTime: 0, dataProcessingTime: 0, lastUpdate: 0, frameCount: 0 }
    );
    
    const count = performanceHistory.length;
    return {
      fps: Math.round(avgMetrics.fps / count),
      memoryUsage: Math.round(avgMetrics.memoryUsage / count),
      renderTime: avgMetrics.renderTime / count,
      dataProcessingTime: avgMetrics.dataProcessingTime / count,
      lastUpdate: avgMetrics.lastUpdate,
      frameCount: avgMetrics.frameCount / count,
    };
  }, [performanceHistory, metrics]);

  const isPerformanceGood = useCallback(() => {
    return {
      fps: metrics.fps >= 55, // Good if above 55 FPS
      memory: metrics.memoryUsage < 100, // Good if under 100MB
      renderTime: metrics.renderTime < 16.67, // Good if under 16.67ms (60fps)
      overall: metrics.fps >= 55 && metrics.memoryUsage < 100 && metrics.renderTime < 16.67,
    };
  }, [metrics]);

  // Start/stop monitoring based on isMonitoring state
  useEffect(() => {
    if (!isMonitoring) return;

    const intervalId = setInterval(updateMetrics, updateInterval);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isMonitoring, updateMetrics, updateInterval]);

  // Auto-start monitoring on mount
  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    metrics,
    performanceHistory,
    isMonitoring,
    averageMetrics: getAverageMetrics(),
    performanceStatus: isPerformanceGood(),
    actions: {
      startMonitoring,
      stopMonitoring,
      measureOperation,
      updateMetrics,
    },
  };
}