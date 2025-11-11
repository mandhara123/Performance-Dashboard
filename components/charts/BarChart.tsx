'use client';

import React, { useEffect, useMemo, useCallback } from 'react';
import { DataPoint } from '@/lib/types';
import { useChartRenderer } from '@/hooks/useChartRenderer';
import { CanvasUtils } from '@/lib/canvasUtils';

export interface BarChartProps {
  data: DataPoint[];
  width?: number;
  height?: number;
  color?: string;
  barWidth?: number;
  enableInteraction?: boolean;
  className?: string;
}

export default function BarChart({
  data,
  width = 800,
  height = 400,
  color = '#3b82f6',
  barWidth,
  enableInteraction = true,
  className = '',
}: BarChartProps) {
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

  // Group and aggregate data for bar chart
  const barData = useMemo(() => {
    if (data.length === 0) return [];

    // Group by category and calculate aggregates
    const groups = new Map<string, { values: number[]; timestamps: number[] }>();
    
    data.forEach(point => {
      if (!groups.has(point.category)) {
        groups.set(point.category, { values: [], timestamps: [] });
      }
      const group = groups.get(point.category)!;
      group.values.push(point.value);
      group.timestamps.push(point.timestamp);
    });

    // Create bar data with averages
    return Array.from(groups.entries()).map(([category, group]) => {
      const averageValue = group.values.reduce((sum, val) => sum + val, 0) / group.values.length;
      const latestTimestamp = Math.max(...group.timestamps);
      
      return {
        id: `bar-${category}`,
        timestamp: latestTimestamp,
        value: averageValue,
        category,
        count: group.values.length,
        metadata: {
          isAggregated: true,
          originalCount: group.values.length,
        },
      };
    });
  }, [data]);

  // Calculate bar width based on available space
  const calculatedBarWidth = useMemo(() => {
    if (barWidth) return barWidth;
    
    const chartWidth = width - dimensions.margin.left - dimensions.margin.right;
    const availableWidth = chartWidth * 0.8; // 80% of chart width
    const barCount = barData.length;
    
    return barCount > 0 ? Math.max(20, availableWidth / barCount - 10) : 20;
  }, [barWidth, width, dimensions.margin, barData.length]);

  // Color palette for different categories
  const colors = useMemo(() => [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6b7280'
  ], []);

  const renderChart = useCallback((context: CanvasRenderingContext2D) => {
    if (barData.length === 0) return;

    const chartWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right;
    const chartHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
    
    // Calculate value bounds
    const maxValue = Math.max(...barData.map(bar => bar.value));
    const minValue = 0; // Start bars from zero

    // Draw grid (horizontal lines only for bar charts)
    const yTicks = [0, 0.25, 0.5, 0.75, 1];
    yTicks.forEach(tick => {
      const y = dimensions.margin.top + ((1 - tick) * chartHeight);
      context.save();
      context.strokeStyle = '#e5e7eb';
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(dimensions.margin.left, y);
      context.lineTo(dimensions.width - dimensions.margin.right, y);
      context.stroke();
      context.restore();
    });

    // Draw axes
    context.save();
    context.strokeStyle = '#374151';
    context.lineWidth = 2;

    // X-axis
    context.beginPath();
    context.moveTo(dimensions.margin.left, dimensions.height - dimensions.margin.bottom);
    context.lineTo(dimensions.width - dimensions.margin.right, dimensions.height - dimensions.margin.bottom);
    context.stroke();

    // Y-axis
    context.beginPath();
    context.moveTo(dimensions.margin.left, dimensions.margin.top);
    context.lineTo(dimensions.margin.left, dimensions.height - dimensions.margin.bottom);
    context.stroke();
    context.restore();

    // Draw bars
    const barSpacing = chartWidth / barData.length;
    
    barData.forEach((bar, index) => {
      const barColor = color !== '#3b82f6' ? color : colors[index % colors.length];
      const barHeight = (bar.value / maxValue) * chartHeight;
      const barX = dimensions.margin.left + (index * barSpacing) + (barSpacing - calculatedBarWidth) / 2;
      const barY = dimensions.height - dimensions.margin.bottom - barHeight;

      // Draw bar
      context.save();
      context.fillStyle = barColor;
      context.fillRect(barX, barY, calculatedBarWidth, barHeight);

      // Draw bar outline
      context.strokeStyle = '#ffffff';
      context.lineWidth = 2;
      context.strokeRect(barX, barY, calculatedBarWidth, barHeight);

      // Draw value label on top of bar
      context.fillStyle = '#374151';
      context.font = '12px system-ui';
      context.textAlign = 'center';
      context.textBaseline = 'bottom';
      context.fillText(
        bar.value.toFixed(1),
        barX + calculatedBarWidth / 2,
        barY - 5
      );

      // Draw category label at bottom
      context.textBaseline = 'top';
      context.save();
      context.translate(barX + calculatedBarWidth / 2, dimensions.height - dimensions.margin.bottom + 10);
      
      // Rotate text if categories are long
      if (bar.category.length > 8) {
        context.rotate(-Math.PI / 4);
      }
      
      context.fillText(bar.category, 0, 0);
      context.restore();

      context.restore();
    });

    // Draw Y-axis labels
    context.save();
    context.fillStyle = '#374151';
    context.font = '12px system-ui';
    context.textAlign = 'right';
    context.textBaseline = 'middle';

    yTicks.forEach((tick, index) => {
      const y = dimensions.margin.top + ((1 - tick) * chartHeight);
      const value = (tick * maxValue).toFixed(1);
      context.fillText(value, dimensions.margin.left - 10, y);
    });
    context.restore();

    // Draw hover effect
    if (interaction.hover?.position) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = interaction.hover.position.x;
        const hoveredBarIndex = Math.floor((mouseX - dimensions.margin.left) / barSpacing);
        
        if (hoveredBarIndex >= 0 && hoveredBarIndex < barData.length) {
          const hoveredBar = barData[hoveredBarIndex];
          const barX = dimensions.margin.left + (hoveredBarIndex * barSpacing) + (barSpacing - calculatedBarWidth) / 2;
          
          // Highlight hovered bar
          context.save();
          context.fillStyle = 'rgba(59, 130, 246, 0.3)';
          context.fillRect(
            barX, 
            dimensions.margin.top,
            calculatedBarWidth,
            chartHeight
          );

          // Draw tooltip
          const tooltip = `${hoveredBar.category}: ${hoveredBar.value.toFixed(2)} (${hoveredBar.count} points)`;
          context.font = '12px system-ui';
          const textMetrics = context.measureText(tooltip);
          const tooltipWidth = textMetrics.width + 16;
          const tooltipHeight = 24;
          
          let tooltipX = mouseX + 10;
          let tooltipY = interaction.hover.position.y - 10;
          
          // Adjust tooltip position if it goes outside canvas
          if (tooltipX + tooltipWidth > dimensions.width - dimensions.margin.right) {
            tooltipX = mouseX - tooltipWidth - 10;
          }

          // Draw tooltip background
          context.fillStyle = 'rgba(0, 0, 0, 0.8)';
          context.fillRect(tooltipX, tooltipY - tooltipHeight, tooltipWidth, tooltipHeight);
          
          // Draw tooltip text
          context.fillStyle = '#ffffff';
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.fillText(tooltip, tooltipX + tooltipWidth / 2, tooltipY - tooltipHeight / 2);

          context.restore();
        }
      }
    }
  }, [barData, dimensions, calculatedBarWidth, interaction.hover, colors, color, canvasRef]);

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
        onMouseMove={(e) => handleMouseMove(e, barData)}
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

      {/* Statistics */}
      <div className="mt-4 text-sm text-gray-600">
        <span>Categories: {barData.length}</span>
        {barData.length > 0 && (
          <>
            <span className="ml-4">Max Value: {Math.max(...barData.map(bar => bar.value)).toFixed(2)}</span>
            <span className="ml-4">Total Points: {barData.reduce((sum, bar) => sum + bar.count, 0)}</span>
          </>
        )}
      </div>
    </div>
  );
}