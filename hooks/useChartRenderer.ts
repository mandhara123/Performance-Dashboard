'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { DataPoint, ChartDimensions, ChartInteraction } from '@/lib/types';
import { CanvasUtils } from '@/lib/canvasUtils';
import { PerformanceUtils } from '@/lib/performanceUtils';

export interface UseChartRendererOptions {
  width: number;
  height: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  enableInteraction?: boolean;
  enableAnimation?: boolean;
}

export function useChartRenderer({
  width,
  height,
  margin = { top: 20, right: 30, bottom: 40, left: 50 },
  enableInteraction = true,
  enableAnimation = true,
}: UseChartRendererOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [isRendering, setIsRendering] = useState(false);
  
  const [interaction, setInteraction] = useState<ChartInteraction>({
    zoom: { x: 0, y: 0, scale: 1 },
    pan: { x: 0, y: 0 },
    hover: undefined,
  });

  const dimensions: ChartDimensions = {
    width,
    height,
    margin,
  };

  // Initialize canvas with high DPI support
  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const scale = window.devicePixelRatio || 1;

    // Set the actual size in memory (scaled to account for extra pixel density)
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);

    // Scale the canvas back down using CSS
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Get context and scale it
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(scale, scale);
    }

    return context;
  }, [width, height]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (context) {
      CanvasUtils.clearCanvas(context, width, height);
    }
  }, [width, height]);

  // Render function with performance monitoring
  const render = useCallback((renderFn: (context: CanvasRenderingContext2D, dimensions: ChartDimensions) => void) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    return PerformanceUtils.measureRenderTime(() => {
      PerformanceUtils.startFrame();
      
      // Clear canvas
      CanvasUtils.clearCanvas(context, width, height);
      
      // Apply transformations
      context.save();
      context.translate(interaction.pan.x, interaction.pan.y);
      context.scale(interaction.zoom.scale, interaction.zoom.scale);
      
      // Execute render function
      renderFn(context, dimensions);
      
      context.restore();
      PerformanceUtils.endFrame();
    });
  }, [width, height, dimensions, interaction]);

  // Animated render function
  const renderAnimated = useCallback((
    renderFn: (context: CanvasRenderingContext2D, dimensions: ChartDimensions, deltaTime: number) => void
  ) => {
    if (!enableAnimation) {
      render((ctx, dim) => renderFn(ctx, dim, 0));
      return;
    }

    setIsRendering(true);
    let lastTime = 0;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) {
        setIsRendering(false);
        return;
      }

      const context = canvas.getContext('2d');
      if (!context) {
        setIsRendering(false);
        return;
      }

      PerformanceUtils.measureRenderTime(() => {
        PerformanceUtils.startFrame();
        
        CanvasUtils.clearCanvas(context, width, height);
        
        context.save();
        context.translate(interaction.pan.x, interaction.pan.y);
        context.scale(interaction.zoom.scale, interaction.zoom.scale);
        
        renderFn(context, dimensions, deltaTime);
        
        context.restore();
        PerformanceUtils.endFrame();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
      setIsRendering(false);
    };
  }, [enableAnimation, render, width, height, dimensions, interaction]);

  // Convert screen coordinates to chart coordinates
  const screenToChart = useCallback((screenX: number, screenY: number, data: DataPoint[]) => {
    if (data.length === 0) return null;

    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const x = screenX - rect.left;
    const y = screenY - rect.top;

    // Adjust for pan and zoom
    const adjustedX = (x - interaction.pan.x) / interaction.zoom.scale;
    const adjustedY = (y - interaction.pan.y) / interaction.zoom.scale;

    const bounds = CanvasUtils.getDataBounds(data);
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Convert to data coordinates
    const dataX = bounds.minX + ((adjustedX - margin.left) / chartWidth) * (bounds.maxX - bounds.minX);
    const dataY = bounds.maxY - ((adjustedY - margin.top) / chartHeight) * (bounds.maxY - bounds.minY);

    return { x: dataX, y: dataY };
  }, [interaction, width, height, margin]);

  // Find nearest data point
  const findNearestPoint = useCallback((screenX: number, screenY: number, data: DataPoint[]) => {
    const chartCoords = screenToChart(screenX, screenY, data);
    if (!chartCoords) return null;

    let nearestPoint: DataPoint | null = null;
    let minDistance = Infinity;

    data.forEach((point) => {
      const distance = Math.sqrt(
        Math.pow(point.timestamp - chartCoords.x, 2) +
        Math.pow(point.value - chartCoords.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestPoint = point;
      }
    });

    return nearestPoint;
  }, [screenToChart]);

  // Mouse interaction handlers
  const handleMouseMove = useCallback((event: React.MouseEvent, data: DataPoint[] = []) => {
    if (!enableInteraction) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const screenX = event.clientX - rect.left;
    const screenY = event.clientY - rect.top;

    const nearestPoint = findNearestPoint(event.clientX, event.clientY, data);
    
    setInteraction((prev: ChartInteraction) => ({
      ...prev,
      hover: {
        dataPoint: nearestPoint,
        position: { x: screenX, y: screenY },
      },
    }));
  }, [enableInteraction, findNearestPoint]);

  const handleMouseLeave = useCallback(() => {
    if (!enableInteraction) return;
    
    setInteraction((prev: ChartInteraction) => ({
      ...prev,
      hover: undefined,
    }));
  }, [enableInteraction]);

  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!enableInteraction) return;
    
    event.preventDefault();
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    
    setInteraction((prev: ChartInteraction) => {
      const newScale = Math.max(0.1, Math.min(10, prev.zoom.scale * zoomFactor));
      
      // Zoom towards mouse position
      const newPanX = mouseX - (mouseX - prev.pan.x) * (newScale / prev.zoom.scale);
      const newPanY = mouseY - (mouseY - prev.pan.y) * (newScale / prev.zoom.scale);
      
      return {
        ...prev,
        zoom: { ...prev.zoom, scale: newScale },
        pan: { x: newPanX, y: newPanY },
      };
    });
  }, [enableInteraction]);

  // Reset zoom and pan
  const resetTransform = useCallback(() => {
    setInteraction((prev: ChartInteraction) => ({
      ...prev,
      zoom: { x: 0, y: 0, scale: 1 },
      pan: { x: 0, y: 0 },
    }));
  }, []);

  // Initialize canvas on mount and size changes
  useEffect(() => {
    initializeCanvas();
  }, [initializeCanvas]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    canvasRef,
    dimensions,
    interaction,
    isRendering,
    
    // Rendering methods
    render,
    renderAnimated,
    clearCanvas,
    
    // Coordinate conversion
    screenToChart,
    findNearestPoint,
    
    // Event handlers
    handleMouseMove,
    handleMouseLeave,
    handleWheel,
    
    // Transform controls
    resetTransform,
    setZoom: (scale: number) => setInteraction((prev: ChartInteraction) => ({
      ...prev,
      zoom: { ...prev.zoom, scale },
    })),
    setPan: (x: number, y: number) => setInteraction((prev: ChartInteraction) => ({
      ...prev,
      pan: { x, y },
    })),
  };
}