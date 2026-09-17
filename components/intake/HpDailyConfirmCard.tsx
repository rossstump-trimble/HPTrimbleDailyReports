"use client";

import React, { useRef } from "react";
import {
  Calendar,
  Camera,
  CheckCircle2,
  FileText,
  Handshake,
  Loader2,
  Send,
  ShieldCheck,
  Trash2,
  UploadCloud,
  User,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { DailyFormData } from "./DailyConfirmCard";

interface HpDailyConfirmCardProps {
  data: DailyFormData;
  onChange: (updater: (prev: DailyFormData) => DailyFormData) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  attachedFiles?: File[];
  onAttachedFilesChange?: (files: File[]) => void;
}

export default function HpDailyConfirmCard({
  data,
  onChange,
  onCancel,
  onSubmit,
  isSubmitting = false,
  attachedFiles = [],
  onAttachedFilesChange,
}: HpDailyConfirmCardProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = (field: keyof DailyFormData, value: unknown) => {
    onChange((prev) => ({
      ...prev,
      [field]: value,
      isHpEmployee: true,
      workerCount: 0,
      totalHours: 0,
      crewBreakdown: [],
      staCompleted: true,
    }));
  };

  const handleAddPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !onAttachedFilesChange) return;
    const newFiles = Array.from(e.target.files);
    onAttachedFilesChange([...attachedFiles, ...newFiles]);
    e.target.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    if (!onAttachedFilesChange) return;
    onAttachedFilesChange(attachedFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner: Direct to ProjectSight */}
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Zap size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-emerald-950 dark:text-emerald-100">
                Direct ProjectSight Dispatch
              </span>
              <Badge className="bg-emerald-600 text-white text-[10px] py-0 px-1.5 font-bold">
                Auto-Approved
              </Badge>
            </div>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300">
              No superintendent review required. Syncs straight to ProjectSight Daily Log.
            </p>
          </div>
        </div>
      </div>

      {/* Submitter & Date Info */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Submitter &amp; Shift Info
          </span>
          <span className="text-xs font-semibold text-[#0063a3] dark:text-blue-400">
            Hensel Phelps Staff
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Reporter / Submitter
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={data.submittedBy || ""}
                onChange={(e) => handleFieldChange("submittedBy", e.target.value)}
                placeholder="e.g. Ross Stump - Superintendent"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0063a3]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Report Date
            </label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="date"
                value={data.date || ""}
                onChange={(e) => handleFieldChange("date", e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0063a3]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Card 1: Site Walk Observations & Work Completed */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-[#0063a3] dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Site Walk Observations &amp; Work Progress
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Areas inspected, overall trade progress, ongoing activities across the project.
        </p>
        <textarea
          rows={4}
          value={data.locationDescription || ""}
          onChange={(e) => handleFieldChange("locationDescription", e.target.value)}
          placeholder="e.g. Walked Building B Level 2. Framing inspection passed. Drywall hanging ongoing in south corridor. MEP rough-in progressing on schedule."
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0063a3]"
        />
      </div>

      {/* Card 2: Trade Favors & Accommodations (HP Specific) */}
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Handshake size={18} />
            <h3 className="text-sm font-bold">Trades &amp; Favors Done for Partners</h3>
          </div>
          <Badge className="bg-amber-500 text-slate-950 font-bold text-[10px]">
            HP Special
          </Badge>
        </div>
        <p className="text-xs text-amber-900/80 dark:text-amber-300/80">
          Favors done for trade partners, staging areas allocated, equipment/crane time loaned, coordination concessions.
        </p>
        <textarea
          rows={3}
          value={data.tradesAndFavors || ""}
          onChange={(e) => handleFieldChange("tradesAndFavors", e.target.value)}
          placeholder="e.g. Loaned 19ft scissor lift to electrical sub for ceiling rough-in. Cleared loading dock bay 3 early for steel delivery."
          className="w-full p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      {/* Card 3: Delays, Safety, Weather & Quality Notes */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            Delays, Safety &amp; Field Notes
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Any trade partner delays, weather impacts, safety observations, or quality issues.
        </p>
        <textarea
          rows={3}
          value={data.notes || ""}
          onChange={(e) => handleFieldChange("notes", e.target.value)}
          placeholder="e.g. No safety incidents. Concrete delivery was 45 mins late due to interstate traffic, recovered by 3:00 PM."
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[#0063a3]"
        />
      </div>

      {/* Card 4: Field Photos & Documentation */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera size={16} className="text-[#0063a3] dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Site Photos &amp; Attachments
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {attachedFiles.length} {attachedFiles.length === 1 ? "file" : "files"}
          </span>
        </div>

        {/* Action buttons to snap photo or upload */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
          >
            <Camera size={16} className="text-[#0063a3]" />
            <span>Take Photo</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
          >
            <UploadCloud size={16} className="text-slate-600" />
            <span>Upload Files</span>
          </button>

          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleAddPhotos}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            multiple
            className="hidden"
            onChange={handleAddPhotos}
          />
        </div>

        {/* Thumbnail gallery */}
        {attachedFiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {attachedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Camera size={14} className="text-slate-400 shrink-0" />
                  <span className="truncate max-w-[160px] font-medium text-slate-800 dark:text-slate-200">
                    {file.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  className="p-1 text-slate-400 hover:text-red-500 transition"
                  aria-label="Remove photo"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating / Sticky Mobile Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 z-30 max-w-2xl mx-auto">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex-1 py-3.5 px-4 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 text-sm transition"
          style={{ backgroundColor: "#0063a3" }}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Sending to ProjectSight...</span>
            </>
          ) : (
            <>
              <Send size={16} />
              <span>Submit &amp; Sync to ProjectSight</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
