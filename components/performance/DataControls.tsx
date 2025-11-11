'use client';

import React, { useState } from 'react';

interface DataControlsProps {
  dataPointCount: number;
  updateFrequency: number;
  onDataPointCountChange: (count: number) => void;
  onUpdateFrequencyChange: (frequency: number) => void;
  onStressTestToggle: (enabled: boolean) => void;
  isStressTesting: boolean;
  className?: string;
}

export function DataControls({
  dataPointCount,
  updateFrequency,
  onDataPointCountChange,
  onUpdateFrequencyChange,
  onStressTestToggle,
  isStressTesting,
  className = ''
}: DataControlsProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const presetConfigs = [
    { name: 'Light', points: 1000, frequency: 500, description: 'Minimal load' },
    { name: 'Standard', points: 5000, frequency: 200, description: 'Normal usage' },
    { name: 'Heavy', points: 15000, frequency: 100, description: 'High performance' },
    { name: 'Extreme', points: 30000, frequency: 50, description: 'Maximum load' },
  ];

  const handlePresetSelect = (preset: typeof presetConfigs[0]) => {
    onDataPointCountChange(preset.points);
    onUpdateFrequencyChange(preset.frequency);
  };

  const getLoadStatus = (points: number) => {
    if (points <= 2000) return { color: 'text-green-500', status: 'Light' };
    if (points <= 8000) return { color: 'text-yellow-500', status: 'Moderate' };
    if (points <= 20000) return { color: 'text-orange-500', status: 'Heavy' };
    return { color: 'text-red-500', status: 'Extreme' };
  };

  const loadStatus = getLoadStatus(dataPointCount);

  return (
    <div className={`bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-200">Data Generation Controls</h3>
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-medium ${loadStatus.color}`}>
            {loadStatus.status}
          </span>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-gray-400 hover:text-gray-200 transition-colors"
          >
            {showAdvanced ? 'Simple' : 'Advanced'}
          </button>
        </div>
      </div>

      {!showAdvanced ? (
        // Simple Preset Controls
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Performance Presets</label>
            <div className="grid grid-cols-2 gap-2">
              {presetConfigs.map((preset) => {
                const isActive = dataPointCount === preset.points && updateFrequency === preset.frequency;
                return (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className={`p-3 rounded-lg text-xs transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-semibold">{preset.name}</div>
                    <div className="text-xs opacity-75 mt-1">{preset.description}</div>
                    <div className="text-xs opacity-60 mt-1">
                      {(preset.points / 1000).toFixed(0)}k pts • {preset.frequency}ms
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        // Advanced Manual Controls
        <div className="space-y-4">
          {/* Data Points Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400">Data Points</label>
              <span className="text-sm font-mono text-gray-200">
                {(dataPointCount / 1000).toFixed(1)}k
              </span>
            </div>
            <input
              type="range"
              min="1000"
              max="50000"
              step="1000"
              value={dataPointCount}
              onChange={(e) => onDataPointCountChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1k</span>
              <span>25k</span>
              <span>50k</span>
            </div>
          </div>

          {/* Update Frequency Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-gray-400">Update Interval</label>
              <span className="text-sm font-mono text-gray-200">
                {updateFrequency}ms ({Math.round(1000/updateFrequency)}fps)
              </span>
            </div>
            <input
              type="range"
              min="16"
              max="1000"
              step="16"
              value={updateFrequency}
              onChange={(e) => onUpdateFrequencyChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>60fps</span>
              <span>30fps</span>
              <span>1fps</span>
            </div>
          </div>

          {/* Performance Impact Indicator */}
          <div className="bg-gray-800/50 rounded p-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Estimated Performance Impact:</span>
              <span className={`font-medium ${loadStatus.color}`}>
                {loadStatus.status}
              </span>
            </div>
            <div className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  dataPointCount <= 5000 ? 'bg-green-500' : 
                  dataPointCount <= 15000 ? 'bg-yellow-500' : 
                  dataPointCount <= 30000 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min((dataPointCount / 50000) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Stress Test Controls */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-200">Stress Test Mode</span>
            <p className="text-xs text-gray-400 mt-1">
              Gradually increase load to find performance limits
            </p>
          </div>
          <button
            onClick={() => onStressTestToggle(!isStressTesting)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isStressTesting
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
            }`}
          >
            {isStressTesting ? 'Stop Test' : 'Start Test'}
          </button>
        </div>
        
        {isStressTesting && (
          <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-red-300 font-medium">
                Stress test in progress...
              </span>
            </div>
            <p className="text-xs text-red-400 mt-1">
              Monitor FPS and memory usage. Test will stop at performance threshold.
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex space-x-2">
        <button
          onClick={() => {
            onDataPointCountChange(1000);
            onUpdateFrequencyChange(500);
          }}
          className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-lg transition-colors"
        >
          Reset to Light
        </button>
        <button
          onClick={() => {
            onDataPointCountChange(Math.min(dataPointCount * 2, 50000));
          }}
          className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs rounded-lg transition-colors"
        >
          Double Load
        </button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
          transition: all 0.15s ease-in-out;
        }
        
        .slider::-webkit-slider-thumb:hover {
          background: #2563eb;
          transform: scale(1.1);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
}