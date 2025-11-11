import { DataPoint } from './types';

/**
 * Generates realistic time-series data for performance testing
 */
export class DataGenerator {
  private static categories = ['CPU', 'Memory', 'Network', 'Disk', 'Temperature'];
  private static baseValues = { CPU: 50, Memory: 60, Network: 30, Disk: 40, Temperature: 35 };
  
  static generateInitialDataset(count: number = 10000): DataPoint[] {
    const data: DataPoint[] = [];
    const now = Date.now();
    const timeStep = 1000; // 1 second intervals
    
    for (let i = 0; i < count; i++) {
      const timestamp = now - (count - i) * timeStep;
      const category = this.categories[Math.floor(Math.random() * this.categories.length)];
      const baseValue = this.baseValues[category as keyof typeof this.baseValues];
      
      // Add realistic noise and trends
      const noise = (Math.random() - 0.5) * 20;
      const trend = Math.sin((i / count) * Math.PI * 2) * 10;
      const spike = Math.random() < 0.05 ? (Math.random() - 0.5) * 40 : 0; // 5% chance of spike
      
      data.push({
        id: `${category}-${timestamp}-${i}`,
        timestamp,
        value: Math.max(0, Math.min(100, baseValue + noise + trend + spike)),
        category,
        metadata: {
          index: i,
          hasSpike: spike !== 0,
        },
      });
    }
    
    return data.sort((a, b) => a.timestamp - b.timestamp);
  }

  static generateRealtimeDataPoint(lastTimestamp: number): DataPoint {
    const category = this.categories[Math.floor(Math.random() * this.categories.length)];
    const baseValue = this.baseValues[category as keyof typeof this.baseValues];
    const timestamp = lastTimestamp + 100; // 100ms intervals
    
    // More volatile real-time data
    const noise = (Math.random() - 0.5) * 30;
    const value = Math.max(0, Math.min(100, baseValue + noise));
    
    return {
      id: `${category}-${timestamp}-${Date.now()}`,
      timestamp,
      value,
      category,
      metadata: {
        isRealtime: true,
      },
    };
  }

  static generateBatchData(count: number, startTimestamp: number): DataPoint[] {
    const data: DataPoint[] = [];
    
    for (let i = 0; i < count; i++) {
      data.push(this.generateRealtimeDataPoint(startTimestamp + i * 100));
    }
    
    return data;
  }

  static aggregateData(
    data: DataPoint[],
    period: '1min' | '5min' | '1hour',
    method: 'average' | 'sum' | 'min' | 'max' = 'average'
  ): DataPoint[] {
    const periodMs = {
      '1min': 60 * 1000,
      '5min': 5 * 60 * 1000,
      '1hour': 60 * 60 * 1000,
    }[period];

    const grouped = new Map<string, DataPoint[]>();
    
    data.forEach(point => {
      const bucketTime = Math.floor(point.timestamp / periodMs) * periodMs;
      const key = `${point.category}-${bucketTime}`;
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(point);
    });

    const aggregated: DataPoint[] = [];
    
    grouped.forEach((points, key) => {
      const [category, timestamp] = key.split('-');
      let aggregatedValue: number;
      
      switch (method) {
        case 'sum':
          aggregatedValue = points.reduce((sum, p) => sum + p.value, 0);
          break;
        case 'min':
          aggregatedValue = Math.min(...points.map(p => p.value));
          break;
        case 'max':
          aggregatedValue = Math.max(...points.map(p => p.value));
          break;
        case 'average':
        default:
          aggregatedValue = points.reduce((sum, p) => sum + p.value, 0) / points.length;
          break;
      }
      
      aggregated.push({
        id: `aggregated-${key}`,
        timestamp: parseInt(timestamp),
        value: aggregatedValue,
        category,
        metadata: {
          aggregated: true,
          period,
          method,
          originalCount: points.length,
        },
      });
    });
    
    return aggregated.sort((a, b) => a.timestamp - b.timestamp);
  }
}