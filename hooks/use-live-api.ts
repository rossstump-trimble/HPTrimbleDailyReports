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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MultimodalLiveAPIClientConnection,
  MultimodalLiveClient,
} from "@/lib/multimodal-live-client";
import {
  LiveConfig,
  LiveFunctionCall,
  ToolCall,
} from "@/multimodal-live-types";
import { AudioStreamer } from "@/lib/audio-streamer";
import { audioContext } from "@/lib/live-api/utils";
import VolMeterWorket from "@/lib/worklets/vol-meter";
import { SchemaType, FunctionDeclaration } from "@google/generative-ai";

export type UseLiveAPIResults = {
  client: MultimodalLiveClient;
  setConfig: (config: LiveConfig) => void;
  config: LiveConfig;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  volume: number;
};

// Define the function declaration for the send_email tool
const sendEmailFunctionDeclaration: FunctionDeclaration = {
  name: "send_email",
  description:
    "Sends an email to a predefined recipient using a template. Requires email subject, the recipient's full name for personalization, and a description for the email body.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      subject: {
        type: SchemaType.STRING,
        description: "The subject line of the email.",
      },
      fullName: {
        type: SchemaType.STRING,
        description:
          "The full name of the primary recipient, used for personalizing the email content.",
      },
      description: {
        type: SchemaType.STRING,
        description: "The main content/body of the email.",
      },
    },
    required: ["subject", "fullName", "description"],
  },
};

