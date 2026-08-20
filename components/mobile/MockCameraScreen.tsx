"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Zap, ZapOff, RefreshCw, Settings2 } from "lucide-react";

// Jobsite photos used as mock camera viewfinder
const VIEWFINDER_PHOTOS = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&q=80",
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=600&q=80",
  "https://images.unsplash.com/photo-1590644365607-87e9da7a5a31?w=600&q=80",
  "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=600&q=80",
];

// Thumbnail grid for the camera roll preview strip
const ROLL_THUMBS = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=120&q=70",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=120&q=70",
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=120&q=70",
];

interface Props {
  onCapture: () => void;
  onCancel: () => void;
}

export default function MockCameraScreen({ onCapture, onCancel }: Props) {
  const [flash,     setFlash]     = useState(false);
  const [photoIdx,  setPhotoIdx]  = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [visible,   setVisible]   = useState(false);

  // Slide up on mount
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const handleCapture = useCallback(() => {
    setCapturing(true);
    // Brief white flash then navigate
    setTimeout(() => {
      setCapturing(false);
      onCapture();
    }, 350);
  }, [onCapture]);

  const handleFlip = () => setPhotoIdx(i => (i + 1) % VIEWFINDER_PHOTOS.length);

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col bg-black"
      style={{
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Viewfinder */}
      <div className="flex-1 relative overflow-hidden">
        <img
          src={VIEWFINDER_PHOTOS[photoIdx]}
          alt="Viewfinder"
          className="w-full h-full object-cover"
          style={{ filter: "brightness(0.88)" }}
        />

        {/* Capture flash overlay */}
        {capturing && (
          <div className="absolute inset-0 bg-white animate-pulse" style={{ opacity: 0.85 }} />
        )}

        {/* Focus reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 border-2 border-yellow-400 opacity-70" style={{ borderRadius: 2 }}>
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-yellow-400 -translate-x-px -translate-y-px" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-yellow-400 translate-x-px -translate-y-px" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-yellow-400 -translate-x-px translate-y-px" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-yellow-400 translate-x-px translate-y-px" />
          </div>
        </div>

        {/* Top controls */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-4 pb-3"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)" }}>
          <button onClick={onCancel} className="text-white p-1">
            <X size={26} />
          </button>
          <button onClick={() => setFlash(f => !f)} className="text-white p-1">
            {flash ? <Zap size={24} className="text-yellow-300 fill-yellow-300" /> : <ZapOff size={24} />}
          </button>
          <button className="text-white p-1 opacity-60">
            <Settings2 size={22} />
          </button>
        </div>

        {/* Mode labels */}
        <div className="absolute bottom-0 left-0 right-0 pb-3 flex items-center justify-center gap-6 text-xs text-white/60"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)" }}>
          <span>VIDEO</span>
          <span className="text-white font-semibold text-sm">PHOTO</span>
          <span>PORTRAIT</span>
        </div>
      </div>

      {/* Bottom control strip */}
      <div className="flex-none bg-black px-6 pt-4 pb-8 flex items-center justify-between">
        {/* Camera roll thumbnail */}
        <button className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/30">
          <img src={ROLL_THUMBS[0]} alt="Last photo" className="w-full h-full object-cover" />
        </button>

        {/* Shutter button */}
        <button
          onClick={handleCapture}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
        >
          <div className="w-16 h-16 rounded-full bg-white" />
        </button>

        {/* Flip camera */}
        <button onClick={handleFlip} className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
          <RefreshCw size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
}
