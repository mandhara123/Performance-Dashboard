'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DataPoint, FilterOptions, TimeRange } from '@/lib/types';
import { DataGenerator } from '@/lib/dataGenerator';

export interface UseDataStreamOptions {
  initialData?: DataPoint[];
  updateInterval?: number;
  maxDataPoints?: number;
  enableRealtime?: boolean;
}

export function useDataStream({
  initialData = [],
  updateInterval = 100,
  maxDataPoints = 10000,
  enableRealtime = true,
}: UseDataStreamOptions = {}) {
  const [data, setData] = useState<DataPoint[]>(initialData);
  const [filteredData, setFilteredData] = useState<DataPoint[]>(initialData);
  const [isStreaming, setIsStreaming] = useState(enableRealtime);
  const [filters, setFilters] = useState<FilterOptions>(() => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // 1 hour ago
    
    return {
      categories: [],
      valueRange: { min: 0, max: 100 },
      timeRange: { 
        start: initialData.length > 0 ? Math.min(...initialData.map(d => d.timestamp)) : oneHourAgo, 
        end: now 
      },
    };
  });

  const intervalRef = useRef<number>();
  const lastTimestampRef = useRef(
    initialData.length > 0 
      ? Math.max(...initialData.map(d => d.timestamp)) 
      : Date.now()
  );

  const applyFilters = useCallback((dataToFilter: DataPoint[], currentFilters: FilterOptions): DataPoint[] => {
    return dataToFilter.filter(point => {
      // Category filter
      if (currentFilters.categories.length > 0 && !currentFilters.categories.includes(point.category)) {
        return false;
      }

      // Value range filter
      if (point.value < currentFilters.valueRange.min || point.value > currentFilters.valueRange.max) {
        return false;
      }

      // Time range filter
      if (point.timestamp < currentFilters.timeRange.start || point.timestamp > currentFilters.timeRange.end) {
        return false;
      }

      return true;
    });
  }, []);

  const addDataPoint = useCallback((newPoint: DataPoint) => {
    setData((prevData: DataPoint[]) => {
      const newData = [...prevData, newPoint];
      
      // Keep only the most recent maxDataPoints
      if (newData.length > maxDataPoints) {
        newData.splice(0, newData.length - maxDataPoints);
      }
      
      return newData;
    });
    
    lastTimestampRef.current = Math.max(lastTimestampRef.current, newPoint.timestamp);
  }, [maxDataPoints]);

  const addBatchData = useCallback((newPoints: DataPoint[]) => {
    setData((prevData: DataPoint[]) => {
      const newData = [...prevData, ...newPoints];
      
      // Keep only the most recent maxDataPoints
      if (newData.length > maxDataPoints) {
        newData.splice(0, newData.length - maxDataPoints);
      }
      
      return newData.sort((a, b) => a.timestamp - b.timestamp);
    });
    
    if (newPoints.length > 0) {
      lastTimestampRef.current = Math.max(...newPoints.map((p: DataPoint) => p.timestamp));
    }
  }, [maxDataPoints]);

  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    setFilters((prevFilters: FilterOptions) => ({ ...prevFilters, ...newFilters }));
  }, []);

  const startStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }

    setIsStreaming(true);
    intervalRef.current = setInterval(() => {
      const newPoint = DataGenerator.generateRealtimeDataPoint(lastTimestampRef.current);
      addDataPoint(newPoint);
    }, updateInterval) as unknown as number;
  }, [addDataPoint, updateInterval]);

  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsStreaming(false);
  }, []);

  const generateTestData = useCallback((count: number = 1000) => {
    const newData = DataGenerator.generateInitialDataset(count);
    setData(newData);
    if (newData.length > 0) {
      lastTimestampRef.current = Math.max(...newData.map(d => d.timestamp));
    }
  }, []);

  const clearData = useCallback(() => {
    setData([]);
    setFilteredData([]);
    lastTimestampRef.current = Date.now();
  }, []);

  // Apply filters whenever data or filters change
  useEffect(() => {
    const filtered = applyFilters(data, filters);
    setFilteredData(filtered);
  }, [data, filters, applyFilters]);

  // Initialize with proper data if empty
  useEffect(() => {
    if (initialData.length === 0 && data.length === 0) {
      generateTestData(5000); // Generate 5k points if no initial data
    } else if (initialData.length > 0 && data.length === 0) {
      setData(initialData);
      lastTimestampRef.current = Math.max(...initialData.map(d => d.timestamp));
    }
  }, [initialData, data.length, generateTestData]);

  // Start streaming on mount if enabled
  useEffect(() => {
    if (enableRealtime) {
      startStreaming();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enableRealtime, startStreaming]);

  // Update time range filter when data changes
  useEffect(() => {
    if (data.length > 0) {
      const minTime = Math.min(...data.map((d: DataPoint) => d.timestamp));
      const maxTime = Math.max(...data.map((d: DataPoint) => d.timestamp));
      
      setFilters((prevFilters: FilterOptions) => ({
        ...prevFilters,
        timeRange: {
          start: Math.min(prevFilters.timeRange.start, minTime),
          end: Math.max(prevFilters.timeRange.end, maxTime),
        },
      }));
    }
  }, [data]);

  return {
    data,
    filteredData,
    isStreaming,
    filters,
    actions: {
      addDataPoint,
      addBatchData,
      updateFilters,
      startStreaming,
      stopStreaming,
      generateTestData,
      clearData,
    },
    stats: {
      totalPoints: data.length,
      filteredPoints: filteredData.length,
      categories: Array.from(new Set(data.map((d: DataPoint) => d.category))),
      timeRange: data.length > 0 ? {
        start: Math.min(...data.map((d: DataPoint) => d.timestamp)),
        end: Math.max(...data.map((d: DataPoint) => d.timestamp)),
      } : { start: 0, end: 0 },
    },
  };
}