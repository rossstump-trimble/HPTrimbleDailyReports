"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { UseMediaStreamResult } from "@/hooks/use-media-stream-mux";

// Keys for storing states in localStorage
const MIC_STATE_KEY = "collaborator-mic-state";
const WEBCAM_STATE_KEY = "collaborator-webcam-state";
const SCREEN_STATE_KEY = "collaborator-screen-state";
const SESSION_STATE_KEY = "collaborator-session-state";

interface CollaboratorContextType {
  isSessionActive: boolean;
  setIsSessionActive: React.Dispatch<React.SetStateAction<boolean>>;
  isMicOn: boolean;
  setIsMicOn: React.Dispatch<React.SetStateAction<boolean>>;
  isWebcamOn: boolean;
  setIsWebcamOn: React.Dispatch<React.SetStateAction<boolean>>;
  isScreenSharingOn: boolean;
  setIsScreenSharingOn: React.Dispatch<React.SetStateAction<boolean>>;
  inVolume: number;
  setInVolume: React.Dispatch<React.SetStateAction<number>>;
  outVolume: number;
  setOutVolume: React.Dispatch<React.SetStateAction<number>>;
  activeVideoStream: MediaStream | null;
  setActiveVideoStream: React.Dispatch<
    React.SetStateAction<MediaStream | null>
  >;
  handleMediaStreamToggle: (
    mediaHook: UseMediaStreamResult,
    setActiveState: React.Dispatch<React.SetStateAction<boolean>>,
    isCurrentlyActive: boolean
  ) => Promise<void>;
}

const CollaboratorContext = createContext<CollaboratorContextType | undefined>(
  undefined
);

export function CollaboratorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize all states from localStorage
  const [isSessionActive, setIsSessionActive] = useState(() => {
    try {
      const savedState = localStorage.getItem(SESSION_STATE_KEY);
      return savedState === "true";
    } catch {
      return false;
    }
  });

  const [isMicOn, setIsMicOn] = useState(() => {
    try {
      const savedState = localStorage.getItem(MIC_STATE_KEY);
      return savedState === "true";
    } catch {
      return false;
    }
  });

  const [isWebcamOn, setIsWebcamOn] = useState(() => {
    try {
      const savedState = localStorage.getItem(WEBCAM_STATE_KEY);
      return savedState === "true";
    } catch {
      return false;
    }
  });

  const [isScreenSharingOn, setIsScreenSharingOn] = useState(() => {
    try {
      const savedState = localStorage.getItem(SCREEN_STATE_KEY);
      return savedState === "true";
    } catch {
      return false;
    }
  });

  const [inVolume, setInVolume] = useState(0);
  const [outVolume, setOutVolume] = useState(0);
  const [activeVideoStream, setActiveVideoStream] =
    useState<MediaStream | null>(null);

  // Persist all states to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_STATE_KEY, isSessionActive.toString());
      localStorage.setItem(MIC_STATE_KEY, isMicOn.toString());
      localStorage.setItem(WEBCAM_STATE_KEY, isWebcamOn.toString());
      localStorage.setItem(SCREEN_STATE_KEY, isScreenSharingOn.toString());
    } catch {
      // Ignore storage errors
    }
  }, [isSessionActive, isMicOn, isWebcamOn, isScreenSharingOn]);

  const handleMediaStreamToggle = useCallback(
    async (
      mediaHook: UseMediaStreamResult,
      setActiveState: React.Dispatch<React.SetStateAction<boolean>>,
      isCurrentlyActive: boolean
    ) => {
      if (!isSessionActive) return;

      if (isCurrentlyActive) {
        mediaHook.stop();
        setActiveState(false);
        if (activeVideoStream === mediaHook.stream) {
          setActiveVideoStream(null);
        }
      } else {
        try {
          const stream = await mediaHook.start();
          setActiveVideoStream(stream);
          setActiveState(true);
        } catch (error) {
          console.error(`Failed to start ${mediaHook.type}:`, error);
          setActiveState(false);
        }
      }
    },
    [isSessionActive, activeVideoStream]
  );

  // Reset all states when session becomes inactive
  useEffect(() => {
    if (!isSessionActive) {
      setIsMicOn(false);
      setIsWebcamOn(false);
      setIsScreenSharingOn(false);
      setActiveVideoStream(null);
      setInVolume(0);
      setOutVolume(0);
    }
  }, [isSessionActive]);

  return (
    <CollaboratorContext.Provider
      value={{
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
      }}
    >
      {children}
    </CollaboratorContext.Provider>
  );
}

export function useCollaborator() {
  const context = useContext(CollaboratorContext);
  if (context === undefined) {
    throw new Error(
      "useCollaborator must be used within a CollaboratorProvider"
    );
  }
  return context;
}
