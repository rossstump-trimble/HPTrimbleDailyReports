import React from "react";
import { createRoot } from "react-dom/client";
import { ScreenCaptureOverlay } from "./ScreenCaptureOverlay";

export async function captureScreenshot(): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create container for React component
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);

      const cleanup = () => {
        root.unmount();
        document.body.removeChild(container);
      };

      // Render the React component
      root.render(
        <ScreenCaptureOverlay
          onCapture={(imageData: string) => {
            cleanup();
            resolve(imageData);
          }}
          onCancel={() => {
            cleanup();
            reject(new Error("Screenshot capture cancelled"));
          }}
        />
      );
    } catch (error) {
      reject(error);
    }
  });
}
