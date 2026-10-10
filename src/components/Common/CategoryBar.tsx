import React from 'react';
import { CategoryFilter } from '../../types';
import { ALL_CATEGORIES, getCategoryInfo } from '../../lib/categoryMeta';

interface CategoryBarProps {
  activeFilter: CategoryFilter;
  onSelectFilter: (filter: CategoryFilter) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({ activeFilter, onSelectFilter }) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 px-1 -mx-1">
      {/* "All" Filter Button */}
      <button
        onClick={() => onSelectFilter('All')}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all shadow-sm ${
          activeFilter === 'All'
            ? 'bg-forest text-[#FAF8F3] shadow-md scale-105'
            : 'bg-white/80 text-primaryText hover:bg-white border border-[#DED8C7]'
        }`}
      >
        <span>🧭</span>
        <span>All Notes</span>
      </button>

      {/* Category Pills */}
      {ALL_CATEGORIES.map((cat) => {
        const info = getCategoryInfo(cat);
        const isSelected = activeFilter === cat;

        return (
          <button
            key={cat}
            onClick={() => onSelectFilter(cat)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shadow-sm ${
              isSelected
                ? 'bg-forest text-[#FAF8F3] shadow-md scale-105 font-semibold'
                : 'bg-white/80 text-primaryText hover:bg-white border border-[#DED8C7]'
            }`}
          >
            <span>{info.icon}</span>
            <span>{cat}</span>
          </button>
        );
      })}
    </div>
  );
};
