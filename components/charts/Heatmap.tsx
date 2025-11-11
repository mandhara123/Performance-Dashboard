'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer } from '@/hooks/useChartRenderer';

export interface HeatmapProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  cellSize?: number;
  enableInteraction?: boolean;
  className?: string;
  colorScheme?: 'blue' | 'red' | 'green' | 'purple';
}

export default function Heatmap({
  data,
  width = 800,
  height = 400,
  cellSize = 20,
  enableInteraction = true,
  className = '',
  colorScheme = 'blue',
}: HeatmapProps) {
  const {
    canvasRef,
    dimensions,
    interaction,
    render,
    handleMouseMove,
    handleMouseLeave,
    handleWheel,
    resetTransform,
  } = useChartRenderer({
    width,
    height,
    enableInteraction,
  });

  // Process data into heatmap grid
  const heatmapData = useMemo(() => {
    if (data.length === 0) return { grid: [], categories: [], timeBuckets: [], maxValue: 0, minValue: 0 };

    // Get unique categories and create time buckets
    const categories = Array.from(new Set(data.map(d => d.category))).sort();
    const timestamps = data.map(d => d.timestamp).sort((a, b) => a - b);
    const minTime = timestamps[0];
    const maxTime = timestamps[timestamps.length - 1];
    
    // Create time buckets (e.g., every 5 minutes)
    const bucketDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
    const bucketCount = Math.ceil((maxTime - minTime) / bucketDuration);
    const timeBuckets = Array.from({ length: bucketCount }, (_, i) => ({
      start: minTime + i * bucketDuration,
      end: minTime + (i + 1) * bucketDuration,
      label: new Date(minTime + i * bucketDuration).toLocaleTimeString(),
    }));

    // Create grid: categories x time buckets
    const grid: Array<Array<{ value: number; count: number; points: DataPoint[] }>> = [];
    let maxValue = 0;
    let minValue = Infinity;

    categories.forEach((category, categoryIndex) => {
      grid[categoryIndex] = [];
      
      timeBuckets.forEach((bucket, bucketIndex) => {
        const pointsInBucket = data.filter(point => 
          point.category === category &&
          point.timestamp >= bucket.start &&
          point.timestamp < bucket.end
        );

        const cellValue = pointsInBucket.length > 0
          ? pointsInBucket.reduce((sum, p) => sum + p.value, 0) / pointsInBucket.length
          : 0;

        maxValue = Math.max(maxValue, cellValue);
        if (cellValue > 0) {
          minValue = Math.min(minValue, cellValue);
        }

        grid[categoryIndex][bucketIndex] = {
          value: cellValue,
          count: pointsInBucket.length,
          points: pointsInBucket,
        };
      });
    });

    return { grid, categories, timeBuckets, maxValue, minValue: minValue === Infinity ? 0 : minValue };
  }, [data]);

  // Color schemes
  const colorSchemes = useMemo(() => ({
    blue: {
      low: '#dbeafe',
      medium: '#60a5fa',
      high: '#1d4ed8',
    },
    red: {
      low: '#fecaca',
      medium: '#f87171',
      high: '#dc2626',
    },
    green: {
      low: '#d1fae5',
      medium: '#34d399',
      high: '#059669',
    },
    purple: {
      low: '#e9d5ff',
      medium: '#a78bfa',
      high: '#7c3aed',
    },
  }), []);

  // Get color for value
  const getColor = useCallback((value: number, maxVal: number, minVal: number) => {
    if (value === 0) return '#f3f4f6'; // Gray for no data

    const normalizedValue = maxVal > minVal ? (value - minVal) / (maxVal - minVal) : 0;
    const scheme = colorSchemes[colorScheme];

    if (normalizedValue < 0.33) {
      return scheme.low;
    } else if (normalizedValue < 0.66) {
      return scheme.medium;
    } else {
      return scheme.high;
    }
  }, [colorSchemes, colorScheme]);

  const renderChart = useCallback((context: CanvasRenderingContext2D) => {
    if (heatmapData.grid.length === 0) return;

    const { grid, categories, timeBuckets, maxValue, minValue } = heatmapData;
    
    // Calculate cell dimensions
    const chartWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    const chartHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
    
    const cellWidth = Math.floor(chartWidth / timeBuckets.length);
    const cellHeight = Math.floor(chartHeight / categories.length);

    // Draw heatmap cells
    grid.forEach((categoryRow, categoryIndex) => {
      categoryRow.forEach((cell, bucketIndex) => {
        const x = dimensions.margin.left + bucketIndex * cellWidth;
        const y = dimensions.margin.top + categoryIndex * cellHeight;
        
        const color = getColor(cell.value, maxValue, minValue);
        
        // Draw cell
        context.save();
        context.fillStyle = color;
        context.fillRect(x, y, cellWidth, cellHeight);
        
        // Draw cell border
        context.strokeStyle = '#ffffff';
        context.lineWidth = 1;
        context.strokeRect(x, y, cellWidth, cellHeight);
        
        // Draw value text if cell is large enough
        if (cellWidth > 30 && cellHeight > 20) {
          context.fillStyle = cell.value > (maxValue * 0.6) ? '#ffffff' : '#374151';
          context.font = '10px system-ui';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          
          const displayValue = cell.count > 0 ? cell.value.toFixed(1) : '';
          context.fillText(displayValue, x + cellWidth / 2, y + cellHeight / 2);
        }
        
        context.restore();
      });
    });

    // Draw category labels (Y-axis)
    context.save();
    context.fillStyle = '#374151';
    context.font = '12px system-ui';
    context.textAlign = 'right';
    context.textBaseline = 'middle';

    categories.forEach((category, index) => {
      const y = dimensions.margin.top + index * cellHeight + cellHeight / 2;
      context.fillText(category, dimensions.margin.left - 5, y);
    });
    context.restore();

    // Draw time bucket labels (X-axis)
    context.save();
    context.fillStyle = '#374151';
    context.font = '10px system-ui';
    context.textAlign = 'center';
    context.textBaseline = 'top';

    timeBuckets.forEach((bucket, index) => {
      const x = dimensions.margin.left + index * cellWidth + cellWidth / 2;
      context.save();
      
      if (bucket.label.length > 8) {
        // Rotate long labels
        context.translate(x, dimensions.height - dimensions.margin.bottom + 5);
        context.rotate(-Math.PI / 4);
        context.fillText(bucket.label, 0, 0);
      } else {
        context.fillText(bucket.label, x, dimensions.height - dimensions.margin.bottom + 5);
      }
      
      context.restore();
    });
    context.restore();

    // Draw hover effect
    if (interaction.hover?.position) {
      const mouseX = interaction.hover.position.x - dimensions.margin.left;
      const mouseY = interaction.hover.position.y - dimensions.margin.top;
      
      const bucketIndex = Math.floor(mouseX / cellWidth);
      const categoryIndex = Math.floor(mouseY / cellHeight);
      
      if (bucketIndex >= 0 && bucketIndex < timeBuckets.length &&
          categoryIndex >= 0 && categoryIndex < categories.length) {
        
        const cell = grid[categoryIndex][bucketIndex];
        const x = dimensions.margin.left + bucketIndex * cellWidth;
        const y = dimensions.margin.top + categoryIndex * cellHeight;
        
        // Highlight hovered cell
        context.save();
        context.strokeStyle = '#374151';
        context.lineWidth = 3;
        context.strokeRect(x, y, cellWidth, cellHeight);
        context.restore();

        // Draw tooltip
        const category = categories[categoryIndex];
        const timeBucket = timeBuckets[bucketIndex];
        const tooltip = [
          `Category: ${category}`,
          `Time: ${timeBucket.label}`,
          `Value: ${cell.value.toFixed(2)}`,
          `Data Points: ${cell.count}`,
        ];

        context.save();
        context.font = '12px system-ui';
        const maxWidth = Math.max(...tooltip.map(line => context.measureText(line).width));
        const tooltipWidth = maxWidth + 16;
        const tooltipHeight = tooltip.length * 16 + 8;
        
        let tooltipX = interaction.hover.position.x + 15;
        let tooltipY = interaction.hover.position.y - 15;
        
        // Adjust tooltip position
        if (tooltipX + tooltipWidth > dimensions.width - dimensions.margin.right) {
          tooltipX = interaction.hover.position.x - tooltipWidth - 15;
        }
        if (tooltipY - tooltipHeight < dimensions.margin.top) {
          tooltipY = interaction.hover.position.y + 30;
        }

        // Draw tooltip background
        context.fillStyle = 'rgba(0, 0, 0, 0.9)';
        context.fillRect(tooltipX, tooltipY - tooltipHeight, tooltipWidth, tooltipHeight);
        
        // Draw tooltip text
        context.fillStyle = '#ffffff';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        tooltip.forEach((line, index) => {
          context.fillText(line, tooltipX + 8, tooltipY - tooltipHeight + 4 + index * 16);
        });

        context.restore();
      }
    }
  }, [heatmapData, dimensions, getColor, interaction.hover]);

  // Render chart when data changes
  useEffect(() => {
    render(renderChart);
  }, [render, renderChart]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg cursor-crosshair"
        onMouseMove={(e) => handleMouseMove(e, data)}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        style={{ width, height }}
      />
      
      {enableInteraction && (
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={resetTransform}
            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Reset Zoom
          </button>
        </div>
      )}

      {/* Color Legend */}
      <div className="flex items-center justify-center mt-4 gap-4">
        <span className="text-sm text-gray-600">Low</span>
        <div className="flex">
          <div 
            className="w-4 h-4 border border-gray-300"
            style={{ backgroundColor: colorSchemes[colorScheme].low }}
          />
          <div 
            className="w-4 h-4 border border-gray-300"
            style={{ backgroundColor: colorSchemes[colorScheme].medium }}
          />
          <div 
            className="w-4 h-4 border border-gray-300"
            style={{ backgroundColor: colorSchemes[colorScheme].high }}
          />
        </div>
        <span className="text-sm text-gray-600">High</span>
        <span className="text-sm text-gray-600 ml-4">
          Range: {heatmapData.minValue.toFixed(2)} - {heatmapData.maxValue.toFixed(2)}
        </span>
      </div>

      {/* Statistics */}
      <div className="mt-2 text-sm text-gray-600 text-center">
        <span>Categories: {heatmapData.categories.length}</span>
        <span className="ml-4">Time Buckets: {heatmapData.timeBuckets.length}</span>
        <span className="ml-4">Total Data Points: {data.length}</span>
      </div>
    </div>
  );
}