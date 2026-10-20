"use client";

import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrCodeViewProps {
  url: string;
  size?: number;
  showUrl?: boolean;
  showActions?: boolean;
  className?: string;
}

export default function QrCodeView({
  url,
  size = 140,
  showUrl = true,
  showActions = true,
  className = "",
}: QrCodeViewProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      width: size * 2,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((res) => {
        if (!cancelled) setDataUrl(res);
      })
      .catch((err) => console.error("[QRCode error]", err));

    return () => {
      cancelled = true;
    };
  }, [url, size]);

  const copyLink = async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
        } catch (e) {
          console.warn("[execCommand copy failed]", e);
        }
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[copy failed]", err);
    }
  };

  const downloadQr = () => {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "intake-qr-code.png";
    a.click();
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="bg-white p-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-center">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={dataUrl}
            alt={`QR code for ${url}`}
            style={{ width: size, height: size }}
            className="rounded"
          />
        ) : (
          <div
            style={{ width: size, height: size }}
            className="flex items-center justify-center text-xs text-muted-foreground animate-pulse"
          >
            Generating…
          </div>
        )}
      </div>

      {showUrl && (
        <p
          className="text-[11px] text-muted-foreground text-center max-w-[200px] truncate font-mono"
          title={url}
        >
          {url}
        </p>
      )}

      {showActions && (
        <div className="flex items-center gap-1.5 pt-1">
          <button
            type="button"
            className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition shadow-sm"
            onClick={copyLink}
          >
            {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? "Copied" : "Copy Link"}</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1 h-7 px-2.5 text-xs font-semibold rounded-lg border border-border bg-background hover:bg-muted text-foreground transition shadow-sm"
            onClick={downloadQr}
          >
            <Download className="h-3 w-3" />
            <span>Save QR</span>
          </button>
        </div>
      )}
    </div>
  );
}
