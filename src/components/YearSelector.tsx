import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check } from 'lucide-react';

interface YearSelectorProps {
  availableYears: number[];
  selectedYears: number[];
  onChange: (years: number[]) => void;
}

export const YearSelector: React.FC<YearSelectorProps> = ({ availableYears, selectedYears, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ensure we have at least current year +/- 1 if empty
  const currentYear = new Date().getFullYear();
  const displayYears = Array.from(new Set([...availableYears, currentYear, currentYear - 1, currentYear + 1])).sort((a, b) => b - a);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleYear = (year: number) => {
    if (selectedYears.includes(year)) {
      // Don't allow unselecting the last year
      if (selectedYears.length > 1) {
        onChange(selectedYears.filter(y => y !== year));
      }
    } else {
      onChange([...selectedYears, year].sort((a, b) => b - a));
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
      >
        <Calendar size={16} className="text-gray-500 dark:text-gray-400" />
        <span>
            {selectedYears.length === 1 ? selectedYears[0] : `${selectedYears.length} Years`}
        </span>
        <ChevronDown size={14} className={`text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-1 z-50">
          <div className="px-3 py-2 border-b border-gray-50 dark:border-gray-700 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">
            Filter by Year
          </div>
          <div className="max-h-60 overflow-y-auto">
            {displayYears.map(year => (
              <button
                key={year}
                onClick={() => toggleYear(year)}
                className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className={selectedYears.includes(year) ? 'font-medium text-gray-900 dark:text-gray-50' : 'text-gray-600 dark:text-gray-300'}>
                  {year}
                </span>
                {selectedYears.includes(year) && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
