import { NextRequest, NextResponse } from 'next/server';
import { DataGenerator } from '@/lib/dataGenerator';

// Server-Sent Events endpoint for real-time data streaming
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const interval = parseInt(searchParams.get('interval') || '1000'); // Default 1 second
  const batchSize = parseInt(searchParams.get('batchSize') || '10');

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      let lastTimestamp = Date.now();
      let isActive = true;

      const sendData = () => {
        if (!isActive) return;

        try {
          // Generate new data points
          const data = DataGenerator.generateBatchData(batchSize, lastTimestamp);
          lastTimestamp = data.length > 0 ? Math.max(...data.map(d => d.timestamp)) : lastTimestamp + interval;

          // Send SSE formatted data
          const eventData = JSON.stringify({
            type: 'data',
            payload: data,
            timestamp: Date.now(),
          });

          controller.enqueue(`data: ${eventData}\n\n`);

          // Schedule next update
          setTimeout(sendData, interval);
        } catch (error) {
          console.error('Error in SSE stream:', error);
          controller.enqueue(`data: ${JSON.stringify({ type: 'error', message: 'Stream error' })}\n\n`);
        }
      };

      // Send initial connection event
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);
      
      // Start sending data
      setTimeout(sendData, interval);

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        isActive = false;
        controller.close();
      });
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  });
}