export function useLiveAPI({
  url,
  apiKey,
}: MultimodalLiveAPIClientConnection): UseLiveAPIResults {
  const client = useMemo(
    () => new MultimodalLiveClient({ url, apiKey }),
    [url, apiKey]
  );
  const audioStreamerRef = useRef<AudioStreamer | null>(null);

  const [connected, setConnected] = useState(false);
  const [config, setConfig] = useState<LiveConfig>({
    model: "models/gemini-2.0-flash-live-001",
    systemInstruction: {
      parts: [
        {
          text: `
          **--- Persona & Role ---**

* **You are:** Your name is Adam a professional, a curious and helpful AI assistant integrated *exclusively* within the Project Sight application. Occasionally introduce yourself as Adam the AI Assistant. When users asks for your name ask them to provide their name.
* **Your Goal:** Assist users effectively with the Project Sight application.
* **Your Tone:** Keep your responses short and concise. Maintain a natural, friendly tone. Use precise Project Sight terminology.
* **User Context:** Assume the user is always interacting with you via the Project Sight application.

**--- Core Task & Scope ---**

* **Information Source:** For questions about *how to use Project Sight*, *always* use the search tool to ensure information is up-to-date and accurate. Do not ask the user for permission; perform the search automatically for this specific purpose.
* **Off-Topic Inquiries:** Politely decline any inquiries not related to Project Sight or its direct functionalities.

**--- Interaction Rules & Workflow ---**

* **Acknowledge & Clarify:** Acknowledge user requests clearly. Clarify if the request is ambiguous before proceeding.
* **Provide Information:** Deliver relevant Project Sight information or feedback based on your knowledge and search results, keep it short and concise.
* **Step-by-Step Guidance:** *Before* providing detailed step-by-step instructions, *always* ask the user if they would like to receive the steps.
* **Follow-Up:** After providing information, check if the user has further questions or needs more details.
* **Feature Requests:** If a user mentions a feature or functionality that Project Sight doesn't currently support, ask if they would like you to forward it as a feature request to the Trimble Product Management Team.
* **Processing Signals:** Briefly signal when you are processing complex requests or searching for information (e.g., "Okay, let me look that up for you.").
* **User Name Usage:** If user name is provided, use it in your responses.

**--- Capabilities ---**

* Communicate via audio.
* Analyze single-page screen shares of the Project Sight interface, workflow and provide feedback. *State that screen share analysis is currently limited to single pages due to preview status.*
* Analyze webcam input (if provided by the user) and offer relevant insights related to the Project Sight context.

**--- Important Context & Disclaimers ---**

* **Preview Status:** Inform users that you are currently in an early preview stage and may occasionally make mistakes.
* **Creator & Feedback:** Mention you were created by Julian Oczkowski Product Design Lead and that feedback is welcome and can be sent directly to him.

**--- Constraints ---**

* Do not answer questions outside the scope of Project Sight.
* Do not perform actions outside the Project Sight application.
* Prioritize information retrieved via the search tool for Project Sight procedures over potentially outdated internal knowledge.
* **Caution:** Avoid including sensitive or confidential information directly within these instructions.
          
          `,
        },
      ],
    },
    tools: [
      {
        googleSearch: {},
      },
      // Add the send_email function declaration
      {
        functionDeclarations: [sendEmailFunctionDeclaration],
      },
      // Additional function declarations can be added here as needed
      // Example:
      // {
      //   functionDeclarations: [customFunctionDeclaration]
      // }
    ],
  });
  const [volume, setVolume] = useState(0);

  // register audio for streaming server -> speakers
  useEffect(() => {
    if (!audioStreamerRef.current) {
      audioContext({ id: "audio-out" }).then((audioCtx: AudioContext) => {
        audioStreamerRef.current = new AudioStreamer(audioCtx);
        audioStreamerRef.current
          .addWorklet<any>("vumeter-out", VolMeterWorket, (ev: any) => {
            setVolume(ev.data.volume);
          })
          .then(() => {
            // Successfully added worklet
          });
      });
    }
  }, [audioStreamerRef]);

  useEffect(() => {
    const onClose = () => {
      setConnected(false);
    };

    const stopAudioStreamer = () => audioStreamerRef.current?.stop();

    const onAudio = (data: ArrayBuffer) =>
      audioStreamerRef.current?.addPCM16(new Uint8Array(data));

    // Handler for tool calls from the AI
    const handleToolCall = async (toolCall: ToolCall) => {
      for (const fc of toolCall.functionCalls) {
        if (fc.name === "send_email") {
          try {
            const args = fc.args as {
              subject: string;
              fullName: string;
              description: string;
            };
            client.log(
              "client.toolCallHandling",
              `Attempting to send email with args: ${JSON.stringify(args)}`
            );

            const apiResponse = await fetch("/api/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(args),
            });

            const resultData = await apiResponse.json();

            if (!apiResponse.ok) {
              client.log(
                "client.toolCallError",
                `API responded with error: ${apiResponse.status} - ${JSON.stringify(resultData)}`
              );
              throw new Error(
                resultData.error ||
                  `Failed to send email: ${apiResponse.statusText}`
              );
            }

            client.sendToolResponse({
              functionResponses: [
                {
                  id: fc.id,
                  response: { success: true, data: resultData },
                },
              ],
            });
            client.log(
              "client.toolResponse",
              `Sent email successfully: ${JSON.stringify(resultData)} (ID: ${fc.id})`
            );
          } catch (error: any) {
            client.log(
              "client.toolCallError",
              `Error sending email: ${error.message} (ID: ${fc.id})`
            );
            client.sendToolResponse({
              functionResponses: [
                {
                  id: fc.id,
                  response: {
                    success: false,
                    error:
                      error.message ||
                      "Unknown error processing send_email tool call",
                  },
                },
              ],
            });
          }
        }
        // Potentially handle other tool calls here
      }
    };

    client
      .on("close", onClose)
      .on("interrupted", stopAudioStreamer)
      .on("audio", onAudio)
      .on("toolcall", handleToolCall); // Add the toolcall handler

    return () => {
      client
        .off("close", onClose)
        .off("interrupted", stopAudioStreamer)
        .off("audio", onAudio)
        .off("toolcall", handleToolCall); // Clean up the toolcall handler
    };
  }, [client]);

  const connect = useCallback(async () => {
    console.log(config);
    if (!config) {
      throw new Error("config has not been set");
    }
    client.disconnect();
    await client.connect(config);
    setConnected(true);
  }, [client, setConnected, config]);

  const disconnect = useCallback(async () => {
    audioStreamerRef.current?.stop();
    client.disconnect();
    setConnected(false);
  }, [setConnected, client, audioStreamerRef]);

  return {
    client,
    config,
    setConfig,
    connected,
    connect,
    disconnect,
    volume,
  };
}
