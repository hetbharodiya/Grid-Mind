import React, { useState, useMemo } from 'react';
import { Layers, Calendar, Clock, Activity, AlertCircle } from 'lucide-react';
import { SectionCard } from '../common/SectionCard';

interface FeatureInventoryCardProps {
  featureColumns: string[];
}

type FeatureCategory = 'all' | 'lags' | 'harmonics' | 'calendar' | 'rolling';

interface CategorizedFeature {
  name: string;
  category: 'lags' | 'harmonics' | 'calendar' | 'rolling' | 'other';
  badgeLabel: string;
  colorClass: string;
}

export const FeatureInventoryCard: React.FC<FeatureInventoryCardProps> = ({ featureColumns }) => {
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory>('all');

  // Deterministically categorize each feature column based on string pattern
  const categorizedList = useMemo<CategorizedFeature[]>(() => {
    return featureColumns.map((col) => {
      if (col.startsWith('lag_')) {
        return {
          name: col,
          category: 'lags',
          badgeLabel: 'Autoregressive Lag',
          colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300',
        };
      }
      if (col.startsWith('sin_') || col.startsWith('cos_')) {
        return {
          name: col,
          category: 'harmonics',
          badgeLabel: 'Cyclical Harmonic',
          colorClass: 'bg-sky-50 text-sky-700 border-sky-200 hover:border-sky-300',
        };
      }
      if (col.startsWith('rolling_')) {
        return {
          name: col,
          category: 'rolling',
          badgeLabel: 'Rolling Window',
          colorClass: 'bg-purple-50 text-purple-700 border-purple-200 hover:border-purple-300',
        };
      }
      if (['hour', 'day_of_week', 'day_of_month', 'month', 'is_weekend'].includes(col)) {
        return {
          name: col,
          category: 'calendar',
          badgeLabel: 'Calendar Attribute',
          colorClass: 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-300',
        };
      }
      return {
        name: col,
        category: 'other',
        badgeLabel: 'Engineered Feature',
        colorClass: 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300',
      };
    });
  }, [featureColumns]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    return {
      all: categorizedList.length,
      lags: categorizedList.filter((f) => f.category === 'lags').length,
      harmonics: categorizedList.filter((f) => f.category === 'harmonics').length,
      calendar: categorizedList.filter((f) => f.category === 'calendar').length,
      rolling: categorizedList.filter((f) => f.category === 'rolling').length,
    };
  }, [categorizedList]);

  // Filtered list based on active tab
  const filteredFeatures = useMemo(() => {
    if (selectedCategory === 'all') return categorizedList;
    return categorizedList.filter((f) => f.category === selectedCategory);
  }, [categorizedList, selectedCategory]);

  if (featureColumns.length === 0) {
    return (
      <SectionCard
        title="Feature Engineering Inventory"
        subtitle="Full registry of model input features returned by backend API"
      >
        <div className="p-8 text-center text-gray-500 font-sans text-xs flex items-center justify-center space-x-2">
          <AlertCircle className="w-4 h-4 text-gray-400" />
          <span>Feature column metadata is unavailable from the current model artifact.</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Feature Engineering Inventory"
      subtitle="Complete inventory of engineered input signals ingested during training & inference"
      badge={
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span>{featureColumns.length} Input Columns</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Interactive Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pb-2.5 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-sans font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-gray-900 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200/80'
            }`}
          >
            All ({categoryCounts.all})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('lags')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-sans font-semibold transition-all flex items-center space-x-1 ${
              selectedCategory === 'lags'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:text-emerald-700 hover:bg-gray-200/80'
            }`}
          >
            <Clock className="w-3.5 h-3.5 mr-1" />
            <span>Lags ({categoryCounts.lags})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('harmonics')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-sans font-semibold transition-all flex items-center space-x-1 ${
              selectedCategory === 'harmonics'
                ? 'bg-sky-100 text-sky-800 border border-sky-300 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:text-sky-700 hover:bg-gray-200/80'
            }`}
          >
            <Activity className="w-3.5 h-3.5 mr-1" />
            <span>Harmonics ({categoryCounts.harmonics})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-sans font-semibold transition-all flex items-center space-x-1 ${
              selectedCategory === 'calendar'
                ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:text-amber-700 hover:bg-gray-200/80'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 mr-1" />
            <span>Calendar ({categoryCounts.calendar})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory('rolling')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-sans font-semibold transition-all flex items-center space-x-1 ${
              selectedCategory === 'rolling'
                ? 'bg-purple-100 text-purple-800 border border-purple-300 shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:text-purple-700 hover:bg-gray-200/80'
            }`}
          >
            <Layers className="w-3.5 h-3.5 mr-1" />
            <span>Rolling Stats ({categoryCounts.rolling})</span>
          </button>
        </div>

        {/* Feature Chips Grid */}
        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1">
          {filteredFeatures.map((feat) => (
            <div
              key={feat.name}
              className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-mono flex items-center space-x-2 transition-all duration-150 ${feat.colorClass}`}
            >
              <span className="font-bold">{feat.name}</span>
              <span className="text-xs opacity-80 border-l border-current/30 pl-2 uppercase font-sans font-semibold">
                {feat.badgeLabel.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SectionCard>
  );
};

export default FeatureInventoryCard;
