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

import { audioContext } from "./live-api/utils";
import AudioRecordingWorklet from "./worklets/audio-processing";
import VolMeterWorket from "./worklets/vol-meter";

import { createWorketFromSrc } from "./audioworklet-registry";
import EventEmitter from "eventemitter3";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = "";
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export class AudioRecorder extends EventEmitter {
  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;

  private starting: Promise<void> | null = null;
  private stopping: boolean = false;
  private processorOptions = {
    numberOfInputs: 1,
    numberOfOutputs: 1,
    channelCount: 1,
    processorOptions: {
      sampleRate: 16000,
    },
  };

  constructor(public sampleRate = 16000) {
    super();
  }

  async start() {
    if (this.recording || this.starting) {
      console.warn("AudioRecorder is already starting or recording");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("Could not request user media");
    }

    this.stopping = false;
    this.starting = new Promise(async (resolve, reject) => {
      try {
        // Request microphone access with specific constraints
        this.stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: this.sampleRate,
          },
        });

        // Create and resume audio context
        this.audioContext = await audioContext({ sampleRate: this.sampleRate });
        if (this.audioContext.state === "suspended") {
          await this.audioContext.resume();
        }

        // Create source node
        this.source = this.audioContext.createMediaStreamSource(this.stream);

        // Add recording worklet
        const workletName = "audio-recorder-worklet";
        const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

        try {
          await this.audioContext.audioWorklet.addModule(src);
        } catch (error) {
          console.error("Failed to load audio recording worklet:", error);
          throw new Error("Failed to initialize audio processing");
        }

        // Create recording worklet with specific options
        this.recordingWorklet = new AudioWorkletNode(
          this.audioContext,
          workletName,
          this.processorOptions
        );

        // Set up recording worklet message handling
        this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
          if (this.stopping) return;

          try {
            const arrayBuffer = ev.data.data.int16arrayBuffer;
            if (arrayBuffer) {
              const arrayBufferString = arrayBufferToBase64(arrayBuffer);
              this.emit("data", arrayBufferString);
            }
          } catch (error) {
            console.error("Error processing audio data:", error);
          }
        };

        // Set up error handling for recording worklet
        this.recordingWorklet.onprocessorerror = (event) => {
          console.error("Audio recording processor error:", event);
          this.emit("error", new Error("Audio processing error"));
        };

        // Connect recording worklet and ensure it's not bypassed
        this.source.connect(this.recordingWorklet);
        this.recordingWorklet.connect(this.audioContext.destination);

        // Add VU meter worklet
        const vuWorkletName = "vu-meter";
        try {
          await this.audioContext.audioWorklet.addModule(
            createWorketFromSrc(vuWorkletName, VolMeterWorket)
          );
        } catch (error) {
          console.error("Failed to load VU meter worklet:", error);
          // Don't fail the whole recording if VU meter fails
        }

        if (!this.stopping) {
          this.vuWorklet = new AudioWorkletNode(
            this.audioContext,
            vuWorkletName,
            this.processorOptions
          );

          this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
            if (this.stopping) return;
            this.emit("volume", ev.data.volume);
          };

          // Connect VU meter worklet
          this.source.connect(this.vuWorklet);
        }

        // Verify audio is flowing
        if (!this.source.mediaStream.active) {
          throw new Error("Audio stream is not active");
        }

        // Set recording state
        this.recording = true;
        resolve();
      } catch (error) {
        console.error("Failed to start audio recording:", error);
        await this.cleanup();
        reject(error);
      } finally {
        this.starting = null;
      }
    });

    return this.starting;
  }

  async stop() {
    this.stopping = true;

    // Wait for any pending start operation
    if (this.starting) {
      try {
        await this.starting;
      } catch {
        // Ignore errors from starting since we're stopping anyway
      }
    }

    await this.cleanup();
  }

  private async cleanup() {
    try {
      // Disconnect and cleanup audio nodes
      if (this.source) {
        this.source.disconnect();
        this.source = undefined;
      }

      if (this.recordingWorklet) {
        this.recordingWorklet.disconnect();
        this.recordingWorklet.port.close();
        this.recordingWorklet = undefined;
      }

      if (this.vuWorklet) {
        this.vuWorklet.disconnect();
        this.vuWorklet.port.close();
        this.vuWorklet = undefined;
      }

      // Stop all media tracks
      if (this.stream) {
        const tracks = this.stream.getTracks();
        await Promise.all(
          tracks.map(async (track) => {
            track.stop();
            this.stream?.removeTrack(track);
          })
        );
        this.stream = undefined;
      }

      // Close audio context
      if (this.audioContext && this.audioContext.state !== "closed") {
        await this.audioContext.close();
      }
      this.audioContext = undefined;

      // Reset state
      this.recording = false;
      this.stopping = false;
    } catch (error) {
      console.error("Error during audio cleanup:", error);
    }
  }
}
