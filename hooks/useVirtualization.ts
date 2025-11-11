'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { VirtualScrollConfig, VirtualScrollState } from '@/lib/types';

export interface UseVirtualizationOptions extends VirtualScrollConfig {
  data: any[];
}

export function useVirtualization({
  data,
  itemHeight,
  containerHeight,
  overscan = 5,
}: UseVirtualizationOptions) {
  const [scrollState, setScrollState] = useState<VirtualScrollState>({
    scrollTop: 0,
    visibleStart: 0,
    visibleEnd: 0,
    totalHeight: 0,
  });

  // Calculate visible range based on scroll position
  const visibleRange = useMemo(() => {
    const itemsInView = Math.ceil(containerHeight / itemHeight);
    const start = Math.max(0, Math.floor(scrollState.scrollTop / itemHeight) - overscan);
    const end = Math.min(data.length, start + itemsInView + overscan * 2);
    
    return { start, end };
  }, [scrollState.scrollTop, containerHeight, itemHeight, overscan, data.length]);

  // Get visible items based on the calculated range
  const visibleItems = useMemo(() => {
    return data.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      item,
      index: visibleRange.start + index,
      style: {
        position: 'absolute' as const,
        top: (visibleRange.start + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      },
    }));
  }, [data, visibleRange, itemHeight]);

  // Calculate total height for the virtual container
  const totalHeight = useMemo(() => {
    return data.length * itemHeight;
  }, [data.length, itemHeight]);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const scrollTop = event.currentTarget.scrollTop;
    
    setScrollState((prev: VirtualScrollState) => ({
      ...prev,
      scrollTop,
      visibleStart: visibleRange.start,
      visibleEnd: visibleRange.end,
      totalHeight,
    }));
  }, [visibleRange.start, visibleRange.end, totalHeight]);

  // Scroll to specific item
  const scrollToItem = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    const maxScrollTop = Math.max(0, totalHeight - containerHeight);
    let targetScrollTop: number;
    
    switch (align) {
      case 'center':
        targetScrollTop = index * itemHeight - containerHeight / 2 + itemHeight / 2;
        break;
      case 'end':
        targetScrollTop = index * itemHeight - containerHeight + itemHeight;
        break;
      case 'start':
      default:
        targetScrollTop = index * itemHeight;
        break;
    }
    
    targetScrollTop = Math.max(0, Math.min(maxScrollTop, targetScrollTop));
    
    setScrollState((prev: VirtualScrollState) => ({
      ...prev,
      scrollTop: targetScrollTop,
    }));
    
    return targetScrollTop;
  }, [totalHeight, containerHeight, itemHeight]);

  // Get item at scroll position
  const getItemAtPosition = useCallback((scrollTop: number) => {
    const index = Math.floor(scrollTop / itemHeight);
    return Math.max(0, Math.min(data.length - 1, index));
  }, [itemHeight, data.length]);

  // Check if item is visible
  const isItemVisible = useCallback((index: number) => {
    return index >= visibleRange.start && index < visibleRange.end;
  }, [visibleRange]);

  // Get scroll position for item
  const getItemScrollPosition = useCallback((index: number) => {
    return index * itemHeight;
  }, [itemHeight]);

  // Update scroll state when data length changes
  useEffect(() => {
    setScrollState((prev: VirtualScrollState) => ({
      ...prev,
      visibleStart: visibleRange.start,
      visibleEnd: visibleRange.end,
      totalHeight,
    }));
  }, [visibleRange.start, visibleRange.end, totalHeight]);

  return {
    // Virtual list properties
    visibleItems,
    totalHeight,
    scrollState,
    
    // Computed values
    visibleRange,
    itemsInView: Math.ceil(containerHeight / itemHeight),
    
    // Event handlers
    handleScroll,
    
    // Navigation methods
    scrollToItem,
    scrollToTop: () => scrollToItem(0, 'start'),
    scrollToBottom: () => scrollToItem(data.length - 1, 'end'),
    
    // Utility methods
    getItemAtPosition,
    isItemVisible,
    getItemScrollPosition,
    
    // Container style for the virtual scroller
    containerStyle: {
      height: containerHeight,
      overflow: 'auto',
      position: 'relative' as const,
    },
    
    // Inner container style that creates the scrollable area
    innerStyle: {
      height: totalHeight,
      position: 'relative' as const,
    },
  };
}