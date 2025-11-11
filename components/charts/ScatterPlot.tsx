'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer } from '@/hooks/useChartRenderer';
import { CanvasUtils } from '@/lib/canvasUtils';

export interface ScatterPlotProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  pointRadius?: number;
  enableInteraction?: boolean;
  className?: string;
  xField?: keyof DataPoint;
  yField?: keyof DataPoint;
}

export default function ScatterPlot({
  data,
  width = 800,
  height = 400,
  pointRadius = 4,
  enableInteraction = true,
  className = '',
  xField = 'timestamp',
  yField = 'value',
}: ScatterPlotProps) {
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

  // Group data by category for different colors
  const groupedData = useMemo(() => {
    const groups = new Map<string, DataPoint[]>();
    
    data.forEach(point => {
      if (!groups.has(point.category)) {
        groups.set(point.category, []);
      }
      groups.get(point.category)!.push(point);
    });

    return groups;
  }, [data]);

  // Calculate data bounds for both axes
  const dataBounds = useMemo(() => {
    if (data.length === 0) {
      return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }

    const xValues = data.map(point => {
      const val = point[xField];
      return typeof val === 'number' ? val : 0;
    });
    
    const yValues = data.map(point => {
      const val = point[yField];
      return typeof val === 'number' ? val : 0;
    });

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    // Add padding
    const xPadding = (maxX - minX) * 0.05;
    const yPadding = (maxY - minY) * 0.1;

    return {
      minX: minX - xPadding,
      maxX: maxX + xPadding,
      minY: Math.max(0, minY - yPadding),
      maxY: maxY + yPadding,
    };
  }, [data, xField, yField]);

  // Color palette for different categories
  const colors = useMemo(() => [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ], []);

  const renderChart = useCallback((context: CanvasRenderingContext2D) => {
    if (data.length === 0) return;

    // Draw grid
    const xTicks = [0, 0.25, 0.5, 0.75, 1];
    const yTicks = [0, 0.25, 0.5, 0.75, 1];
    CanvasUtils.drawGrid(context, dimensions, xTicks, yTicks);

    // Draw axes with proper labels
    const xLabels = xField === 'timestamp' ? [
      new Date(dataBounds.minX).toLocaleTimeString(),
      new Date(dataBounds.minX + (dataBounds.maxX - dataBounds.minX) * 0.25).toLocaleTimeString(),
      new Date(dataBounds.minX + (dataBounds.maxX - dataBounds.minX) * 0.5).toLocaleTimeString(),
      new Date(dataBounds.minX + (dataBounds.maxX - dataBounds.minX) * 0.75).toLocaleTimeString(),
      new Date(dataBounds.maxX).toLocaleTimeString(),
    ] : [
      dataBounds.minX.toFixed(1),
      (dataBounds.minX + (dataBounds.maxX - dataBounds.minX) * 0.25).toFixed(1),
      (dataBounds.minX + (dataBounds.maxX - dataBounds.minX) * 0.5).toFixed(1),
      (dataBounds.minX + (dataBounds.maxX - dataBounds.minX) * 0.75).toFixed(1),
      dataBounds.maxX.toFixed(1),
    ];

    const yLabels = [
      dataBounds.maxY.toFixed(1),
      (dataBounds.maxY * 0.75).toFixed(1),
      (dataBounds.maxY * 0.5).toFixed(1),
      (dataBounds.maxY * 0.25).toFixed(1),
      dataBounds.minY.toFixed(1),
    ];

    CanvasUtils.drawAxes(context, dimensions, xLabels, yLabels);

    // Draw axis labels
    context.save();
    context.fillStyle = '#374151';
    context.font = '14px system-ui';
    context.textAlign = 'center';

    // X-axis label
    context.fillText(
      xField === 'timestamp' ? 'Time' : String(xField),
      dimensions.width / 2,
      dimensions.height - 5
    );

    // Y-axis label (rotated)
    context.save();
    context.translate(15, dimensions.height / 2);
    context.rotate(-Math.PI / 2);
    context.fillText(String(yField), 0, 0);
    context.restore();

    context.restore();

    // Draw points for each category
    let colorIndex = 0;
    groupedData.forEach((points, category) => {
      const pointColor = colors[colorIndex % colors.length];
      
      // Convert data points to screen coordinates
      const screenPoints = points.map(point => {
        const xVal = point[xField];
        const yVal = point[yField];
        return {
          screen: CanvasUtils.scalePoint(
            { 
              x: typeof xVal === 'number' ? xVal : 0, 
              y: typeof yVal === 'number' ? yVal : 0 
            },
            dataBounds,
            dimensions
          ),
          original: point,
        };
      });

      // Draw points with different opacity based on density
      context.save();
      
      // Calculate point density for alpha adjustment
      const alpha = Math.max(0.3, Math.min(1, 1000 / points.length));
      
      screenPoints.forEach(({ screen, original }) => {
        context.globalAlpha = alpha;
        context.fillStyle = pointColor;
        context.beginPath();
        context.arc(screen.x, screen.y, pointRadius, 0, Math.PI * 2);
        context.fill();

        // Add subtle stroke for better visibility
        context.globalAlpha = alpha * 0.8;
        context.strokeStyle = '#ffffff';
        context.lineWidth = 1;
        context.stroke();
      });

      context.restore();
      colorIndex++;
    });

    // Draw hover indicator
    if (interaction.hover?.dataPoint && interaction.hover?.position) {
      const hoverPoint = interaction.hover.dataPoint;
      const xVal = hoverPoint[xField];
      const yVal = hoverPoint[yField];
      
      if (typeof xVal === 'number' && typeof yVal === 'number') {
        const screenPoint = CanvasUtils.scalePoint(
          { x: xVal, y: yVal },
          dataBounds,
          dimensions
        );

        // Draw hover circle
        context.save();
        context.fillStyle = '#ffffff';
        context.strokeStyle = '#374151';
        context.lineWidth = 3;
        context.beginPath();
        context.arc(screenPoint.x, screenPoint.y, pointRadius + 3, 0, Math.PI * 2);
        context.fill();
        context.stroke();

        // Draw crosshairs
        context.strokeStyle = '#9ca3af';
        context.lineWidth = 1;
        context.setLineDash([5, 5]);
        
        // Vertical line
        context.beginPath();
        context.moveTo(screenPoint.x, dimensions.margin.top);
        context.lineTo(screenPoint.x, dimensions.height - dimensions.margin.bottom);
        context.stroke();
        
        // Horizontal line
        context.beginPath();
        context.moveTo(dimensions.margin.left, screenPoint.y);
        context.lineTo(dimensions.width - dimensions.margin.right, screenPoint.y);
        context.stroke();
        
        context.setLineDash([]);

        // Draw tooltip
        const xDisplay = xField === 'timestamp' 
          ? new Date(xVal).toLocaleString() 
          : xVal.toFixed(2);
        const yDisplay = typeof yVal === 'number' ? yVal.toFixed(2) : String(yVal);
        
        const tooltip = `${hoverPoint.category}\n${String(xField)}: ${xDisplay}\n${String(yField)}: ${yDisplay}`;
        const lines = tooltip.split('\n');
        
        context.font = '12px system-ui';
        const maxWidth = Math.max(...lines.map(line => context.measureText(line).width));
        const tooltipWidth = maxWidth + 16;
        const tooltipHeight = lines.length * 16 + 8;
        
        let tooltipX = screenPoint.x + 15;
        let tooltipY = screenPoint.y - 15;
        
        // Adjust tooltip position if it goes outside canvas
        if (tooltipX + tooltipWidth > dimensions.width - dimensions.margin.right) {
          tooltipX = screenPoint.x - tooltipWidth - 15;
        }
        if (tooltipY - tooltipHeight < dimensions.margin.top) {
          tooltipY = screenPoint.y + 30;
        }

        // Draw tooltip background
        context.fillStyle = 'rgba(0, 0, 0, 0.9)';
        context.fillRect(tooltipX, tooltipY - tooltipHeight, tooltipWidth, tooltipHeight);
        
        // Draw tooltip text
        context.fillStyle = '#ffffff';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        lines.forEach((line, index) => {
          context.fillText(line, tooltipX + 8, tooltipY - tooltipHeight + 4 + index * 16);
        });

        context.restore();
      }
    }
  }, [data, dimensions, interaction.hover, groupedData, colors, pointRadius, dataBounds, xField, yField]);

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
              <span className="text-sm text-gray-600">
                {category} ({groupedData.get(category)?.length} points)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Statistics */}
      <div className="mt-2 text-sm text-gray-600">
        <span>Total Points: {data.length}</span>
        <span className="ml-4">
          {String(xField)} Range: {dataBounds.minX.toFixed(2)} - {dataBounds.maxX.toFixed(2)}
        </span>
        <span className="ml-4">
          {String(yField)} Range: {dataBounds.minY.toFixed(2)} - {dataBounds.maxY.toFixed(2)}
        </span>
      </div>
    </div>
  );
}