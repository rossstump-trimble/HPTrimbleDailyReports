import React from 'react';
import type { SuperdailyReport } from '@/types/superdaily';

interface SuperdailyPrintDocumentProps {
  report: SuperdailyReport;
  hiddenSectionKeys?: string[];
  hiddenTradeIds?: string[];
}

export function SuperdailyPrintDocument({
  report,
  hiddenSectionKeys = [],
  hiddenTradeIds = [],
}: SuperdailyPrintDocumentProps) {
  const isHidden = (key: string) => hiddenSectionKeys.includes(key);
  const visibleTrades = report.tradeSummaries.filter(
    (t) => !hiddenTradeIds.includes(t.tradePartnerId),
  );

  return (
    <div className="superdaily-print-only hidden print:block text-slate-900 bg-white p-6 font-sans text-xs">
      {/* Header */}
      <div className="border-b-2 border-slate-800 pb-3 mb-4 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-wider text-[#1b3a5c]">HENSEL PHELPS</span>
            <span className="text-slate-400">|</span>
            <span className="font-semibold text-xs text-slate-600">DAILY MASTER REPORT (SUPERDAILY)</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 mt-1">{report.projectName}</h1>
          <p className="text-slate-500 text-[11px]">Project ID: {report.projectId}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-slate-900">{report.date}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Generated: {new Date(report.generatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Weather Strip */}
      {!isHidden('weather') && report.weather && (
        <div className="mb-4 p-2.5 bg-sky-50 border border-sky-200 rounded flex items-center justify-between text-[11px] break-inside-avoid">
          <div className="flex items-center gap-3">
            <span className="font-bold text-sky-950">Site Weather:</span>
            <span className="font-semibold text-sky-900">{report.weather.conditions}</span>
            <span className="text-slate-600">
              {report.weather.tempMax != null && report.weather.tempMin != null
                ? `High ${report.weather.tempMax}°F / Low ${report.weather.tempMin}°F`
                : `${report.weather.temp}°F`}
            </span>
          </div>
          <div className="flex items-center gap-3 text-slate-600">
            <span>Wind: {report.weather.windVelocity} mph</span>
            <span>Humidity: {report.weather.humidity}%</span>
            {report.weather.rainfall > 0 && <span>Rain: {report.weather.rainfall.toFixed(2)} in.</span>}
            {report.weather.snowfall > 0 && <span>Snow: {report.weather.snowfall.toFixed(1)} in.</span>}
          </div>
        </div>
      )}

      {/* High-level metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-slate-50 border border-slate-200 rounded break-inside-avoid">
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Active Trades</span>
          <div className="text-base font-bold text-slate-800">
            {report.activeTradeCount}
            <span className="text-[10px] text-slate-500 font-normal ml-1">
              of {report.expectedTradeCount || report.activeTradeCount} expected
            </span>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Workers</span>
          <div className="text-base font-bold text-slate-800">{report.totalHeadcount}</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Man-Hours</span>
          <div className="text-base font-bold text-slate-800">{report.totalManHours} hrs</div>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">STA Safety Status</span>
          <div className={`text-xs font-bold mt-1 ${report.safetyAndStas.allCompleted ? 'text-emerald-700' : 'text-amber-700'}`}>
            {report.safetyAndStas.allCompleted ? '✓ All STAs Completed' : '⚠ Partial / Missing'}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      {!isHidden('overview') && (
        <div className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1.5">
            Executive Site Summary
          </h2>
          <p className="text-slate-800 leading-relaxed text-[11px] whitespace-pre-wrap">
            {report.executiveSummary}
          </p>
        </div>
      )}

      {/* Missing Submissions Callout (Trades on Bowling Sheet without a Daily) */}
      {!isHidden('missing-trades') && report.missingTrades && report.missingTrades.length > 0 && (
        <div className="mb-4 p-2.5 bg-amber-50 border border-amber-300 rounded break-inside-avoid">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
              Missing Submissions (On Bowling Sheet)
            </span>
            <span className="text-[10px] font-semibold text-amber-800">
              {report.missingTrades.length} trade partner(s) not reported
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {report.missingTrades.map((m, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded bg-white border border-amber-300 text-amber-950 font-semibold text-[10px]"
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
            Trade Contractor Work & Field Activities
          </h2>
          <div className="space-y-2.5">
            {visibleTrades.map((trade, idx) => (
              <div
                key={idx}
                className="border border-slate-200 rounded p-2.5 bg-slate-50/50 break-inside-avoid"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{trade.tradePartnerName}</span>
                    {trade.category && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-semibold">
                        {trade.category}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-600 font-medium">
                    <span>Crew: <strong className="text-slate-900">{trade.workerCount}</strong></span>
                    <span>Hours: <strong className="text-slate-900">{trade.totalHours}</strong></span>
                    <span>
                      STA: {trade.staCompleted ? <strong className="text-emerald-700 font-bold">✓ Complete</strong> : <strong className="text-amber-700 font-bold">✗ Incomplete</strong>}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] text-slate-700 mb-1.5">
                  <span className="font-semibold text-slate-900 mr-1">Location & Activities:</span>
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
      )}

      {/* Roadblocks & Delays */}
      {!isHidden('delays') && report.delaysAndRoadblocks.length > 0 && (
        <div className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-red-800 border-b border-red-200 pb-1 mb-1.5">
            Reported Delays & Roadblocks
          </h2>
          <ul className="list-disc pl-4 space-y-1 text-[10px] text-red-900">
            {report.delaysAndRoadblocks.map((delay, idx) => (
              <li key={idx}>{delay}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety notes */}
      {!isHidden('safety') && (
        <div className="mb-6 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1">
            Safety & STA Summary
          </h2>
          <p className="text-slate-700 text-[10px]">{report.safetyAndStas.staNotes}</p>
        </div>
      )}

      {/* Signature & Sign-off footer */}
      <div className="pt-4 border-t border-slate-300 grid grid-cols-2 gap-8 break-inside-avoid text-[10px]">
        <div>
          <p className="text-slate-500 mb-6">Superintendent Sign-Off:</p>
          <div className="border-b border-slate-400 w-48 mb-1"></div>
          <p className="text-slate-700 font-semibold">Project Superintendent</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 mb-6">Date Verified:</p>
          <div className="border-b border-slate-400 w-32 ml-auto mb-1"></div>
          <p className="text-slate-700">{report.date}</p>
        </div>
      </div>
    </div>
  );
}
