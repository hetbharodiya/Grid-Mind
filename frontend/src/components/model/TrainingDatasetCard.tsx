import React from 'react';
import { Database, Calendar, ShieldCheck, AlertCircle } from 'lucide-react';
import { SplitRatios, DateRangeItem } from '../../types/health';
import { SectionCard } from '../common/SectionCard';

interface TrainingDatasetCardProps {
  datasetUsed: string;
  totalRecords: number;
  splitRatios?: SplitRatios | null;
  dateRanges?: Record<string, DateRangeItem> | null;
}

export const TrainingDatasetCard: React.FC<TrainingDatasetCardProps> = ({
  datasetUsed,
  totalRecords,
  splitRatios,
  dateRanges,
}) => {
  const trainRatio = splitRatios?.train ?? 0.7;
  const valRatio = splitRatios?.val ?? 0.15;
  const testRatio = splitRatios?.test ?? 0.15;

  const trainRange = dateRanges?.train;
  const valRange = dateRanges?.val;
  const testRange = dateRanges?.test;

  const trainSamples = Math.round(totalRecords * trainRatio);
  const valSamples = Math.round(totalRecords * valRatio);
  const testSamples = Math.round(totalRecords * testRatio);

  if (!splitRatios && !dateRanges) {
    return (
      <SectionCard
        title="Training Dataset & Chronological Partitions"
        subtitle="Partition structure and chronological boundaries for model evaluation"
      >
        <div className="p-8 text-center text-gray-500 font-sans text-xs flex items-center justify-center space-x-2">
          <AlertCircle className="w-4 h-4 text-gray-400" />
          <span>Dataset partition metadata is not available.</span>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard
      title="Training Dataset & Chronological Partitions"
      subtitle="Strict forward-looking chronological splitting without lookahead leakage"
      badge={
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
          <Database className="w-3.5 h-3.5 text-amber-600" />
          <span>{datasetUsed}</span>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Proportional Split Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs sm:text-sm font-sans font-semibold text-gray-700">
            <span>Partition Allocation</span>
            <span className="font-mono text-xs text-gray-500">
              {(trainRatio * 100).toFixed(0)}% Train / {(valRatio * 100).toFixed(0)}% Val / {(testRatio * 100).toFixed(0)}% Test
            </span>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-200 border border-gray-300">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${trainRatio * 100}%` }}
              title={`Training Set (${(trainRatio * 100).toFixed(0)}%)`}
            />
            <div
              className="bg-sky-500 h-full transition-all duration-500"
              style={{ width: `${valRatio * 100}%` }}
              title={`Validation Set (${(valRatio * 100).toFixed(0)}%)`}
            />
            <div
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${testRatio * 100}%` }}
              title={`Test Set (${(testRatio * 100).toFixed(0)}%)`}
            />
          </div>
        </div>

        {/* Chronological Partition Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Training Split */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-800 font-sans">Training Set</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                {(trainRatio * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-base sm:text-lg font-bold text-gray-900 font-mono">{trainSamples.toLocaleString()} Samples</p>
            {trainRange && (
              <div className="text-xs text-gray-600 font-mono pt-2 border-t border-gray-200 space-y-1">
                <div className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  <span>Start: {trainRange.start.split(' ')[0]}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  <span>End: {trainRange.end.split(' ')[0]}</span>
                </div>
              </div>
            )}
          </div>

          {/* Validation Split */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-sky-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-sky-800 font-sans">Validation Set</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-bold">
                {(valRatio * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-base sm:text-lg font-bold text-gray-900 font-mono">{valSamples.toLocaleString()} Samples</p>
            {valRange && (
              <div className="text-xs text-gray-600 font-mono pt-2 border-t border-gray-200 space-y-1">
                <div className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  <span>Start: {valRange.start.split(' ')[0]}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  <span>End: {valRange.end.split(' ')[0]}</span>
                </div>
              </div>
            )}
          </div>

          {/* Test Split */}
          <div className="p-3.5 rounded-xl bg-gray-50 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-amber-800 font-sans">Holdout Test</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                {(testRatio * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-base sm:text-lg font-bold text-gray-900 font-mono">{testSamples.toLocaleString()} Samples</p>
            {testRange && (
              <div className="text-xs text-gray-600 font-mono pt-2 border-t border-gray-200 space-y-1">
                <div className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  <span>Start: {testRange.start.split(' ')[0]}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  <span>End: {testRange.end.split(' ')[0]}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Temporal Leakage Prevention Note */}
        <div className="flex items-start space-x-3 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <p className="leading-relaxed">
            <strong className="text-gray-900 font-semibold">Chronological Partition Guarantee:</strong> Partitions are strictly
            ordered in time without random shuffle. Validation and holdout test sets strictly follow the training
            period to guarantee zero lookahead bias, ensuring out-of-sample evaluation represents real-world continuous deployment.
          </p>
        </div>
      </div>
    </SectionCard>
  );
};

export default TrainingDatasetCard;
