import React from 'react';
import type { SuperdailyReport } from '@/types/superdaily';

interface SuperdailyPrintDocumentProps {
  report: SuperdailyReport;
  hiddenSectionKeys?: string[];
  hiddenTradeIds?: string[];
  splitByLocation?: boolean;
  locationFilter?: string;
}

export function SuperdailyPrintDocument({
  report,
  hiddenSectionKeys = [],
  hiddenTradeIds = [],
  splitByLocation = false,
  locationFilter = 'all',
}: SuperdailyPrintDocumentProps) {
  const isHidden = (key: string) => hiddenSectionKeys.includes(key);
  const visibleTrades = report.tradeSummaries
    .filter((t) => !hiddenTradeIds.includes(t.tradePartnerId))
    .filter((t) => {
      if (!locationFilter || locationFilter === 'all') return true;
      const loc = (t.locationDescription || 'Site General').trim().toLowerCase();
      return loc === locationFilter.trim().toLowerCase();
    });

  const locationGroups = (() => {
    const map = new Map<string, typeof visibleTrades>();
    for (const trade of visibleTrades) {
      const loc = (trade.locationDescription || 'Site General').trim() || 'Site General';
      const existing = map.get(loc) ?? [];
      existing.push(trade);
      map.set(loc, existing);
    }
    return Array.from(map.entries()).map(([location, trades]) => ({
      location,
      trades,
      workers: trades.reduce((sum, t) => sum + (t.workerCount || 0), 0),
      hours: trades.reduce((sum, t) => sum + (t.totalHours || 0), 0),
    }));
  })();

  return (
    <div
      className="superdaily-print-only hidden print:block text-[#333333] bg-white p-6 text-xs font-sans"
      style={{ fontFamily: 'var(--font-roboto), Roboto, -apple-system, sans-serif' }}
    >
      {/* Brand Header */}
      <div className="pb-2 mb-1 flex justify-between items-start">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hp-logo-std.png"
            alt="Hensel Phelps - Plan. Build. Manage."
            className="h-10 w-auto object-contain mb-1"
          />
          <div className="text-[10px] uppercase font-bold tracking-wider text-[#A6192E]">
            Daily Master Report · Superdaily
          </div>
          <h1 className="text-base font-bold text-[#333333] mt-0.5">{report.projectName}</h1>
          <p className="text-slate-500 text-[10px]">Project ID: {report.projectId}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-[#333333]">{report.date}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Generated: {new Date(report.generatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Dual Brand Horizon Stripe */}
      <div className="mb-4">
        <div data-brand="hp-horizon-red" className="h-[3px] bg-[#A6192E] w-full" />
        <div data-brand="hp-horizon-yellow" className="h-[2px] bg-[#F2A900] w-full" />
      </div>

      {/* Weather Strip */}
      {!isHidden('weather') && report.weather && (
        <div className="mb-4 p-2.5 bg-[#FAFAFA] border border-[#D0D3D4] rounded flex items-center justify-between text-[11px] break-inside-avoid">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[#333333]">Site Weather:</span>
            <span className="font-semibold text-slate-700">{report.weather.conditions}</span>
            <span className="px-1.5 py-0.5 rounded bg-[#FFFBEB] text-[#B87E00] font-semibold border border-[#F2A900]/40 text-[10px]">
              {report.weather.tempMax != null && report.weather.tempMin != null
                ? `High ${report.weather.tempMax}°F / Low ${report.weather.tempMin}°F`
                : `${report.weather.temp}°F`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-600 text-[10px]">
            <span>Wind: {report.weather.windVelocity} mph</span>
            <span>Humidity: {report.weather.humidity}%</span>
            {report.weather.rainfall > 0 && <span>Rain: {report.weather.rainfall.toFixed(2)} in.</span>}
            {report.weather.snowfall > 0 && <span>Snow: {report.weather.snowfall.toFixed(1)} in.</span>}
          </div>
        </div>
      )}

      {/* High-level metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-[#FAFAFA] border border-[#D0D3D4] rounded break-inside-avoid">
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Active Trades</span>
          <div className="text-base font-bold text-[#A6192E]">
            {report.activeTradeCount}
            <span className="text-[10px] text-slate-500 font-normal ml-1">
              of {report.expectedTradeCount || report.activeTradeCount} expected
            </span>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Workers</span>
          <div className="text-base font-bold text-[#333333]">{report.totalHeadcount}</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Man-Hours</span>
          <div className="text-base font-bold text-[#333333]">{report.totalManHours} hrs</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">STA Safety Status</span>
          <div className={`text-xs font-bold mt-1 ${report.safetyAndStas.allCompleted ? 'text-emerald-700' : 'text-[#A6192E]'}`}>
            {report.safetyAndStas.allCompleted ? '✓ All STAs Completed' : '⚠ Partial / Missing'}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {!isHidden('overview') && (
        <div className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#333333] border-l-[3px] border-[#A6192E] pl-2 pb-0.5 mb-1.5">
            Executive Site Summary
          </h2>
          <p className="text-[#333333] leading-relaxed text-[11px] whitespace-pre-wrap pl-2.5">
            {report.executiveSummary}
          </p>
        </div>
      )}

      {/* Missing Submissions Callout (Trades on Bowling Sheet without a Daily) */}
      {!isHidden('missing-trades') && report.missingTrades && report.missingTrades.length > 0 && (
        <div className="mb-4 p-2.5 bg-[#FFFDF5] border border-[#F2A900] rounded break-inside-avoid">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-[#946200] uppercase tracking-wide">
              Missing Submissions (On Bowling Sheet)
            </span>
            <span className="text-[10px] font-semibold text-[#946200]">
              {report.missingTrades.length} trade partner(s) not reported
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {report.missingTrades.map((m, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-white border border-[#F2A900]/60 text-[#333333] font-semibold text-[10px]"
              >
                {m.tradePartnerName}
                {m.category && <span className="text-slate-500 font-normal ml-1">({m.category})</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Subcontractor Work Breakdown */}
      {!isHidden('trades') && visibleTrades.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#333333] border-l-[3px] border-[#A6192E] pl-2 pb-0.5 mb-2">
            Trade Contractor Work & Field Activities
          </h2>
          {splitByLocation ? (
            <div className="space-y-4 pl-0.5">
              {locationGroups.map((group) => (
                <div key={group.location} className="space-y-2 break-inside-avoid">
                  <div className="flex items-center justify-between bg-[#FAFAFA] border border-[#D0D3D4] px-2.5 py-1.5 rounded">
                    <span className="font-bold text-[#A6192E] text-[11px] uppercase tracking-wide">
                      Location: {group.location}
                    </span>
                    <span className="text-[10px] text-slate-600 font-semibold">
                      {group.trades.length} trade(s) · {group.workers} workers · {group.hours} hrs
                    </span>
                  </div>
                  <div className="space-y-2 pl-2 border-l-2 border-[#D0D3D4]">
                    {group.trades.map((trade, idx) => (
                      <div
                        key={idx}
                        className="border border-[#D0D3D4] rounded p-2.5 bg-white break-inside-avoid"
                      >
                        <div className="flex items-center justify-between border-b border-[#D0D3D4] pb-1.5 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#333333] text-xs">{trade.tradePartnerName}</span>
                            {trade.category && (
                              <span className="px-1.5 py-0.5 rounded bg-[#D0D3D4]/40 text-[#333333] text-[9px] font-semibold">
                                {trade.category}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-slate-600 font-medium">
                            <span>Crew: <strong className="text-[#333333]">{trade.workerCount}</strong></span>
                            <span>Hours: <strong className="text-[#333333]">{trade.totalHours}</strong></span>
                            <span>
                              STA: {trade.staCompleted ? <strong className="text-emerald-700 font-bold">✓ Complete</strong> : <strong className="text-[#A6192E] font-bold">✗ Incomplete</strong>}
                            </span>
                          </div>
                        </div>

                        <div className="text-[10px] text-[#333333] mb-1.5">
                          <span className="font-semibold text-[#333333] mr-1">Location & Activities:</span>
                          <span className="text-slate-600 mr-2">[{trade.locationDescription}]</span>
                          <span className="leading-relaxed whitespace-pre-wrap">{trade.workPerformed}</span>
                        </div>

                        {trade.equipment.length > 0 && (
                          <div className="text-[9px] text-slate-500 flex items-center gap-1.5">
                            <span className="font-semibold text-slate-600">Equipment in Use:</span>
                            <span>{trade.equipment.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5 pl-0.5">
              {visibleTrades.map((trade, idx) => (
                <div
                  key={idx}
                  className="border border-[#D0D3D4] rounded p-2.5 bg-white break-inside-avoid"
                >
                  <div className="flex items-center justify-between border-b border-[#D0D3D4] pb-1.5 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#333333] text-xs">{trade.tradePartnerName}</span>
                      {trade.category && (
                        <span className="px-1.5 py-0.5 rounded bg-[#D0D3D4]/40 text-[#333333] text-[9px] font-semibold">
                          {trade.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-600 font-medium">
                      <span>Crew: <strong className="text-[#333333]">{trade.workerCount}</strong></span>
                      <span>Hours: <strong className="text-[#333333]">{trade.totalHours}</strong></span>
                      <span>
                        STA: {trade.staCompleted ? <strong className="text-emerald-700 font-bold">✓ Complete</strong> : <strong className="text-[#A6192E] font-bold">✗ Incomplete</strong>}
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#333333] mb-1.5">
                    <span className="font-semibold text-[#333333] mr-1">Location & Activities:</span>
                    <span className="text-slate-600 mr-2">[{trade.locationDescription}]</span>
                    <span className="leading-relaxed whitespace-pre-wrap">{trade.workPerformed}</span>
                  </div>

                  {trade.equipment.length > 0 && (
                    <div className="text-[9px] text-slate-500 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-600">Equipment in Use:</span>
                      <span>{trade.equipment.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Roadblocks & Delays */}
      {!isHidden('delays') && report.delaysAndRoadblocks.length > 0 && (
        <div className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#A6192E] border-b border-[#A6192E]/40 pb-1 mb-1.5">
            Reported Delays & Roadblocks
          </h2>
          <ul className="list-disc pl-4 space-y-1 text-[10px] text-[#A6192E]">
            {report.delaysAndRoadblocks.map((delay, idx) => (
              <li key={idx}>{delay}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety notes */}
      {!isHidden('safety') && (
        <div className="mb-6 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#333333] border-l-[3px] border-[#A6192E] pl-2 pb-0.5 mb-1">
            Safety & STA Summary
          </h2>
          <p className="text-[#333333] text-[10px] pl-2.5">{report.safetyAndStas.staNotes}</p>
        </div>
      )}

      {/* Signature & Sign-off footer */}
      <div className="pt-4 border-t border-[#D0D3D4] grid grid-cols-2 gap-8 break-inside-avoid text-[10px]">
        <div>
          <p className="text-slate-500 mb-6">Superintendent Sign-Off:</p>
          <div className="border-b border-[#333333] w-48 mb-1"></div>
          <p className="text-[#333333] font-semibold">Project Superintendent</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 mb-6">Date Verified:</p>
          <div className="border-b border-[#333333] w-32 ml-auto mb-1"></div>
          <p className="text-[#333333]">{report.date}</p>
        </div>
      </div>
    </div>
  );
}
