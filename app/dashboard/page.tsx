import { Metadata } from 'next';
import { DataGenerator } from '@/lib/dataGenerator';
import DashboardClient from './DashboardClient';

export const metadata: Metadata = {
  title: 'Performance Dashboard',
  description: 'Real-time data visualization dashboard with 60 FPS performance',
};

// Server Component - generates initial data
export default async function DashboardPage() {
  // Generate initial dataset on the server
  const initialData = DataGenerator.generateInitialDataset(5000); // Start with 5k points

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Server-rendered header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Performance Dashboard</h1>
              <p className="text-sm text-gray-600">
                Real-time data visualization • {initialData.length.toLocaleString()} initial data points
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Next.js 14 + TypeScript
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full" title="System Online" />
            </div>
          </div>
        </div>
      </header>

      {/* Client Component for interactivity */}
      <DashboardClient initialData={initialData} />
    </div>
  );
}