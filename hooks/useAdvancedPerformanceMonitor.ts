import React, { useState, useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  renderTime: number;
  updateTime: number;
  totalDataPoints: number;
  visibleDataPoints: number;
  canvasOperations: number;
}

interface PerformanceHistoryItem extends PerformanceMetrics {
  timestamp: number;
}

export const useAdvancedPerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    frameTime: 0,
    memoryUsage: 0,
    renderTime: 0,
    updateTime: 0,
    totalDataPoints: 0,
    visibleDataPoints: 0,
    canvasOperations: 0,
  });

  const [history, setHistory] = useState<PerformanceHistoryItem[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const frameTimesRef = React.useRef<number[]>([]);
  const lastFrameTimeRef = React.useRef<number>(performance.now());
  const animationFrameRef = React.useRef<number>();

  const measurePerformance = useCallback(() => {
    const now = performance.now();
    const frameTime = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    // Calculate FPS
    frameTimesRef.current.push(frameTime);
    if (frameTimesRef.current.length > 60) {
      frameTimesRef.current.shift();
    }
    
    const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
    const fps = Math.round(1000 / avgFrameTime);

    // Memory usage (if available)
    let memoryUsage = 0;
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }

    const newMetrics: PerformanceMetrics = {
      fps,
      frameTime: Math.round(frameTime * 100) / 100,
      memoryUsage,
      renderTime: 0, // To be set externally
      updateTime: 0, // To be set externally
      totalDataPoints: 0, // To be set externally
      visibleDataPoints: 0, // To be set externally
      canvasOperations: 0, // To be set externally
    };

    setMetrics(newMetrics);

    // Add to history every second
    if (frameTimesRef.current.length === 60) {
      setHistory(prev => {
        const newHistory = [...prev, { ...newMetrics, timestamp: now }];
        return newHistory.slice(-300); // Keep last 5 minutes
      });
    }

    if (isMonitoring) {
      animationFrameRef.current = requestAnimationFrame(measurePerformance);
    }
  }, [isMonitoring]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, []);

  const updateMetrics = useCallback((updates: Partial<PerformanceMetrics>) => {
    setMetrics(prev => ({ ...prev, ...updates }));
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      animationFrameRef.current = requestAnimationFrame(measurePerformance);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isMonitoring, measurePerformance]);

  return {
    metrics,
    history,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    updateMetrics,
  };
};

