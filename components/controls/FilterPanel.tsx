'use client';

import React, { useState, useCallback } from 'react';
import { FilterOptions, DataAggregation } from '@/lib/types';

export interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: Partial<FilterOptions>) => void;
  availableCategories: string[];
  dataCount: number;
  className?: string;
}

export default function FilterPanel({
  filters,
  onFiltersChange,
  availableCategories,
  dataCount,
  className = '',
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [aggregation, setAggregation] = useState<DataAggregation>({
    period: '1min',
    method: 'average',
  });

  const handleCategoryToggle = useCallback((category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFiltersChange({ categories: newCategories });
  }, [filters.categories, onFiltersChange]);

  const handleSelectAllCategories = useCallback(() => {
    onFiltersChange({ categories: availableCategories });
  }, [availableCategories, onFiltersChange]);

  const handleDeselectAllCategories = useCallback(() => {
    onFiltersChange({ categories: [] });
  }, [onFiltersChange]);

  const handleValueRangeChange = useCallback((field: 'min' | 'max', value: number) => {
    onFiltersChange({
      valueRange: {
        ...filters.valueRange,
        [field]: value,
      },
    });
  }, [filters.valueRange, onFiltersChange]);

  const resetFilters = useCallback(() => {
    onFiltersChange({
      categories: [],
      valueRange: { min: 0, max: 100 },
    });
  }, [onFiltersChange]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-gray-900">Filters & Controls</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{dataCount} points</span>
          <button className="text-gray-400 hover:text-gray-600">
            {isExpanded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-6">
          
          {/* Categories Filter */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Categories</label>
              <div className="flex gap-2">
                <button
                  onClick={handleSelectAllCategories}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAllCategories}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              {availableCategories.map((category) => (
                <label key={category} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 truncate">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Value Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Value Range</label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Minimum Value</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={filters.valueRange.min}
                  onChange={(e) => handleValueRangeChange('min', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span className="font-medium">{filters.valueRange.min.toFixed(1)}</span>
                  <span>100</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Maximum Value</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={filters.valueRange.max}
                  onChange={(e) => handleValueRangeChange('max', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span className="font-medium">{filters.valueRange.max.toFixed(1)}</span>
                  <span>100</span>
                </div>
              </div>
            </div>
          </div>

          {/* Data Aggregation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Data Aggregation</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Time Period</label>
                <select
                  value={aggregation.period}
                  onChange={(e) => setAggregation(prev => ({ 
                    ...prev, 
                    period: e.target.value as DataAggregation['period']
                  }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1min">1 Minute</option>
                  <option value="5min">5 Minutes</option>
                  <option value="1hour">1 Hour</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Method</label>
                <select
                  value={aggregation.method}
                  onChange={(e) => setAggregation(prev => ({ 
                    ...prev, 
                    method: e.target.value as DataAggregation['method']
                  }))}
                  className="w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="average">Average</option>
                  <option value="sum">Sum</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Statistics */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Filter Statistics</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500">Selected Categories:</span>
                <span className="ml-1 font-medium">
                  {filters.categories.length === 0 ? 'All' : filters.categories.length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Value Range:</span>
                <span className="ml-1 font-medium">
                  {filters.valueRange.min.toFixed(1)} - {filters.valueRange.max.toFixed(1)}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Aggregation:</span>
                <span className="ml-1 font-medium">{aggregation.period} {aggregation.method}</span>
              </div>
              <div>
                <span className="text-gray-500">Data Points:</span>
                <span className="ml-1 font-medium">{dataCount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-200">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Reset Filters
            </button>
            <button 
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => {
                // Apply aggregation - this would typically trigger a callback
                console.log('Applying aggregation:', aggregation);
              }}
            >
              Apply Aggregation
            </button>
          </div>
        </div>
      )}
    </div>
  );
}