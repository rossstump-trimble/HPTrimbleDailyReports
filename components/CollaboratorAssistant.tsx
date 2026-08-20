import { useEffect, useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Mic,
  ScreenShare,
  Webcam,
  Play,
  Pause,
  MicOff,
  ScreenShareOff,
  CameraOff,
} from "lucide-react";
import { useLiveAPIContext } from "@/contexts/LiveAPIContext";
import { useWebcam } from "@/hooks/use-webcam";
import { useScreenCapture } from "@/hooks/use-screen-capture";
import { AudioRecorder } from "@/lib/audio-recorder";
import { cn } from "@/lib/utils";
import { useCollaborator } from "@/contexts/CollaboratorContext";
import { AudioPulse } from "@/components/ui/audio-pulse";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Import the constant from CollaboratorContext
const SCREEN_STATE_KEY = "collaborator-screen-state";

export default function CollaboratorAssistant() {
  // --- Get state from context ---
  const {
    isSessionActive,
    setIsSessionActive,
    isMicOn,
    setIsMicOn,
    isWebcamOn,
    setIsWebcamOn,
    isScreenSharingOn,
    setIsScreenSharingOn,
    inVolume,
    setInVolume,
    outVolume,
    setOutVolume,
    activeVideoStream,
    setActiveVideoStream,
    handleMediaStreamToggle,
  } = useCollaborator();

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);

  // --- Hooks ---
  const {
    client,
    connected,
    connect,
    disconnect,
    volume: liveAPIVolume,
  } = useLiveAPIContext();
  const webcam = useWebcam();
  const screenCapture = useScreenCapture();

  // Add state for AI speaking status with debounce
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVolumeRef = useRef<number>(0);
  const consecutiveVolumeChecksRef = useRef(0);

  // Higher threshold for detecting actual speech
  const AI_SPEAKING_THRESHOLD = 0.03;
  const SPEAKING_TIMEOUT_MS = 400; // Longer timeout creates more stability

  // --- Update outVolume and detect AI speaking with debounce ---
  useEffect(() => {
    if (connected && isSessionActive) {
      setOutVolume(liveAPIVolume);

      // Detect start of speaking - we need a significant volume
      if (liveAPIVolume > AI_SPEAKING_THRESHOLD && !isAISpeaking) {
        // If volume is above threshold, increment counter
        consecutiveVolumeChecksRef.current += 1;

        // Require at least 2 consecutive checks above threshold to prevent false starts
        if (consecutiveVolumeChecksRef.current >= 2) {
          setIsAISpeaking(true);
          consecutiveVolumeChecksRef.current = 0;
        }
      }
      // Detect continued speaking or end of speaking
      else if (isAISpeaking) {
        // Clear any existing timeout
        if (speakingTimeoutRef.current) {
          clearTimeout(speakingTimeoutRef.current);
        }

        // If volume drops below threshold, set timeout to end speaking state
        // This creates a debounce effect to prevent flickering
        if (liveAPIVolume <= AI_SPEAKING_THRESHOLD) {
          speakingTimeoutRef.current = setTimeout(() => {
            setIsAISpeaking(false);
            consecutiveVolumeChecksRef.current = 0;
          }, SPEAKING_TIMEOUT_MS);
        }
      } else {
        // Reset counter when below threshold
        consecutiveVolumeChecksRef.current = 0;
      }

      // Store last volume for comparison
      lastVolumeRef.current = liveAPIVolume;
    }
  }, [liveAPIVolume, connected, isSessionActive, setOutVolume, isAISpeaking]);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
    };
  }, []);

  // --- Initialize Audio Recorder ---
  useEffect(() => {
    if (!audioRecorderRef.current) {
      audioRecorderRef.current = new AudioRecorder();
    }

    // Set up event listeners once
    const recorder = audioRecorderRef.current;
    const onData = (base64: string) => {
      if (connected && isMicOn && client) {
        client.sendRealtimeInput([
          { mimeType: "audio/pcm;rate=16000", data: base64 },
        ]);
      }
    };

    const onVolume = (vol: number) => {
      if (connected && isMicOn) {
        setInVolume(vol);
      }
    };

    recorder.on("data", onData);
    recorder.on("volume", onVolume);

    return () => {
      recorder.off("data", onData);
      recorder.off("volume", onVolume);
      recorder.stop();
      audioRecorderRef.current = null;
    };
  }, [connected, isMicOn, client, setInVolume]); // Add required dependencies

  // --- Connection Management ---
  const handleConnectToggle = useCallback(async () => {
    if (connected) {
      // Stop everything when disconnecting
      audioRecorderRef.current?.stop();
      setIsMicOn(false);
      webcam.stop();
      setIsWebcamOn(false);
      screenCapture.stop();
      setIsScreenSharingOn(false);
      setActiveVideoStream(null);
      setIsSessionActive(false); // Set session inactive first

      // Disconnect from the LiveAPI
      await disconnect();

      // Explicitly reset audio output states immediately after disconnect
      setOutVolume(0);
      setIsAISpeaking(false);
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = null;
      }
      lastVolumeRef.current = 0; // Reset last volume ref
      consecutiveVolumeChecksRef.current = 0; // Reset consecutive checks
    } else {
      try {
        // First establish connection
        await connect();
        setIsSessionActive(true);

        // Initialize audio recorder if needed
        if (!audioRecorderRef.current) {
          audioRecorderRef.current = new AudioRecorder();
        }

        // Wait a bit for the connection to stabilize
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Then try to start audio
        try {
          await audioRecorderRef.current.start();
          setIsMicOn(true);
        } catch (error) {
          console.error("Failed to initialize microphone:", error);
          setIsMicOn(false);
        }
      } catch (error) {
        console.error("Failed to connect:", error);
        setIsSessionActive(false);
        setIsMicOn(false);
        audioRecorderRef.current?.stop();
      }
    }
  }, [
    connected,
    connect,
    disconnect,
    webcam,
    screenCapture,
    setIsSessionActive,
    setIsMicOn,
    setIsWebcamOn,
    setIsScreenSharingOn,
    setActiveVideoStream,
    setOutVolume,
  ]);

  // --- Media Toggle Handlers ---
  const handleMicToggle = useCallback(async () => {
    if (!isSessionActive) return;

    try {
      if (isMicOn) {
        audioRecorderRef.current?.stop();
        setIsMicOn(false);
      } else {
        if (!audioRecorderRef.current) {
          audioRecorderRef.current = new AudioRecorder();
        }
        await audioRecorderRef.current.start();
        setIsMicOn(true);
      }
    } catch (error) {
      console.error("Failed to toggle microphone:", error);
      setIsMicOn(false);
      audioRecorderRef.current?.stop();
    }
  }, [isSessionActive, isMicOn, setIsMicOn]);

  const handleWebcamToggle = useCallback(() => {
    handleMediaStreamToggle(webcam, setIsWebcamOn, isWebcamOn);
  }, [webcam, setIsWebcamOn, isWebcamOn, handleMediaStreamToggle]);

  const handleScreenShareToggle = useCallback(() => {
    if (!isSessionActive) return;

    if (isScreenSharingOn) {
      handleMediaStreamToggle(screenCapture, setIsScreenSharingOn, true);
    } else {
      // Show a message to the user about needing to reselect the screen
      const wasSharing = localStorage.getItem(SCREEN_STATE_KEY) === "true";
      if (wasSharing) {
        // Optional: You could show a toast or some UI feedback here
        console.log("Please select your screen to share again");
      }
      handleMediaStreamToggle(screenCapture, setIsScreenSharingOn, false);
    }
  }, [
    isSessionActive,
    isScreenSharingOn,
    screenCapture,
    setIsScreenSharingOn,
    handleMediaStreamToggle,
  ]);

  // --- Effect for Audio Recording State ---
  useEffect(() => {
    const recorder = audioRecorderRef.current;
    if (!recorder) return;

    const startRecording = async () => {
      if (connected && isMicOn && !recorder.recording) {
        try {
          await recorder.start();
        } catch (error) {
          console.error("Failed to start audio recorder:", error);
          setIsMicOn(false);
        }
      }
    };

    startRecording();

    if (!connected || !isMicOn) {
      recorder.stop();
      setInVolume(0);
    }
  }, [connected, isMicOn, setInVolume, setIsMicOn]);

  // --- Effect for Video/Screen Frame Sending ---
  useEffect(() => {
    let frameRequestHandle: number | null = null;
    let lastSentTime = 0;
    const frameInterval = 500;

    function sendVideoFrame() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const now = Date.now();

      if (
        connected &&
        activeVideoStream &&
        video &&
        canvas &&
        video.readyState >= 2 &&
        video.videoWidth > 0 &&
        now - lastSentTime > frameInterval
      ) {
        try {
          const targetWidth = 1280;
          const aspectRatio = video.videoHeight / video.videoWidth;
          const targetHeight = Math.round(targetWidth * aspectRatio);

          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const base64 = canvas.toDataURL("image/jpeg", 0.95);
            const data = base64.split(",")[1];
            if (data) {
              client.sendRealtimeInput([{ mimeType: "image/jpeg", data }]);
              lastSentTime = now;
            }
          }
        } catch (error) {
          console.error("Error sending video frame:", error);
        }
      }

      if (connected && activeVideoStream) {
        frameRequestHandle = requestAnimationFrame(sendVideoFrame);
      }
    }

    if (connected && activeVideoStream) {
      frameRequestHandle = requestAnimationFrame(sendVideoFrame);
    } else {
      if (frameRequestHandle) {
        cancelAnimationFrame(frameRequestHandle);
        frameRequestHandle = null;
      }
    }

    return () => {
      if (frameRequestHandle) {
        cancelAnimationFrame(frameRequestHandle);
      }
    };
  }, [connected, activeVideoStream, client]);

  // Update local session state if external connection state changes
  useEffect(() => {
    if (!connected) {
      setIsSessionActive(false);
      setIsMicOn(false);
      setIsWebcamOn(false);
      setIsScreenSharingOn(false);
      setActiveVideoStream(null);
      setInVolume(0);
      audioRecorderRef.current?.stop();
    }
  }, [
    connected,
    setIsSessionActive,
    setIsMicOn,
    setIsWebcamOn,
    setIsScreenSharingOn,
    setActiveVideoStream,
    setInVolume,
  ]);

  // Ensure video element always gets the stream
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = activeVideoStream;
    }
  }, [activeVideoStream]);

  // Ensure we maintain mic state when component remounts
  useEffect(() => {
    const recorder = audioRecorderRef.current;
    if (connected && isMicOn && recorder && !recorder.recording) {
      recorder.start().catch((error) => {
        console.error("Failed to initialize microphone on remount:", error);
        setIsMicOn(false);
      });
    }
    return () => {
      if (recorder?.recording) {
        recorder.stop();
      }
    };
  }, [connected, isMicOn, setIsMicOn]);

  // --- Effect for restoring media streams on remount ---
  useEffect(() => {
    const restoreMediaStreams = async () => {
      if (!connected || !isSessionActive) return;

      // Restore microphone
      if (isMicOn && !audioRecorderRef.current?.recording) {
        try {
          if (!audioRecorderRef.current) {
            audioRecorderRef.current = new AudioRecorder();
          }
          await audioRecorderRef.current.start();
        } catch (error) {
          console.error("Failed to restore microphone:", error);
          setIsMicOn(false);
        }
      }

      // Restore webcam
      if (isWebcamOn && !webcam.isStreaming) {
        try {
          const stream = await webcam.start();
          setActiveVideoStream(stream);
        } catch (error) {
          console.error("Failed to restore webcam:", error);
          setIsWebcamOn(false);
        }
      }

      // Handle screen sharing restoration differently
      if (isScreenSharingOn && !screenCapture.isStreaming) {
        // Just update the state without attempting to restore
        // User will need to click the button again to reshare
        setIsScreenSharingOn(false);
        if (activeVideoStream?.id === screenCapture.stream?.id) {
          setActiveVideoStream(null);
        }
      }
    };

    restoreMediaStreams();
  }, [
    connected,
    isSessionActive,
    isMicOn,
    isWebcamOn,
    isScreenSharingOn,
    webcam,
    screenCapture,
    setIsMicOn,
    setIsWebcamOn,
    setIsScreenSharingOn,
    setActiveVideoStream,
    activeVideoStream,
  ]);

  return (
    <div className="flex flex-col h-full relative" data-assistant-panel>
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Content Area */}
      <ScrollArea>
        <div className="flex-1 flex flex-col items-center justify-start gap-2 overflow-y-auto p-4 ">
          {/* Audio Pulse Visualizer - Always visible but only active during responses */}{" "}
          <Badge variant="acl-readonly" className="text-xs text-center gap-2">
            <span className="font-bold">Preview Version</span>

            <span className="font-normal">Mozilla Browser Not Supported</span>
          </Badge>
          <div
            className={cn(
              "transition-all duration-500 ease-in-out py-8 flex items-center justify-center flex-col",
              isAISpeaking ? "scale-105" : "scale-100",
              "w-full border border-transparent rounded-lg"
            )}
          >
            <AudioPulse
              active={
                isSessionActive &&
                (isAISpeaking || outVolume > AI_SPEAKING_THRESHOLD)
              }
              volume={outVolume}
              variant="large"
              className={cn(
                "transition-all duration-300",
                isAISpeaking ? "opacity-100" : "opacity-40"
              )}
            />
            {isSessionActive && (
              <span className="text-xs mt-4 text-blue-500 font-mono animate-pulse">
                Streaming Active
              </span>
            )}
          </div>
          {/* Controls Section */}
          <div className="flex items-center gap-4 pb-2">
            {/* Media Control Buttons */}
            <div
              className={cn(
                "flex items-center justify-center gap-2 rounded-full border-2 border-border p-2 bg-muted/10",
                !isSessionActive && "opacity-50 cursor-not-allowed"
              )}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full",
                        isMicOn && "bg-primary/10 text-primary"
                      )}
                      onClick={handleMicToggle}
                      disabled={!isSessionActive}
                    >
                      {isMicOn ? (
                        <Mic className="h-5 w-5" />
                      ) : (
                        <MicOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle Microphone</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full",
                        isScreenSharingOn && "bg-primary/10 text-primary"
                      )}
                      onClick={handleScreenShareToggle}
                      disabled={!isSessionActive}
                    >
                      {isScreenSharingOn ? (
                        <ScreenShare className="h-5 w-5" />
                      ) : (
                        <ScreenShareOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle Screen Share</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-full",
                        isWebcamOn && "bg-primary/10 text-primary"
                      )}
                      onClick={handleWebcamToggle}
                      disabled={!isSessionActive}
                    >
                      {isWebcamOn ? (
                        <Webcam className="h-5 w-5" />
                      ) : (
                        <CameraOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Toggle Webcam</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Connect/Disconnect Button */}
            <div className="flex flex-col items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="default"
                      size="icon"
                      className={cn(
                        `rounded-full border-blue-400 bg-blue-900 text-blue-400 transition-colors duration-200 h-14 w-14 flex items-center justify-center`,
                        isSessionActive
                          ? "border-2 border-blue-500"
                          : "border border-muted-foreground"
                      )}
                      onClick={handleConnectToggle}
                      style={{
                        boxShadow: isSessionActive
                          ? "0 0 0 2px #2563eb"
                          : "0 0 0 1px #64748b",
                      }}
                    >
                      {isSessionActive ? (
                        <Pause className="h-8 w-8 text-blue-400" />
                      ) : (
                        <Play className="h-8 w-8 text-blue-400" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Start/Stop Collaboration</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          {/* Voice Navigation Message */}
          <div className="text-xs text-foreground text-center font-mono font-bold opacity-75 pl-8 pr-8">
            Navigating between pages is currently available in voice mode only.
          </div>
          {/* Video Preview Area - Now below the buttons */}
          {activeVideoStream && (
            <div className="w-full max-w-sm border border-border rounded-2xl overflow-hidden shadow-lg mt-6">
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-auto block"
                />
                <div className="absolute top-2 right-2 px-2 py-1 bg-background/80 rounded text-xs font-mono">
                  {isScreenSharingOn ? "Screen Share" : "Webcam"}
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div
        className="absolute inset-x-0 bottom-0 bg-background border-t border-border px-4 py-3"
        style={{ minHeight: 48 }}
      >
        <span className="text-[10px] text-muted-foreground p-2 text-center font-mono block">
          AI can make mistakes, double check its results.
        </span>
      </div>
    </div>
  );
}
