'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { TimeRange } from '@/lib/types';

export interface TimeRangeSelectorProps {
  timeRange: TimeRange;
  onTimeRangeChange: (timeRange: TimeRange) => void;
  dataTimeRange: TimeRange;
  className?: string;
}

interface CalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

function Calendar({ selectedDate, onDateSelect, minDate, maxDate }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth);

    // Previous month's trailing days
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 0);
    const prevMonthDays = prevMonth.getDate();
    
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, day);
      days.push(
        <button
          key={`prev-${day}`}
          className="w-8 h-8 text-xs text-gray-400 hover:bg-gray-100 rounded"
          onClick={() => onDateSelect(date)}
          disabled={isDateDisabled(date)}
        >
          {day}
        </button>
      );
    }

    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = isDateSelected(date);
      const isDisabled = isDateDisabled(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <button
          key={day}
          className={`w-8 h-8 text-xs rounded transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white'
              : isToday
              ? 'bg-blue-100 text-blue-800 font-semibold'
              : isDisabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => onDateSelect(date)}
          disabled={isDisabled}
        >
          {day}
        </button>
      );
    }

    // Next month's leading days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day);
      if (days.length < 42) {
        days.push(
          <button
            key={`next-${day}`}
            className="w-8 h-8 text-xs text-gray-400 hover:bg-gray-100 rounded"
            onClick={() => onDateSelect(date)}
            disabled={isDateDisabled(date)}
          >
            {day}
          </button>
        );
      }
    }

    return days;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      {/* Month/Year Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goToPreviousMonth}
          className="p-1 rounded hover:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="font-semibold text-sm text-gray-900">
          {monthNames[currentMonth.getMonth()]}, {currentMonth.getFullYear()}
        </div>
        
        <button
          onClick={goToNextMonth}
          className="p-1 rounded hover:bg-gray-100"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
    </div>
  );
}

interface TimePickerProps {
  time: { hour: number; minute: number };
  onTimeChange: (time: { hour: number; minute: number }) => void;
}

function TimePicker({ time, onTimeChange }: TimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="flex items-center space-x-1">
      <select
        value={time.hour.toString().padStart(2, '0')}
        onChange={(e) => onTimeChange({ ...time, hour: parseInt(e.target.value) })}
        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
      >
        {hours.map((hour) => (
          <option key={hour} value={hour}>
            {hour}
          </option>
        ))}
      </select>
      <span className="text-gray-500 text-xs">:</span>
      <select
        value={time.minute.toString().padStart(2, '0')}
        onChange={(e) => onTimeChange({ ...time, minute: parseInt(e.target.value) })}
        className="px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
      >
        {minutes.map((minute) => (
          <option key={minute} value={minute}>
            {minute}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function TimeRangeSelector({
  timeRange,
  onTimeRangeChange,
  dataTimeRange,
  className = '',
}: TimeRangeSelectorProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Ensure we have valid dates (not 1970)
  const validTimeRange = {
    start: timeRange.start > 946684800000 ? timeRange.start : Date.now() - (60 * 60 * 1000), // After year 2000
    end: timeRange.end > 946684800000 ? timeRange.end : Date.now()
  };
  
  const [startDate, setStartDate] = useState(new Date(validTimeRange.start));
  const [endDate, setEndDate] = useState(new Date(validTimeRange.end));
  const [startTime, setStartTime] = useState({
    hour: startDate.getHours(),
    minute: startDate.getMinutes()
  });
  const [endTime, setEndTime] = useState({
    hour: endDate.getHours(),
    minute: endDate.getMinutes()
  });

  useEffect(() => {
    // Only update if we have valid dates
    const start = timeRange.start > 946684800000 ? new Date(timeRange.start) : new Date(Date.now() - (60 * 60 * 1000));
    const end = timeRange.end > 946684800000 ? new Date(timeRange.end) : new Date();
    
    setStartDate(start);
    setEndDate(end);
    setStartTime({ hour: start.getHours(), minute: start.getMinutes() });
    setEndTime({ hour: end.getHours(), minute: end.getMinutes() });
  }, [timeRange]);

  const formatDateForDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatTimeForDisplay = (time: { hour: number; minute: number }) => {
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
  };

  const calculateDuration = (start: Date, end: Date) => {
    const diff = end.getTime() - start.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0) result += `${hours}h `;
    if (minutes > 0) result += `${minutes}m`;
    
    return result.trim() || '0m';
  };

  const applyRange = () => {
    const start = new Date(startDate);
    start.setHours(startTime.hour, startTime.minute, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(endTime.hour, endTime.minute, 0, 0);

    onTimeRangeChange({
      start: start.getTime(),
      end: end.getTime()
    });
    setIsCalendarOpen(false);
  };

  const handleClear = () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    setStartDate(oneHourAgo);
    setEndDate(now);
    setStartTime({ hour: oneHourAgo.getHours(), minute: oneHourAgo.getMinutes() });
    setEndTime({ hour: now.getHours(), minute: now.getMinutes() });
  };

  const handleToday = () => {
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Time Range</h3>
        <button
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isCalendarOpen ? 'Close' : 'Edit Range'}
        </button>
      </div>

      {isCalendarOpen && (
        <div className="space-y-4 mb-6">
          {/* Calendar Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Start Date/Time */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Start Date & Time</h4>
              <Calendar
                selectedDate={startDate}
                onDateSelect={setStartDate}
                minDate={new Date(dataTimeRange.start > 946684800000 ? dataTimeRange.start : Date.now() - (30 * 24 * 60 * 60 * 1000))}
                maxDate={new Date(dataTimeRange.end > 946684800000 ? dataTimeRange.end : Date.now())}
              />
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">Time:</span>
                <TimePicker time={startTime} onTimeChange={setStartTime} />
              </div>
            </div>

            {/* End Date/Time */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">End Date & Time</h4>
              <Calendar
                selectedDate={endDate}
                onDateSelect={setEndDate}
                minDate={new Date(dataTimeRange.start > 946684800000 ? dataTimeRange.start : Date.now() - (30 * 24 * 60 * 60 * 1000))}
                maxDate={new Date(dataTimeRange.end > 946684800000 ? dataTimeRange.end : Date.now())}
              />
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-600">Time:</span>
                <TimePicker time={endTime} onTimeChange={setEndTime} />
              </div>
            </div>
          </div>

          {/* Duration Display */}
          <div className="bg-gray-50 rounded p-3 text-center">
            <span className="text-sm text-gray-600">Duration: </span>
            <span className="text-sm font-medium">
              {calculateDuration(
                new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startTime.hour, startTime.minute),
                new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endTime.hour, endTime.minute)
              )}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex space-x-2">
              <button
                onClick={handleClear}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear
              </button>
              <button
                onClick={handleToday}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Today
              </button>
            </div>
            
            <button
              onClick={applyRange}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Apply Range
            </button>
          </div>
        </div>
      )}

      {/* Current Selection Display */}
      <div className="bg-gray-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Current Selection</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Start:</span>
            <span className="font-medium">
              {formatDateForDisplay(new Date(validTimeRange.start))} {formatTimeForDisplay({
                hour: new Date(validTimeRange.start).getHours(),
                minute: new Date(validTimeRange.start).getMinutes()
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">End:</span>
            <span className="font-medium">
              {formatDateForDisplay(new Date(validTimeRange.end))} {formatTimeForDisplay({
                hour: new Date(validTimeRange.end).getHours(),
                minute: new Date(validTimeRange.end).getMinutes()
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Duration:</span>
            <span className="font-medium">
              {calculateDuration(new Date(validTimeRange.start), new Date(validTimeRange.end))}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}