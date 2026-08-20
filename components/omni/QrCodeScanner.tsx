import React, { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import jsQR from "jsqr";

interface QrCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
}

export function QrCodeScanner({ isOpen, onClose, onScan }: QrCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string>("");
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          setError("");
        }
      } catch (err) {
        setError(
          "Unable to access camera. Please ensure you have granted permission."
        );
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      // Cleanup: stop all video streams when component unmounts
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!hasPermission || !isOpen) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const scanQRCode = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw current video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get image data for QR code scanning
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          // QR code found!
          onScan(code.data);
          return; // Stop scanning
        }
      }

      // Continue scanning
      animationFrameId = requestAnimationFrame(scanQRCode);
    };

    scanQRCode();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [hasPermission, isOpen, onScan]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <div className="relative">
          {/* <Button
            variant="ghost"
            className="absolute right-2 top-2 z-10"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button> */}

          <div className="flex flex-col items-center justify-center p-6">
            {error ? (
              <div className="text-destructive text-center">{error}</div>
            ) : (
              <>
                <div className="relative w-full aspect-square max-w-sm bg-muted rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute inset-0 border-2 border-primary opacity-50">
                    <div className="absolute inset-0 border-4 border-primary/20" />
                    <div className="absolute left-0 top-0 w-16 h-16 border-l-4 border-t-4 border-primary" />
                    <div className="absolute right-0 top-0 w-16 h-16 border-r-4 border-t-4 border-primary" />
                    <div className="absolute left-0 bottom-0 w-16 h-16 border-l-4 border-b-4 border-primary" />
                    <div className="absolute right-0 bottom-0 w-16 h-16 border-r-4 border-b-4 border-primary" />
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground text-center">
                  Position the QR code within the frame to scan
                </p>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
