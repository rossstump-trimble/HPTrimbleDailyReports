/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

export type GetAudioContextOptions = AudioContextOptions & {
  id?: string;
};

const map: Map<string, AudioContext> = new Map();

// Wrap the immediate execution in a check for the browser environment
const getDidInteractPromise = () => {
  if (typeof window !== "undefined") {
    return new Promise<void>((res) => {
      window.addEventListener("pointerdown", () => res(), { once: true });
      window.addEventListener("keydown", () => res(), { once: true });
    });
  } else {
    // Return a promise that never resolves on the server
    return new Promise<void>(() => {});
  }
};

export const audioContext: (
  options?: GetAudioContextOptions
) => Promise<AudioContext> = async (options?: GetAudioContextOptions) => {
  // Ensure this code only runs client-side
  if (typeof window === "undefined" || typeof AudioContext === "undefined") {
    // Return a promise that never resolves or throws if called server-side unexpectedly
    // Or simply return a placeholder if necessary, although AudioContext needs the browser.
    console.warn(
      "AudioContext called on the server. This should not happen during rendering."
    );
    // Returning a never-resolving promise to avoid breaking SSR further down the line
    // if the caller expects a promise. Adjust if a specific error is better.
    return new Promise<AudioContext>(() => {});
  }

  const didInteract = getDidInteractPromise();

  try {
    // Check if AudioContext exists before creating
    if (typeof AudioContext !== "undefined") {
      const a = new Audio();
      a.src =
        "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA";
      // Play requires user interaction, but attempting it helps check context status
      try {
        await a.play();
      } catch (playError) {
        // Ignore play error if it happens before interaction
      }
    }

    if (options?.id && map.has(options.id)) {
      const ctx = map.get(options.id);
      if (ctx) {
        return ctx;
      }
    }
    const ctx = new AudioContext(options);
    if (options?.id) {
      map.set(options.id, ctx);
    }
    return ctx;
  } catch (e) {
    await didInteract; // Wait for interaction if initial attempt failed
    if (options?.id && map.has(options.id)) {
      const ctx = map.get(options.id);
      if (ctx) {
        return ctx;
      }
    }
    // Ensure AudioContext exists before creating after interaction
    if (typeof AudioContext !== "undefined") {
      const ctx = new AudioContext(options);
      if (options?.id) {
        map.set(options.id, ctx);
      }
      return ctx;
    } else {
      // Handle case where AudioContext is still not available (should be rare in modern browsers)
      throw new Error("AudioContext is not supported in this environment.");
    }
  }
};

export const blobToJSON = (blob: Blob): Promise<unknown> =>
  new Promise((resolve, reject) => {
    // Ensure FileReader is available (browser only)
    if (typeof FileReader === "undefined") {
      console.error("FileReader API not available.");
      return reject(new Error("FileReader not available"));
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        try {
          const json = JSON.parse(reader.result as string);
          resolve(json);
        } catch (parseError) {
          reject(new Error("Failed to parse Blob content as JSON"));
        }
      } else {
        reject(new Error("Failed to read Blob content"));
      }
    };
    reader.onerror = () => {
      reject(new Error("Error reading Blob"));
    };
    reader.readAsText(blob);
  });

export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  // Ensure atob is available (browser only)
  if (typeof atob === "undefined") {
    console.error("atob function not available.");
    // Handle server-side or environment without atob, e.g., return empty buffer or throw
    if (typeof Buffer !== "undefined") {
      // Node.js environment
      return Buffer.from(base64, "base64").buffer;
    } else {
      throw new Error("atob not available and not in Node.js environment");
    }
  }
  var binaryString = atob(base64);
  var bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
