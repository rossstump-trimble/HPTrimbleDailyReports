"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

// Construction/jobsite photos for the mock camera roll
const CONSTRUCTION_PHOTOS = [
  "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=300&q=75",
  "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=300&q=75",
  "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&q=75",
  "https://images.unsplash.com/photo-1590644365607-87e9da7a5a31?w=300&q=75",
  "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=300&q=75",
  "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=300&q=75",
  "https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=300&q=75",
  "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=300&q=75",
  "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=300&q=75",
  "https://images.unsplash.com/photo-1536895058696-a69b1c7ba34f?w=300&q=75",
  "https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=300&q=75",
  "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=300&q=75",
  "https://images.unsplash.com/photo-1525785967371-87ba44b3e6cf?w=300&q=75",
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=300&q=75",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=300&q=75",
];

interface Props {
  onSelect: (photoUrl: string) => void;
  onCancel: () => void;
}

export default function MockPhotoPickerScreen({ onSelect, onCancel }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab]           = useState<"recents" | "albums">("recents");
  const [visible, setVisible]   = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const handleSelect = (idx: number) => setSelected(s => s === idx ? null : idx);

  const handleDone = () => {
    if (selected !== null) onSelect(CONSTRUCTION_PHOTOS[selected]);
  };

  return (
    <div
      className="absolute inset-0 z-40 flex flex-col bg-white dark:bg-gray-900"
      style={{
        transform: visible ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-none">
        <button onClick={onCancel} className="text-blue-600 dark:text-blue-400 text-sm font-medium">Cancel</button>
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Photos</h2>
        <button
          onClick={handleDone}
          disabled={selected === null}
          className={`text-sm font-semibold transition-opacity ${selected !== null ? "text-blue-600 dark:text-blue-400" : "text-blue-300 dark:text-blue-800"}`}
        >
          Done
        </button>
      </div>

      {/* Segment: Recents / Albums */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 flex-none">
        {(["recents", "albums"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === t ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400" : "text-gray-500 dark:text-gray-400"}`}
          >
            {t === "recents" ? "Recents" : "Albums"}
          </button>
        ))}
      </div>

      {tab === "recents" ? (
        /* Photo grid */
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-3 gap-px bg-gray-200 dark:bg-gray-800">
            {CONSTRUCTION_PHOTOS.map((src, i) => (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800"
              >
                <img
                  src={src}
                  alt={`Photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Selection overlay */}
                {selected === i && (
                  <div className="absolute inset-0 bg-black/20 flex items-start justify-end p-1.5">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow">
                      <Check size={14} className="text-white" strokeWidth={3} />
                    </div>
                  </div>
                )}
                {/* Unselected circle indicator when in selection mode */}
                {selected !== null && selected !== i && (
                  <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full border-2 border-white/80" />
                )}
              </button>
            ))}
          </div>
          <div className="h-6" />
        </div>
      ) : (
        /* Albums view */
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "Recents", count: 15, thumb: CONSTRUCTION_PHOTOS[0] },
              { name: "Favorites", count: 4, thumb: CONSTRUCTION_PHOTOS[2] },
              { name: "Construction Site", count: 9, thumb: CONSTRUCTION_PHOTOS[4] },
              { name: "Videos", count: 3, thumb: CONSTRUCTION_PHOTOS[6] },
            ].map(album => (
              <button key={album.name} onClick={() => setTab("recents")} className="text-left">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 mb-1.5">
                  <img src={album.thumb} alt={album.name} className="w-full h-full object-cover" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{album.name}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{album.count}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
