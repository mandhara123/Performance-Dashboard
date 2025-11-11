'use client';

import { useRef, useCallback, useEffect } from 'react';
import { DataPoint } from '@/lib/types';

interface WorkerMessage {
  type: 'PROCESS_DATA' | 'AGGREGATE_DATA' | 'GENERATE_DATA' | 'FILTER_DATA';
  payload: any;
  id: string;
}

interface WorkerResponse {
  type: string;
  result: any;
  id: string;
  error?: string;
  duration?: number;
}

type WorkerCallback = (result: any, error?: string, duration?: number) => void;

export function useDataWorker() {
  const workerRef = useRef<Worker | null>(null);
  const callbacksRef = useRef<Map<string, WorkerCallback>>(new Map());
  const isInitializedRef = useRef(false);

  // Initialize worker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      workerRef.current = new Worker('/workers/dataWorker.js');
      
      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, result, id, error, duration } = event.data;
        
        if (type === 'WORKER_READY') {
          isInitializedRef.current = true;
          return;
        }
        
        const callback = callbacksRef.current.get(id);
        if (callback) {
          callback(result, error, duration);
          callbacksRef.current.delete(id);
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Data Worker error:', error);
      };

    } catch (error) {
      console.error('Failed to initialize Data Worker:', error);
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback((message: WorkerMessage, callback: WorkerCallback) => {
    if (!workerRef.current || !isInitializedRef.current) {
      callback(null, 'Worker not initialized');
      return;
    }

    callbacksRef.current.set(message.id, callback);
    workerRef.current.postMessage(message);
  }, []);

  // Process large dataset with smoothing
  const processData = useCallback((
    data: DataPoint[],
    callback: (result: DataPoint[], error?: string, duration?: number) => void
  ) => {
    const id = `process_${Date.now()}_${Math.random()}`;
    sendMessage({
      type: 'PROCESS_DATA',
      payload: { data },
      id
    }, callback);
  }, [sendMessage]);

  // Aggregate data by time windows
  const aggregateData = useCallback((
    data: DataPoint[],
    windowSize: number,
    callback: (result: DataPoint[], error?: string, duration?: number) => void
  ) => {
    const id = `aggregate_${Date.now()}_${Math.random()}`;
    sendMessage({
      type: 'AGGREGATE_DATA',
      payload: { data, windowSize },
      id
    }, callback);
  }, [sendMessage]);

  // Generate large dataset
  const generateData = useCallback((
    count: number,
    startTime: number,
    callback: (result: DataPoint[], error?: string, duration?: number) => void
  ) => {
    const id = `generate_${Date.now()}_${Math.random()}`;
    sendMessage({
      type: 'GENERATE_DATA',
      payload: { count, startTime },
      id
    }, callback);
  }, [sendMessage]);

  // Filter data by range and category
  const filterData = useCallback((
    data: DataPoint[],
    minValue: number,
    maxValue: number,
    callback: (result: DataPoint[], error?: string, duration?: number) => void,
    category?: string
  ) => {
    const id = `filter_${Date.now()}_${Math.random()}`;
    sendMessage({
      type: 'FILTER_DATA',
      payload: { data, minValue, maxValue, category },
      id
    }, callback);
  }, [sendMessage]);

  // Check if worker is available and ready
  const isWorkerReady = useCallback(() => {
    return !!(workerRef.current && isInitializedRef.current);
  }, []);

  return {
    processData,
    aggregateData,
    generateData,
    filterData,
    isWorkerReady
  };
}