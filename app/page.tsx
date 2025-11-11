import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Performance Dashboard - Home',
  description: 'High-performance real-time data visualization dashboard',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Performance Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            High-performance real-time data visualization built with Next.js 14, 
            TypeScript, and Canvas. Capable of rendering 10,000+ data points at 60 FPS.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Charts</h3>
            <p className="text-gray-600">
              Multiple chart types including line, bar, scatter, and heatmap visualizations with real-time updates every 100ms.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">60 FPS Performance</h3>
            <p className="text-gray-600">
              Maintains smooth 60 FPS rendering even with 10,000+ data points using optimized Canvas rendering and React performance patterns.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Virtual Scrolling</h3>
            <p className="text-gray-600">
              Handle massive datasets with virtual scrolling in data tables, ensuring smooth performance regardless of data size.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Controls</h3>
            <p className="text-gray-600">
              Advanced filtering, time range selection, data aggregation, and zoom/pan controls for comprehensive data exploration.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Performance Monitoring</h3>
            <p className="text-gray-600">
              Built-in performance monitoring with FPS counter, memory usage tracking, and real-time optimization suggestions.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Next.js 14 Optimized</h3>
            <p className="text-gray-600">
              Built with Next.js 14 App Router, Server Components, and TypeScript for maximum performance and developer experience.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white rounded-lg p-8 shadow-lg inline-block">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to explore high-performance data visualization?
            </h2>
            <p className="text-gray-600 mb-6">
              Experience smooth 60 FPS rendering with thousands of data points.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/dashboard"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-lg"
              >
                Launch Dashboard
              </Link>
              
              <div className="text-sm text-gray-500">
                Built with Next.js 14 + TypeScript
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="mt-16 bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Technical Specifications
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Targets</h3>
              <ul className="space-y-2 text-gray-600">
                <li>✓ 60 FPS with 10,000+ data points</li>
                <li>✓ &lt; 100ms response time for interactions</li>
                <li>✓ Memory efficient (no memory leaks)</li>
                <li>✓ Real-time updates every 100ms</li>
                <li>✓ Smooth zoom and pan interactions</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Technology Stack</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Next.js 14 with App Router</li>
                <li>• TypeScript for type safety</li>
                <li>• Canvas API for rendering</li>
                <li>• Custom React hooks</li>
                <li>• Tailwind CSS for styling</li>
                <li>• Server-Sent Events for streaming</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}