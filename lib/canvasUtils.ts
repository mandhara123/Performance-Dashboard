import { DataPoint, ChartDimensions } from './types';

export class CanvasUtils {
  static createHighDPICanvas(width: number, height: number): {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    scale: number;
  } {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    const scale = window.devicePixelRatio || 1;

    // Set the actual size in memory (scaled to account for extra pixel density)
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);

    // Scale the canvas back down using CSS
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    // Scale the drawing context so everything draws at the correct size
    context.scale(scale, scale);

    return { canvas, context, scale };
  }

  static clearCanvas(context: CanvasRenderingContext2D, width: number, height: number): void {
    context.clearRect(0, 0, width, height);
  }

  static drawLine(
    context: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    color: string = '#3b82f6',
    lineWidth: number = 2
  ): void {
    if (points.length < 2) return;

    context.save();
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      context.lineTo(points[i].x, points[i].y);
    }
    
    context.stroke();
    context.restore();
  }

  static drawBars(
    context: CanvasRenderingContext2D,
    bars: { x: number; y: number; width: number; height: number }[],
    color: string = '#3b82f6'
  ): void {
    context.save();
    context.fillStyle = color;
    
    bars.forEach(bar => {
      context.fillRect(bar.x, bar.y, bar.width, bar.height);
    });
    
    context.restore();
  }

  static drawPoints(
    context: CanvasRenderingContext2D,
    points: { x: number; y: number }[],
    color: string = '#3b82f6',
    radius: number = 3
  ): void {
    context.save();
    context.fillStyle = color;
    
    points.forEach(point => {
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.fill();
    });
    
    context.restore();
  }

  static drawGrid(
    context: CanvasRenderingContext2D,
    dimensions: ChartDimensions,
    xTicks: number[],
    yTicks: number[]
  ): void {
    const { width, height, margin } = dimensions;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    context.save();
    context.strokeStyle = '#e5e7eb';
    context.lineWidth = 1;

    // Vertical grid lines
    xTicks.forEach(tick => {
      const x = margin.left + (tick * chartWidth);
      context.beginPath();
      context.moveTo(x, margin.top);
      context.lineTo(x, height - margin.bottom);
      context.stroke();
    });

    // Horizontal grid lines
    yTicks.forEach(tick => {
      const y = margin.top + ((1 - tick) * chartHeight);
      context.beginPath();
      context.moveTo(margin.left, y);
      context.lineTo(width - margin.right, y);
      context.stroke();
    });

    context.restore();
  }

  static drawAxes(
    context: CanvasRenderingContext2D,
    dimensions: ChartDimensions,
    xLabels: string[],
    yLabels: string[]
  ): void {
    const { width, height, margin } = dimensions;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    context.save();
    context.strokeStyle = '#374151';
    context.lineWidth = 2;
    context.font = '12px system-ui';
    context.fillStyle = '#374151';
    context.textAlign = 'center';
    context.textBaseline = 'middle';

    // X-axis
    context.beginPath();
    context.moveTo(margin.left, height - margin.bottom);
    context.lineTo(width - margin.right, height - margin.bottom);
    context.stroke();

    // Y-axis
    context.beginPath();
    context.moveTo(margin.left, margin.top);
    context.lineTo(margin.left, height - margin.bottom);
    context.stroke();

    // X-axis labels
    xLabels.forEach((label, index) => {
      const x = margin.left + ((index / (xLabels.length - 1)) * chartWidth);
      context.fillText(label, x, height - margin.bottom + 15);
    });

    // Y-axis labels
    context.textAlign = 'right';
    yLabels.forEach((label, index) => {
      const y = margin.top + ((index / (yLabels.length - 1)) * chartHeight);
      context.fillText(label, margin.left - 10, y);
    });

    context.restore();
  }

  static getDataBounds(data: DataPoint[]): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } {
    if (data.length === 0) {
      return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }

    let minX = data[0].timestamp;
    let maxX = data[0].timestamp;
    let minY = data[0].value;
    let maxY = data[0].value;

    data.forEach(point => {
      minX = Math.min(minX, point.timestamp);
      maxX = Math.max(maxX, point.timestamp);
      minY = Math.min(minY, point.value);
      maxY = Math.max(maxY, point.value);
    });

    // Add some padding
    const xPadding = (maxX - minX) * 0.05;
    const yPadding = (maxY - minY) * 0.1;

    return {
      minX: minX - xPadding,
      maxX: maxX + xPadding,
      minY: Math.max(0, minY - yPadding),
      maxY: maxY + yPadding,
    };
  }

  static scalePoint(
    value: { x: number; y: number },
    bounds: { minX: number; maxX: number; minY: number; maxY: number },
    dimensions: ChartDimensions
  ): { x: number; y: number } {
    const { width, height, margin } = dimensions;
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const x = margin.left + ((value.x - bounds.minX) / (bounds.maxX - bounds.minX)) * chartWidth;
    const y = margin.top + ((bounds.maxY - value.y) / (bounds.maxY - bounds.minY)) * chartHeight;

    return { x, y };
  }

  static createOffscreenCanvas(width: number, height: number): {
    canvas: OffscreenCanvas;
    context: OffscreenCanvasRenderingContext2D;
  } | null {
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(width, height);
      const context = canvas.getContext('2d');
      if (context) {
        return { canvas, context };
      }
    }
    return null;
  }
}