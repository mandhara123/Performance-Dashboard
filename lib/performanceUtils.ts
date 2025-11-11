import { PerformanceMetrics } from './types';

export class PerformanceUtils {
  private static frameStartTimes: number[] = [];
  private static lastFrameTime = 0;
  private static memoryBaseline = 0;

  static startFrame(): void {
    this.frameStartTimes.push(performance.now());
    // Keep only last 60 frame times for FPS calculation
    if (this.frameStartTimes.length > 60) {
      this.frameStartTimes.shift();
    }
  }

  static endFrame(): void {
    this.lastFrameTime = performance.now();
  }

  static calculateFPS(): number {
    if (this.frameStartTimes.length < 2) return 0;
    
    const now = performance.now();
    const frameCount = this.frameStartTimes.length;
    const timeSpan = now - this.frameStartTimes[0];
    
    return Math.round((frameCount / timeSpan) * 1000);
  }

  static getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
    return 0;
  }

  static initializeMemoryBaseline(): void {
    this.memoryBaseline = this.getMemoryUsage();
  }

  static getMemoryGrowth(): number {
    return this.getMemoryUsage() - this.memoryBaseline;
  }

  static measureRenderTime<T>(fn: () => T): { result: T; time: number } {
    const start = performance.now();
    const result = fn();
    const time = performance.now() - start;
    return { result, time };
  }

  static getPerformanceMetrics(): PerformanceMetrics {
    return {
      fps: this.calculateFPS(),
      memoryUsage: this.getMemoryUsage(),
      renderTime: this.lastFrameTime - (this.frameStartTimes[this.frameStartTimes.length - 1] || 0),
      dataProcessingTime: 0, // Will be set by specific operations
      lastUpdate: Date.now(),
      frameCount: this.frameStartTimes.length,
    };
  }

  static createPerformanceObserver(callback: (metrics: PerformanceMetrics) => void): () => void {
    let animationId: number;
    
    const update = () => {
      callback(this.getPerformanceMetrics());
      animationId = requestAnimationFrame(update);
    };
    
    animationId = requestAnimationFrame(update);
    
    return () => cancelAnimationFrame(animationId);
  }

  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function (this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: number;
    return function (this: any, ...args: Parameters<T>) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay) as unknown as number;
    };
  }

  static createAnimationLoop(callback: (deltaTime: number) => void): () => void {
    let lastTime = 0;
    let animationId: number;
    
    const loop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      this.startFrame();
      callback(deltaTime);
      this.endFrame();
      
      animationId = requestAnimationFrame(loop);
    };
    
    animationId = requestAnimationFrame(loop);
    
    return () => cancelAnimationFrame(animationId);
  }
}