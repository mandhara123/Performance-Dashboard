import { NextRequest, NextResponse } from 'next/server';
import { DataGenerator } from '@/lib/dataGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, period = '1min', method = 'average' } = body;

    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: 'Invalid data format. Expected array of data points.' },
        { status: 400 }
      );
    }

    // Aggregate the data
    const aggregatedData = DataGenerator.aggregateData(data, period, method);

    return NextResponse.json({
      originalCount: data.length,
      aggregatedCount: aggregatedData.length,
      aggregatedData,
      aggregation: { period, method },
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error aggregating data:', error);
    return NextResponse.json(
      { error: 'Failed to aggregate data' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const count = parseInt(searchParams.get('count') || '10000');
  const period = searchParams.get('period') as '1min' | '5min' | '1hour' || '1min';
  const method = searchParams.get('method') as 'average' | 'sum' | 'min' | 'max' || 'average';

  try {
    // Generate and aggregate data in one step
    const rawData = DataGenerator.generateInitialDataset(count);
    const aggregatedData = DataGenerator.aggregateData(rawData, period, method);

    return NextResponse.json({
      originalCount: rawData.length,
      aggregatedCount: aggregatedData.length,
      aggregatedData,
      rawData, // Include raw data for comparison
      aggregation: { period, method },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error generating aggregated data:', error);
    return NextResponse.json(
      { error: 'Failed to generate aggregated data' },
      { status: 500 }
    );
  }
}