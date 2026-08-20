"use client";

import { useState } from "react";
import { ChevronDown, Info, KeyRound, Pencil, X } from "lucide-react";

interface Props {
  onBack: () => void;
}

const COUNTRIES = ["United States", "Canada", "United Kingdom", "Australia"];
const STATES = ["California", "New York", "Texas", "Florida", "Washington"];
const LANGUAGES = ["English (United States)", "English (United Kingdom)", "Spanish", "French"];
const TIMEZONES = [
  "(GMT-08:00) Los Angeles, United Sta…",
  "(GMT-07:00) Denver, United States",
  "(GMT-06:00) Chicago, United States",
  "(GMT-05:00) New York, United States",
];

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <div className="relative">
        <select
          className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 appearance-none focus:outline-none focus:border-blue-500 pr-8"
          value={value}
          onChange={e => onChange(e.target.value)}
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  required,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 focus:outline-none focus:border-blue-500"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

export default function MyProfileScreen({ onBack }: Props) {
  const [firstName, setFirstName] = useState("Jesse");
  const [lastName, setLastName] = useState("Lavine");
  const [country, setCountry] = useState("United States");
  const [state, setState] = useState("California");
  const [language, setLanguage] = useState("English (United States)");
  const [timezone, setTimezone] = useState("(GMT-08:00) Los Angeles, United Sta…");
  const [dirty, setDirty] = useState(false);

  const handleField = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setDirty(true);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden relative bg-gray-100 dark:bg-gray-950">
      {/* App header */}
      <header className="flex items-center px-3 py-3 flex-none" style={{ backgroundColor: "#1b3a5c" }}>
        <button className="text-white p-1 mr-3">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-white font-semibold text-base flex-1">My Profile</h1>
        <button onClick={onBack} className="text-white p-1"><X size={20} /></button>
      </header>

      {/* Trimble site header */}
      <div className="flex items-center px-4 py-2.5 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-none">
        <img src="/images/trimble-logo.png" alt="Trimble" className="h-7 w-auto flex-1" />
        <span className="text-sm font-bold tracking-widest text-gray-700 dark:text-gray-200 flex-1 text-center">MY PROFILE</span>
        <div className="flex-1 flex justify-end">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6b7280" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Cancel / Save row */}
      <div className="flex items-center justify-end gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-none">
        <button
          className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-300 rounded"
          onClick={onBack}
        >
          Cancel
        </button>
        <button
          className={`px-4 py-1.5 text-sm rounded font-medium ${dirty ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500"}`}
          onClick={() => { setDirty(false); }}
        >
          Save
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">

        {/* Basic information */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">Basic information</h2>

          {/* Avatar */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                <img
                  src="https://i.pravatar.cc/80?img=11"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center border-2 border-white dark:border-gray-900">
                <Pencil size={11} className="text-white" />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <TextField label="First Name" value={firstName} required onChange={handleField(setFirstName)} />
            <TextField label="Last Name" value={lastName} required onChange={handleField(setLastName)} />
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">Preferences</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Country or Region</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base">🇺🇸</span>
                <select
                  className="w-full border border-gray-300 dark:border-gray-700 rounded px-3 py-2.5 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 appearance-none focus:outline-none focus:border-blue-500 pl-9 pr-8"
                  value={country}
                  onChange={e => { setCountry(e.target.value); setDirty(true); }}
                >
                  {COUNTRIES.map(o => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
              </div>
            </div>
            <SelectField label="State or Province" value={state} options={STATES} onChange={handleField(setState)} />
            <SelectField label="Language" value={language} options={LANGUAGES} onChange={handleField(setLanguage)} />
            <SelectField label="Time Zone" value={timezone} options={TIMEZONES} onChange={handleField(setTimezone)} />
          </div>
        </div>

        {/* Account management */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">Account management</h2>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1 mt-3">Accounts</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Switch between your accounts to access different products and services.</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold text-gray-800 dark:text-gray-100">AECO - Viewpoint - 254</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-600 text-white">Default</span>
          </div>
          <button className="text-sm text-blue-600 dark:text-blue-400 font-medium">Switch account</button>
        </div>

        {/* Profile details */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Profile details</h2>
          <div className="flex gap-3 p-3 border border-blue-500 dark:border-blue-800 rounded-lg bg-blue-50 dark:bg-blue-950/30">
            <Info size={18} className="text-blue-600 dark:text-blue-400 flex-none mt-0.5" />
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
              If you need to change your email address, password, or make changes to your account, please contact your administrator.
            </p>
          </div>
        </div>

        {/* Sign-in and security */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2">Sign-in and security</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-1">
            Secure your account with an extra layer of protection. Add one or more methods below to verify your identity when you sign in.{" "}
            <span className="text-blue-600 dark:text-blue-400">Learn more about securing your account</span>
          </p>

          {/* Passkeys card */}
          <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound size={20} className="text-gray-600 dark:text-gray-300" />
              <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Passkeys</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Recommended</span>
            </div>
            <button className="w-full py-2.5 border border-blue-600 dark:border-blue-500 rounded text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 mb-3">
              Create
            </button>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Sign in faster and more securely with passkeys. Passkeys replace passwords with your fingerprint, face ID, or device screen lock, making sign in simple and safe.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pb-4">
          <p className="text-center text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
            Help | Privacy Notice | Terms of Use | CA Notice at Collection | Your Privacy Choices (US)
          </p>
          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-1">©2026, Trimble Inc. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
