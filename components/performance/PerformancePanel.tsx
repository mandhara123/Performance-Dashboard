import React from 'react';

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

export const PerformancePanel: React.FC<{
  metrics: PerformanceMetrics;
  history: PerformanceHistoryItem[];
}> = ({ metrics, history }) => {
  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600 bg-green-50';
    if (value >= thresholds.warning) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getFpsStatus = (fps: number) => getStatusColor(fps, { good: 55, warning: 30 });
  const getMemoryStatus = (memory: number) => getStatusColor(100 - memory, { good: 50, warning: 20 });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse" />
        Performance Monitor
      </h3>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-3 rounded-lg ${getFpsStatus(metrics.fps)}`}>
          <div className="text-2xl font-bold">{metrics.fps}</div>
          <div className="text-sm opacity-75">FPS</div>
        </div>

        <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
          <div className="text-2xl font-bold">{metrics.frameTime}ms</div>
          <div className="text-sm opacity-75">Frame Time</div>
        </div>

        <div className={`p-3 rounded-lg ${getMemoryStatus(metrics.memoryUsage)}`}>
          <div className="text-2xl font-bold">{metrics.memoryUsage}MB</div>
          <div className="text-sm opacity-75">Memory</div>
        </div>

        <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
          <div className="text-2xl font-bold">{metrics.totalDataPoints.toLocaleString()}</div>
          <div className="text-sm opacity-75">Data Points</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Render Time:</span>
          <span className="font-medium">{metrics.renderTime}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Update Time:</span>
          <span className="font-medium">{metrics.updateTime}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Visible Points:</span>
          <span className="font-medium">{metrics.visibleDataPoints.toLocaleString()}</span>
        </div>
      </div>

      {/* Mini FPS Chart */}
      <div className="h-16 bg-gray-50 rounded relative overflow-hidden">
        <div className="absolute inset-0 flex items-end justify-end space-x-1 p-2">
          {history.slice(-30).map((item, index) => {
            const height = Math.max(2, (item.fps / 60) * 100);
            const color = item.fps >= 55 ? 'bg-green-500' : item.fps >= 30 ? 'bg-yellow-500' : 'bg-red-500';
            return (
              <div
                key={index}
                className={`w-1 ${color} rounded-t transition-all duration-300`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>
        <div className="absolute bottom-1 left-2 text-xs text-gray-500">
          FPS History (30s)
        </div>
      </div>
    </div>
  );
};