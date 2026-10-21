import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  Info,
  Layers,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { ReliabilityIntervalResult } from '../../types';
import { TANK_BRANDS } from '../../constants';

interface Props {
  reliabilityMap: Record<number, ReliabilityIntervalResult>;
  onSelect: (size: number) => void;
  selectedSize: number;
  recommendedSize?: number;
  recommendedReliability?: ReliabilityIntervalResult;
  dailyDemand?: number;
}

const BrandMarketComparison: React.FC<Props> = ({
  reliabilityMap,
  onSelect,
  selectedSize,
  recommendedSize = 26500,
  recommendedReliability,
  dailyDemand = 1000,
}) => {
  const formatNumber = (value: number, decimals = 0) => value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const selectedRel = reliabilityMap[selectedSize];
  const recRel = recommendedReliability || reliabilityMap[recommendedSize];
  const isSmallerThanRecommended = selectedSize < recommendedSize;
  const tanksNeeded = Math.ceil(recommendedSize / selectedSize);
  const selectedBufferDays = Math.round(selectedSize / Math.max(1, dailyDemand));
  const recommendedBufferDays = Math.round(recommendedSize / Math.max(1, dailyDemand));

  return (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden mt-6">
      {/* Card Header */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-[#0053DF]" />
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Available Commercial Tank Sizes</h3>
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase">Cautious to best case</div>
      </div>

      {/* Brand Grid */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {TANK_BRANDS.map(brand => (
          <div key={brand.name} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="font-black text-slate-800 text-xs uppercase tracking-tighter">{brand.name}</h4>
              <Tag size={12} className="text-slate-300" />
            </div>

            <div className="space-y-4">
              {Object.entries(brand.categories).map(([category, sizes]) => (
                <div key={category} className="space-y-2">
                  <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1">{category} sizes</div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {sizes.map(size => {
                      const reliability = reliabilityMap[size];
                      const isSelected = selectedSize === size;
                      const hasData = Boolean(reliability);

                      return (
                        <button
                          key={size}
                          disabled={!hasData}
                          onClick={() => onSelect(size)}
                          className={`flex items-center justify-between px-3 py-2 rounded-md border text-left transition-all ${!hasData ? 'opacity-30 cursor-not-allowed bg-slate-50 border-slate-100' : ''} ${isSelected ? 'bg-[#0053DF] text-white border-[#0053DF] shadow-md scale-[1.02]' : 'bg-white border-slate-200 hover:border-primary/50 text-slate-600'}`}
                        >
                          <div className="flex flex-col">
                            <span className={`text-[11px] font-black tabular-nums ${isSelected ? 'text-white' : 'text-slate-800'}`}>{formatNumber(size)} L</span>
                            {isSelected && (
                              <span className="text-[8px] font-bold opacity-80 flex items-center gap-1">
                                <CheckCircle2 size={8} /> Selected
                              </span>
                            )}
                          </div>
                          <div className="text-right text-[10px]">
                            {hasData ? (
                              <>
                                <div className={`font-bold ${isSelected ? 'text-blue-200' : 'text-slate-700'}`}>{reliability.conservativeReliability.toFixed(1)}%</div>
                                <div className={`${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>typical {reliability.medianReliability.toFixed(1)}%</div>
                              </>
                            ) : (
                              <span className="text-slate-300">N/A</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Selected Tank Context & Multiple-Tank Suggestion Box */}
      {selectedRel && (
        <div className="mx-6 mb-6 rounded-md border border-blue-200 bg-blue-50/70 p-4 text-slate-700">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-md bg-[#0053DF] text-white shrink-0 mt-0.5">
              <Layers size={18} />
            </div>
            <div className="space-y-3 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-2">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Selected Single Tank</span>
                  <div className="text-base font-black text-slate-900">
                    {formatNumber(selectedSize)} L ({formatNumber(selectedSize / 1000, 1)} kL)
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Typical Reliability</div>
                    <div className="text-sm font-black text-[#0053DF]">{selectedRel.medianReliability.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Cautious (Dry Year)</div>
                    <div className="text-sm font-black text-slate-700">{selectedRel.conservativeReliability.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Zero-Rain Buffer</div>
                    <div className="text-sm font-black text-slate-700">{selectedBufferDays} days</div>
                  </div>
                </div>
              </div>

              {isSmallerThanRecommended ? (
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2 text-slate-600">
                    <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                    <span>
                      <strong>Implication of this single tank:</strong> The recommended size is <strong>{formatNumber(recommendedSize / 1000, 1)} kL</strong> (which provides ~{recRel?.medianReliability.toFixed(1) ?? '80.7'}% reliability and {recommendedBufferDays} days of dry buffer). A single {formatNumber(selectedSize)} L tank drops your dry reserve to only <strong>{selectedBufferDays} school days</strong>, leaving a {( (recRel?.medianReliability ?? 80.7) - selectedRel.medianReliability ).toFixed(1)}% coverage gap. Heavy downpours will also overflow quickly and waste water.
                    </span>
                  </div>

                  <div className="bg-white border border-blue-200 rounded-md p-3 space-y-2">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="text-[#0053DF]">★</span>
                      <span>Modular Multi-Tank Solution (Connect in Parallel):</span>
                    </div>
                    <p className="text-slate-600">
                      Standard tanks rarely exceed 10,000 L. To achieve the recommended <strong>{formatNumber(recommendedSize / 1000, 1)} kL</strong> using this commercial model, install <strong className="text-[#0053DF]">{tanksNeeded} × {formatNumber(selectedSize)} L tanks in parallel</strong> (linked at the base with equalizing pipes):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-2">
                        <div className="font-bold text-slate-700">1 Tank ({formatNumber(selectedSize / 1000, 1)} kL)</div>
                        <div className="text-slate-500">{selectedRel.medianReliability.toFixed(1)}% typical ({selectedBufferDays} days buffer)</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-md p-2">
                        <div className="font-bold text-slate-700">2 Tanks ({formatNumber((selectedSize * 2) / 1000, 1)} kL)</div>
                        <div className="text-slate-500">~{reliabilityMap[selectedSize * 2]?.medianReliability.toFixed(1) ?? '77.8'}% typical ({selectedBufferDays * 2} days buffer)</div>
                      </div>
                      <div className="bg-blue-50 border border-blue-300 rounded-md p-2 font-semibold">
                        <div className="text-[#0053DF]">{tanksNeeded} Tanks ({formatNumber((selectedSize * tanksNeeded) / 1000, 1)} kL)</div>
                        <div className="text-blue-700">~{reliabilityMap[selectedSize * tanksNeeded]?.medianReliability.toFixed(1) ?? '82.0'}% typical (Full Goal Met)</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-green-700 font-medium bg-green-50 border border-green-200 rounded-md p-2.5">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                  <span>
                    This tank capacity ({formatNumber(selectedSize / 1000, 1)} kL) fully meets or exceeds the recommended {formatNumber(recommendedSize / 1000, 1)} kL target, providing a strong {selectedBufferDays}-day dry period buffer.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Explanation of Reliability Percentage */}
      <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <HelpCircle size={14} className="text-[#0053DF]" />
          <span>Understanding the Reliability Percentage:</span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          {selectedRel ? (
            <>
              For the selected <strong>{formatNumber(selectedSize)} L</strong> tank, <strong>{selectedRel.medianReliability.toFixed(1)}% Typical Reliability</strong> means that under normal historical weather patterns, the tank will completely meet 100% of student handwashing on approximately <strong>{Math.round(selectedRel.medianReliability)} out of 100 school days</strong>. On the remaining <strong>{100 - Math.round(selectedRel.medianReliability)} days</strong>, the tank will be empty or insufficient, and auxiliary water (tap or well) must be used. The <strong>{selectedRel.conservativeReliability.toFixed(1)}% Cautious</strong> rate is your safety benchmark during severe drought years (10th percentile).
            </>
          ) : (
            <>
              Reliability shows the percentage of school days where the tank completely fulfills daily water demand without running dry. Cautious represents drought years (10th percentile), and Typical represents normal years (50th percentile).
            </>
          )}
        </p>
        <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 text-[10px]">
          <span className="text-slate-400 italic">Off-the-shelf tanks can be purchased from accredited Philippine plumbing and sanitary distributors.</span>
          <a href="#" onClick={event => event.preventDefault()} className="font-bold text-[#0053DF] hover:underline flex items-center gap-1">
            Check Local Supplier <ExternalLink size={10} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default BrandMarketComparison;
