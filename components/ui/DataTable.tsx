'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { DataPoint } from '@/lib/types';
import { useVirtualization } from '@/hooks/useVirtualization';

export interface DataTableProps {
  data: DataPoint[];
  height?: number;
  className?: string;
  onRowClick?: (dataPoint: DataPoint) => void;
  searchTerm?: string;
  sortBy?: keyof DataPoint;
  sortOrder?: 'asc' | 'desc';
}

interface Column {
  key: keyof DataPoint;
  label: string;
  sortable: boolean;
  formatter?: (value: any) => string;
  width?: string;
}

export default function DataTable({
  data,
  height = 400,
  className = '',
  onRowClick,
  searchTerm = '',
  sortBy = 'timestamp',
  sortOrder = 'desc',
}: DataTableProps) {
  const [internalSortBy, setInternalSortBy] = useState<keyof DataPoint>(sortBy);
  const [internalSortOrder, setInternalSortOrder] = useState<'asc' | 'desc'>(sortOrder);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Define table columns
  const columns: Column[] = useMemo(() => [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      formatter: (value: number) => new Date(value).toLocaleString(),
      width: '180px',
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      width: '120px',
    },
    {
      key: 'value',
      label: 'Value',
      sortable: true,
      formatter: (value: number) => value.toFixed(2),
      width: '100px',
    },
    {
      key: 'id',
      label: 'ID',
      sortable: false,
      formatter: (value: string) => value.slice(-8), // Show last 8 characters
      width: '100px',
    },
  ], []);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = data.filter(item => 
        item.category.toLowerCase().includes(term) ||
        item.id.toLowerCase().includes(term) ||
        item.value.toString().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aVal = a[internalSortBy];
      const bVal = b[internalSortBy];
      
      // Handle undefined values
      if (aVal === undefined && bVal === undefined) return 0;
      if (aVal === undefined) return 1;
      if (bVal === undefined) return -1;
      
      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      else if (aVal > bVal) comparison = 1;
      
      return internalSortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [data, searchTerm, internalSortBy, internalSortOrder]);

  // Virtual scrolling
  const {
    visibleItems,
    totalHeight,
    containerStyle,
    innerStyle,
    handleScroll,
    scrollToTop,
    scrollToBottom,
  } = useVirtualization({
    data: processedData,
    itemHeight: 40, // Height of each row
    containerHeight: height,
    overscan: 5,
  });

  const handleSort = useCallback((columnKey: keyof DataPoint) => {
    if (!columns.find(col => col.key === columnKey)?.sortable) return;

    if (internalSortBy === columnKey) {
      setInternalSortOrder(internalSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setInternalSortBy(columnKey);
      setInternalSortOrder('asc');
    }
  }, [internalSortBy, internalSortOrder, columns]);

  const handleRowSelection = useCallback((id: string) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === processedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(processedData.map(item => item.id)));
    }
  }, [processedData, selectedRows.size]);

  const exportSelectedData = useCallback(() => {
    const selectedData = processedData.filter(item => selectedRows.has(item.id));
    const csv = [
      columns.map(col => col.label).join(','),
      ...selectedData.map(item => 
        columns.map(col => {
          const value = item[col.key];
          return col.formatter ? col.formatter(value) : String(value);
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-export-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [processedData, selectedRows, columns]);

  const getSortIcon = useCallback((columnKey: keyof DataPoint) => {
    if (internalSortBy !== columnKey) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4M8 15l4 4 4-4" />
        </svg>
      );
    }
    
    return internalSortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15l4-4 4 4" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4 4 4-4" />
      </svg>
    );
  }, [internalSortBy, internalSortOrder]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Data Table</h3>
          <p className="text-sm text-gray-500">
            Showing {processedData.length.toLocaleString()} of {data.length.toLocaleString()} rows
            {selectedRows.size > 0 && ` (${selectedRows.size} selected)`}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <button
              onClick={exportSelectedData}
              className="px-3 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
            >
              Export ({selectedRows.size})
            </button>
          )}
          
          <button
            onClick={scrollToTop}
            className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Top
          </button>
          
          <button
            onClick={scrollToBottom}
            className="px-3 py-1 text-xs text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Bottom
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="relative">
        {/* Table Header */}
        <div className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10">
          <div className="flex items-center px-4 py-2">
            {/* Select All Checkbox */}
            <div className="flex items-center mr-4">
              <input
                type="checkbox"
                checked={selectedRows.size > 0 && selectedRows.size === processedData.length}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            
            {/* Column Headers */}
            <div className="flex flex-1">
              {columns.map((column) => (
                <div
                  key={String(column.key)}
                  className={`flex items-center justify-between px-3 py-2 ${
                    column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  style={{ width: column.width || 'auto', minWidth: column.width || '100px' }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <span className="text-sm font-medium text-gray-700">{column.label}</span>
                  {column.sortable && getSortIcon(column.key)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Virtual Scrolling Container */}
        <div style={containerStyle} onScroll={handleScroll} className="overflow-auto">
          <div style={innerStyle}>
            {visibleItems.map(({ item, index, style }) => (
              <div
                key={item.id}
                style={style}
                className={`flex items-center px-4 border-b border-gray-100 hover:bg-gray-50 ${
                  selectedRows.has(item.id) ? 'bg-blue-50' : ''
                } ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(item)}
              >
                {/* Row Checkbox */}
                <div className="flex items-center mr-4">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(item.id)}
                    onChange={() => handleRowSelection(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                
                {/* Row Data */}
                <div className="flex flex-1">
                  {columns.map((column) => (
                    <div
                      key={String(column.key)}
                      className="px-3 py-2 text-sm text-gray-900 truncate"
                      style={{ width: column.width || 'auto', minWidth: column.width || '100px' }}
                      title={
                        column.formatter 
                          ? column.formatter(item[column.key])
                          : String(item[column.key])
                      }
                    >
                      {column.formatter 
                        ? column.formatter(item[column.key])
                        : String(item[column.key])
                      }
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loading/Empty State */}
        {processedData.length === 0 && (
          <div className="flex items-center justify-center h-32 text-gray-500">
            {searchTerm ? 'No data matches your search criteria' : 'No data available'}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        <div>
          Virtual scrolling enabled • Displaying {visibleItems.length} of {processedData.length} rows
        </div>
        <div>
          {selectedRows.size > 0 && (
            <button
              onClick={() => setSelectedRows(new Set())}
              className="text-red-600 hover:text-red-800"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
}