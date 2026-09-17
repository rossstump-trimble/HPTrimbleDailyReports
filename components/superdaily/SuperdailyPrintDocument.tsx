import React from 'react';
import type { SuperdailyReport } from '@/types/superdaily';

interface SuperdailyPrintDocumentProps {
  report: SuperdailyReport;
}

export function SuperdailyPrintDocument({ report }: SuperdailyPrintDocumentProps) {
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

      {/* High-level metrics */}
      <div className="grid grid-cols-4 gap-3 mb-4 p-3 bg-slate-50 border border-slate-200 rounded">
        <div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase">Active Trades</span>
          <div className="text-base font-bold text-slate-800">{report.activeTradeCount}</div>
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
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1.5">
          Executive Site Summary
        </h2>
        <p className="text-slate-800 leading-relaxed text-[11px] whitespace-pre-wrap">
          {report.executiveSummary}
        </p>
      </div>

      {/* Inter-Trade Coordination & Favors */}
      {report.interTradeFavors.length > 0 && (
        <div className="mb-4 break-inside-avoid">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1.5">
            Inter-Trade Coordination & Favors
          </h2>
          <div className="space-y-1.5">
            {report.interTradeFavors.map((favor, idx) => (
              <div
                key={idx}
                className="p-2 border border-slate-200 rounded bg-amber-50/40 text-[10px] flex items-start justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-slate-900">{favor.providingTrade}</span>
                  <span className="text-slate-500 mx-1.5">➔</span>
                  <span className="font-bold text-slate-900">{favor.receivingTrade}</span>
                  <p className="text-slate-700 mt-0.5">{favor.description}</p>
                </div>
                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
                  {favor.type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subcontractor Work Breakdown */}
      <div className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-2">
          Trade Breakdown & Activities
        </h2>
        <table className="w-full text-left border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-slate-300 bg-slate-100 text-slate-700">
              <th className="py-1 px-2 font-semibold">Subcontractor</th>
              <th className="py-1 px-2 font-semibold w-16 text-center">Crew</th>
              <th className="py-1 px-2 font-semibold w-16 text-center">Hours</th>
              <th className="py-1 px-2 font-semibold">Location & Work Performed</th>
              <th className="py-1 px-2 font-semibold w-24">Equipment</th>
              <th className="py-1 px-2 font-semibold w-16 text-center">STA</th>
            </tr>
          </thead>
          <tbody>
            {report.tradeSummaries.map((trade, idx) => (
              <tr key={idx} className="border-b border-slate-200 break-inside-avoid">
                <td className="py-1.5 px-2 font-bold text-slate-900 align-top">
                  {trade.tradePartnerName}
                </td>
                <td className="py-1.5 px-2 text-center text-slate-800 align-top">
                  {trade.workerCount}
                </td>
                <td className="py-1.5 px-2 text-center text-slate-800 align-top">
                  {trade.totalHours}
                </td>
                <td className="py-1.5 px-2 text-slate-800 align-top">
                  <div className="font-semibold text-slate-600 mb-0.5">{trade.locationDescription}</div>
                  <div className="whitespace-pre-wrap">{trade.workPerformed}</div>
                </td>
                <td className="py-1.5 px-2 text-slate-600 align-top">
                  {trade.equipment.length > 0 ? trade.equipment.join(', ') : '—'}
                </td>
                <td className="py-1.5 px-2 text-center align-top">
                  {trade.staCompleted ? (
                    <span className="text-emerald-700 font-bold">✓</span>
                  ) : (
                    <span className="text-amber-600 font-bold">✗</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Roadblocks & Delays */}
      {report.delaysAndRoadblocks.length > 0 && (
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
      <div className="mb-6 break-inside-avoid">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1 mb-1">
          Safety & STA Summary
        </h2>
        <p className="text-slate-700 text-[10px]">{report.safetyAndStas.staNotes}</p>
      </div>

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
