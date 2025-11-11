// Web Worker for heavy data processing
self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'PROCESS_DATA':
      const processedData = processLargeDataset(data);
      self.postMessage({ type: 'DATA_PROCESSED', data: processedData });
      break;

    case 'AGGREGATE_DATA':
      const aggregatedData = aggregateDataPoints(data.points, data.interval);
      self.postMessage({ type: 'DATA_AGGREGATED', data: aggregatedData });
      break;

    case 'FILTER_DATA':
      const filteredData = filterDataByRange(data.points, data.range);
      self.postMessage({ type: 'DATA_FILTERED', data: filteredData });
      break;

    default:
      console.warn('Unknown worker message type:', type);
  }
};

function processLargeDataset(rawData) {
  const processed = [];
  const batchSize = 1000;
  
  for (let i = 0; i < rawData.length; i += batchSize) {
    const batch = rawData.slice(i, i + batchSize);
    
    // Process batch with heavy computations
    const processedBatch = batch.map(point => ({
      ...point,
      smoothedValue: calculateMovingAverage(rawData, i, 10),
      trend: calculateTrend(rawData, i, 20),
      volatility: calculateVolatility(rawData, i, 50),
    }));
    
    processed.push(...processedBatch);
    
    // Allow other operations to run
    if (i % (batchSize * 10) === 0) {
      self.postMessage({ 
        type: 'PROCESSING_PROGRESS', 
        data: { processed: i, total: rawData.length } 
      });
    }
  }
  
  return processed;
}

function aggregateDataPoints(points, intervalMs) {
  const aggregated = [];
  const buckets = new Map();
  
  points.forEach(point => {
    const bucketTime = Math.floor(point.timestamp / intervalMs) * intervalMs;
    
    if (!buckets.has(bucketTime)) {
      buckets.set(bucketTime, {
        timestamp: bucketTime,
        values: [],
        sum: 0,
        count: 0,
      });
    }
    
    const bucket = buckets.get(bucketTime);
    bucket.values.push(point.value);
    bucket.sum += point.value;
    bucket.count++;
  });
  
  buckets.forEach((bucket, timestamp) => {
    aggregated.push({
      timestamp,
      value: bucket.sum / bucket.count,
      min: Math.min(...bucket.values),
      max: Math.max(...bucket.values),
      count: bucket.count,
    });
  });
  
  return aggregated.sort((a, b) => a.timestamp - b.timestamp);
}

function filterDataByRange(points, range) {
  return points.filter(point => 
    point.timestamp >= range.start && 
    point.timestamp <= range.end &&
    point.value >= range.minValue &&
    point.value <= range.maxValue
  );
}

function calculateMovingAverage(data, index, window) {
  const start = Math.max(0, index - window + 1);
  const end = index + 1;
  const slice = data.slice(start, end);
  const sum = slice.reduce((acc, point) => acc + point.value, 0);
  return sum / slice.length;
}

function calculateTrend(data, index, window) {
  if (index < window) return 0;
  
  const start = index - window;
  const current = data[index].value;
  const previous = data[start].value;
  
  return ((current - previous) / previous) * 100;
}

function calculateVolatility(data, index, window) {
  const start = Math.max(0, index - window + 1);
  const end = index + 1;
  const slice = data.slice(start, end);
  
  if (slice.length < 2) return 0;
  
  const mean = slice.reduce((acc, point) => acc + point.value, 0) / slice.length;
  const variance = slice.reduce((acc, point) => acc + Math.pow(point.value - mean, 2), 0) / slice.length;
  
  return Math.sqrt(variance);
}