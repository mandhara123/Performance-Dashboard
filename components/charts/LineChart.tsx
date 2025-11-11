'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer } from '@/hooks/useChartRenderer';
import { CanvasUtils } from '@/lib/canvasUtils';

export interface LineChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  lineWidth?: number;
  showPoints?: boolean;
  pointRadius?: number;
  enableInteraction?: boolean;
  className?: string;
}

export default function LineChart({
  data,
  width = 800,
  height = 400,
  color = '#3b82f6',
  lineWidth = 2,
  showPoints = false,
  pointRadius = 3,
  enableInteraction = true,
  className = '',
}: LineChartProps) {
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

  // Group data by category for multiple lines
  const groupedData = useMemo(() => {
    const groups = new Map<string, DataPoint[]>();
    
    data.forEach(point => {
      if (!groups.has(point.category)) {
        groups.set(point.category, []);
      }
      groups.get(point.category)!.push(point);
    });

    // Sort each group by timestamp
    groups.forEach((points) => {
      points.sort((a, b) => a.timestamp - b.timestamp);
    });

    return groups;
  }, [data]);

  // Color palette for different categories
  const colors = useMemo(() => [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ], []);

  const renderChart = useCallback((context: CanvasRenderingContext2D) => {
    if (data.length === 0) return;

    const bounds = CanvasUtils.getDataBounds(data);
    
    // Draw grid
    const xTicks = [0, 0.25, 0.5, 0.75, 1];
    const yTicks = [0, 0.25, 0.5, 0.75, 1];
    CanvasUtils.drawGrid(context, dimensions, xTicks, yTicks);

    // Draw axes
    const xLabels = [
      new Date(bounds.minX).toLocaleTimeString(),
      new Date(bounds.minX + (bounds.maxX - bounds.minX) * 0.25).toLocaleTimeString(),
      new Date(bounds.minX + (bounds.maxX - bounds.minX) * 0.5).toLocaleTimeString(),
      new Date(bounds.minX + (bounds.maxX - bounds.minX) * 0.75).toLocaleTimeString(),
      new Date(bounds.maxX).toLocaleTimeString(),
    ];
    
    const yLabels = [
      bounds.maxY.toFixed(1),
      (bounds.maxY * 0.75).toFixed(1),
      (bounds.maxY * 0.5).toFixed(1),
      (bounds.maxY * 0.25).toFixed(1),
      bounds.minY.toFixed(1),
    ];

    CanvasUtils.drawAxes(context, dimensions, xLabels, yLabels);

    // Draw lines for each category
    let colorIndex = 0;
    groupedData.forEach((points, category) => {
      const lineColor = color !== '#3b82f6' ? color : colors[colorIndex % colors.length];
      
      // Convert data points to screen coordinates
      const screenPoints = points.map(point => 
        CanvasUtils.scalePoint(
          { x: point.timestamp, y: point.value },
          bounds,
          dimensions
        )
      );

      // Draw line
      if (screenPoints.length > 1) {
        CanvasUtils.drawLine(context, screenPoints, lineColor, lineWidth);
      }

      // Draw points if enabled
      if (showPoints) {
        CanvasUtils.drawPoints(context, screenPoints, lineColor, pointRadius);
      }

      colorIndex++;
    });

    // Draw hover indicator
    if (interaction.hover?.dataPoint && interaction.hover?.position) {
      const hoverPoint = interaction.hover.dataPoint;
      const screenPoint = CanvasUtils.scalePoint(
        { x: hoverPoint.timestamp, y: hoverPoint.value },
        bounds,
        dimensions
      );

      // Draw hover circle
      context.save();
      context.fillStyle = '#ffffff';
      context.strokeStyle = '#374151';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(screenPoint.x, screenPoint.y, 6, 0, Math.PI * 2);
      context.fill();
      context.stroke();

      // Draw hover line
      context.strokeStyle = '#9ca3af';
      context.lineWidth = 1;
      context.setLineDash([5, 5]);
      context.beginPath();
      context.moveTo(screenPoint.x, dimensions.margin.top);
      context.lineTo(screenPoint.x, dimensions.height - dimensions.margin.bottom);
      context.stroke();
      context.setLineDash([]);

      // Draw tooltip background
      const tooltip = `${hoverPoint.category}: ${hoverPoint.value.toFixed(2)}`;
      context.font = '12px system-ui';
      const textMetrics = context.measureText(tooltip);
      const tooltipWidth = textMetrics.width + 16;
      const tooltipHeight = 24;
      
      let tooltipX = screenPoint.x + 10;
      let tooltipY = screenPoint.y - 10;
      
      // Adjust tooltip position if it goes outside canvas
      if (tooltipX + tooltipWidth > dimensions.width - dimensions.margin.right) {
        tooltipX = screenPoint.x - tooltipWidth - 10;
      }
      if (tooltipY - tooltipHeight < dimensions.margin.top) {
        tooltipY = screenPoint.y + 30;
      }

      // Draw tooltip
      context.fillStyle = 'rgba(0, 0, 0, 0.8)';
      context.fillRect(tooltipX, tooltipY - tooltipHeight, tooltipWidth, tooltipHeight);
      
      context.fillStyle = '#ffffff';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(tooltip, tooltipX + tooltipWidth / 2, tooltipY - tooltipHeight / 2);

      context.restore();
    }
  }, [data, dimensions, interaction.hover, groupedData, colors, color, lineWidth, showPoints, pointRadius]);

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

      {/* Legend */}
      {groupedData.size > 1 && (
        <div className="flex flex-wrap gap-4 mt-4">
          {Array.from(groupedData.keys()).map((category, index) => (
            <div key={category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: colors[index % colors.length] }}
              />
              <span className="text-sm text-gray-600">{category}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}