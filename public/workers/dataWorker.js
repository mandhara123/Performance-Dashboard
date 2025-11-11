// Data processing worker for heavy calculations
// This runs in a separate thread to keep the main UI thread responsive

// DataPoint structure: { timestamp, value, category, id }
// WorkerMessage structure: { type, payload, id }
// WorkerResponse structure: { type, result, id, error? }

// Data processing functions
function processLargeDataset(data) {
  // Apply smoothing algorithm for large datasets
  if (data.length < 1000) return data;
  
  const smoothingWindow = Math.min(50, Math.floor(data.length / 100));
  const smoothedData = [];
  
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(smoothingWindow / 2));
    const end = Math.min(data.length, i + Math.floor(smoothingWindow / 2) + 1);
    
    let sum = 0;
    let count = 0;
    
    for (let j = start; j < end; j++) {
      sum += data[j].value;
      count++;
    }
    
    smoothedData.push({
      ...data[i],
      value: sum / count
    });
  }
  
  return smoothedData;
}

function aggregateDataByTimeWindow(data, windowSize) {
  if (data.length === 0) return [];
  
  const aggregated = [];
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);
  
  let windowStart = sortedData[0].timestamp;
  let currentWindow = [];
  
  for (const point of sortedData) {
    if (point.timestamp >= windowStart + windowSize) {
      // Process current window
      if (currentWindow.length > 0) {
        const avgValue = currentWindow.reduce((sum, p) => sum + p.value, 0) / currentWindow.length;
        
        aggregated.push({
          timestamp: windowStart + windowSize / 2,
          value: avgValue,
          category: 'aggregated',
          id: `agg_${windowStart}_${windowStart + windowSize}`
        });
      }
      
      // Start new window
      windowStart = point.timestamp;
      currentWindow = [point];
    } else {
      currentWindow.push(point);
    }
  }
  
  // Process final window
  if (currentWindow.length > 0) {
    const avgValue = currentWindow.reduce((sum, p) => sum + p.value, 0) / currentWindow.length;
    aggregated.push({
      timestamp: windowStart + windowSize / 2,
      value: avgValue,
      category: 'aggregated',
      id: `agg_${windowStart}_final`
    });
  }
  
  return aggregated;
}

function generateLargeDataset(count, startTime) {
  const data = [];
  const categories = ['metric_a', 'metric_b', 'metric_c', 'metric_d'];
  
  for (let i = 0; i < count; i++) {
    // Generate realistic time-series data with trends and noise
    const baseValue = 50 + Math.sin(i * 0.01) * 20; // Sine wave trend
    const noise = (Math.random() - 0.5) * 10; // Random noise
    const seasonality = Math.sin(i * 0.001) * 5; // Seasonal pattern
    
    data.push({
      timestamp: startTime + i * 100,
      value: Math.max(0, baseValue + noise + seasonality),
      category: categories[i % categories.length],
      id: `point_${i}`
    });
  }
  
  return data;
}

function filterDataByRange(data, minValue, maxValue, category) {
  return data.filter(point => {
    const inRange = point.value >= minValue && point.value <= maxValue;
    const matchesCategory = !category || point.category === category;
    return inRange && matchesCategory;
  });
}

// Performance monitoring
function measurePerformance(fn, label) {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;
  
  console.log(`Worker: ${label} took ${duration.toFixed(2)}ms`);
  return { result, duration };
}

// Message handler
self.addEventListener('message', (event) => {
  const { type, payload, id } = event.data;
  
  try {
    let result;
    let duration;
    
    switch (type) {
      case 'PROCESS_DATA': {
        const measured = measurePerformance(
          () => processLargeDataset(payload.data),
          'Data processing'
        );
        result = measured.result;
        duration = measured.duration;
        break;
      }
      
      case 'AGGREGATE_DATA': {
        const measured = measurePerformance(
          () => aggregateDataByTimeWindow(payload.data, payload.windowSize),
          'Data aggregation'
        );
        result = measured.result;
        duration = measured.duration;
        break;
      }
      
      case 'GENERATE_DATA': {
        const measured = measurePerformance(
          () => generateLargeDataset(payload.count, payload.startTime),
          'Data generation'
        );
        result = measured.result;
        duration = measured.duration;
        break;
      }
      
      case 'FILTER_DATA': {
        const measured = measurePerformance(
          () => filterDataByRange(payload.data, payload.minValue, payload.maxValue, payload.category),
          'Data filtering'
        );
        result = measured.result;
        duration = measured.duration;
        break;
      }
      
      default:
        throw new Error(`Unknown worker message type: ${type}`);
    }
    
    const response = {
      type,
      result,
      id,
      duration
    };
    
    self.postMessage(response);
    
  } catch (error) {
    const response = {
      type,
      result: null,
      id,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    self.postMessage(response);
  }
});

// Send ready signal
self.postMessage({ type: 'WORKER_READY', result: null, id: 'init' });