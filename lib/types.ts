export interface DataPoint {
  timestamp: number;
  value: number;
  category: string;
  id: string;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'scatter' | 'heatmap';
  dataKey: string;
  color: string;
  visible: boolean;
  strokeWidth?: number;
  pointRadius?: number;
}

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  dataProcessingTime: number;
  lastUpdate: number;
  frameCount: number;
}

export interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface FilterOptions {
  categories: string[];
  valueRange: {
    min: number;
    max: number;
  };
  timeRange: TimeRange;
}

export interface DataAggregation {
  period: '1min' | '5min' | '1hour';
  method: 'average' | 'sum' | 'min' | 'max';
}

export interface ChartInteraction {
  zoom: {
    x: number;
    y: number;
    scale: number;
  };
  pan: {
    x: number;
    y: number;
  };
  hover?: {
    dataPoint: DataPoint | null;
    position: { x: number; y: number } | null;
  };
}

export interface VirtualScrollConfig {
  itemHeight: number;
  containerHeight: number;
  overscan: number;
}

export interface VirtualScrollState {
  scrollTop: number;
  visibleStart: number;
  visibleEnd: number;
  totalHeight: number;
}

export type ChartEventType = 'hover' | 'click' | 'zoom' | 'pan' | 'select';

export interface ChartEvent {
  type: ChartEventType;
  data?: DataPoint[];
  position?: { x: number; y: number };
  scale?: number;
  delta?: { x: number; y: number };
}