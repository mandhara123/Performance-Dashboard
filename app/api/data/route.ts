import { NextRequest, NextResponse } from 'next/server';
import { DataGenerator } from '@/lib/dataGenerator';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get('count') || '10000');
  const format = searchParams.get('format') || 'json';

  try {
    // Generate initial dataset
    const data = DataGenerator.generateInitialDataset(count);

    if (format === 'csv') {
      // Return CSV format
      const csv = [
        'id,timestamp,value,category',
        ...data.map(point => 
          `${point.id},${point.timestamp},${point.value},${point.category}`
        )
      ].join('\n');

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="data-${count}.csv"`,
        },
      });
    }

    // Return JSON format
    return NextResponse.json({
      data,
      count: data.length,
      generatedAt: new Date().toISOString(),
      stats: {
        categories: Array.from(new Set(data.map(d => d.category))),
        valueRange: {
          min: Math.min(...data.map(d => d.value)),
          max: Math.max(...data.map(d => d.value)),
        },
        timeRange: {
          start: Math.min(...data.map(d => d.timestamp)),
          end: Math.max(...data.map(d => d.timestamp)),
        },
      },
    });
  } catch (error) {
    console.error('Error generating data:', error);
    return NextResponse.json(
      { error: 'Failed to generate data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { count = 100, lastTimestamp } = body;

    // Generate batch data
    const startTimestamp = lastTimestamp || Date.now();
    const data = DataGenerator.generateBatchData(count, startTimestamp);

    return NextResponse.json({
      data,
      count: data.length,
      generatedAt: new Date().toISOString(),
      nextTimestamp: data.length > 0 ? Math.max(...data.map(d => d.timestamp)) : startTimestamp,
    });
  } catch (error) {
    console.error('Error generating batch data:', error);
    return NextResponse.json(
      { error: 'Failed to generate batch data' },
      { status: 500 }
    );
  }
}