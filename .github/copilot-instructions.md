# Performance Dashboard Project Instructions

This is a high-performance real-time data visualization dashboard built with Next.js 14+ App Router and TypeScript. The project handles 10,000+ data points at 60fps using custom canvas-based rendering.

## Project Structure
- Next.js 14+ with App Router
- TypeScript for type safety
- Canvas-based chart rendering (no external chart libraries)
- Real-time data streaming
- Performance monitoring and optimization
- Virtual scrolling for large datasets

## Key Performance Features
- 60fps rendering with 10k+ data points
- Memory leak prevention
- Real-time updates every 100ms
- Interactive controls (zoom, pan, filter)
- Multiple chart types (line, bar, scatter, heatmap)

## Development Notes
- Use Server Components for static data
- Use Client Components for interactive features
- Implement proper memoization patterns
- Canvas rendering for performance
- Custom hooks for data management