"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  ExampleQuestions,
  defaultExampleQuestions,
  explorerExampleQuestions,
  projectsightExampleQuestions,
  projectsightexplorerExampleQuestions,
} from "@/components/Assistant";
import { usePathname } from "next/navigation";

type Role = "user" | "assistant" | "system";

export interface Message {
  id: string;
  content: string;
  role: Role;
  timestamp: string;
}

export type AssistantMode = "chat" | "collaborator";

interface AssistantContextType {
  isAssistantOpen: boolean;
  toggleAssistant: () => void;
  messages: Message[];
  addMessage: (message: Omit<Message, "timestamp">) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isExpanded: boolean;
  toggleExpanded: () => void;
  isCentered: boolean;
  toggleCentered: () => void;
  preloadQuestion: (question: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editMessage: (messageId: string, newContent: string) => void;
  exampleQuestions: ExampleQuestions;
  setExampleQuestions: (questions: ExampleQuestions) => void;
  mode: AssistantMode;
  setMode: (mode: AssistantMode) => void;
  toggleMode: () => void;
}

const AssistantContext = createContext<AssistantContextType | undefined>(
  undefined
);

const initialMessages: Message[] = [
  {
    id: "initial-message",
    content:
      "Hello! I'm your Trimble Assistant created by the good folks at Trimble. How can I help you today?",
    role: "assistant",
    timestamp: new Date().toLocaleTimeString(),
  },
];

const generateMessageId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCentered, setIsCentered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [exampleQuestions, setExampleQuestions] = useState<ExampleQuestions>(
    defaultExampleQuestions
  );
  const [mode, setMode] = useState<AssistantMode>("chat");
  const pathname = usePathname();

  // Set appropriate example questions based on the current route
  useEffect(() => {
    const isExplorerPage =
      pathname?.startsWith("/explorer") ||
      pathname?.startsWith("/ifcs") ||
      pathname?.startsWith("/pdfs") ||
      pathname?.startsWith("/docs");

    if (isExplorerPage) {
      setExampleQuestions(explorerExampleQuestions);
    } else if (pathname?.startsWith("/projectsight")) {
      setExampleQuestions(projectsightExampleQuestions);
    } else if (pathname?.startsWith("/trimble-connect")) {
      setExampleQuestions(projectsightexplorerExampleQuestions);
    } else {
      setExampleQuestions(defaultExampleQuestions);
    }
  }, [pathname]);

  const toggleAssistant = () => {
    setIsAssistantOpen((prev) => !prev);
    if (!isAssistantOpen) {
      setMessages(initialMessages);
      setIsCentered(false);

      // Example questions will be set by the useEffect based on pathname
    }
  };

  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
  };

  const toggleCentered = () => {
    setIsCentered((prev) => !prev);
    if (!isCentered) {
      setIsExpanded(false);
    }
  };

  const addMessage = useCallback((message: Omit<Message, "timestamp">) => {
    const newMessage = {
      ...message,
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => [...prev, newMessage]);
  }, []);

  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      setIsLoading(true);
      setMessages((prev) => {
        const messageIndex = prev.findIndex((msg) => msg.id === messageId);
        if (messageIndex === -1) return prev;

        // Create new array with edited message and remove subsequent messages
        const newMessages = [...prev.slice(0, messageIndex + 1)];
        newMessages[messageIndex] = {
          ...newMessages[messageIndex],
          content: newContent,
          timestamp: new Date().toLocaleTimeString(),
        };
        return newMessages;
      });

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful assistant for Trimble Connect and ProjectSight web applications and you will provide concise answers to questions. You can answer questions about projects, folders, and files in the system. When asked about a specific project, folder, or file, use the context provided in the question. For projects, you can provide general information about the project. For folders, you can explain their purpose and contents. For files, you can explain their format, purpose, and how they can be used. If specific information is not available, explain what would typically be available for that entity type.",
              },
              ...messages
                .slice(0, messages.findIndex((msg) => msg.id === messageId) + 1)
                .map((msg) => ({
                  role: msg.role,
                  content: msg.id === messageId ? newContent : msg.content,
                })),
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        let fullMessage = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = new TextDecoder().decode(value);
          fullMessage += text;
        }

        addMessage({
          content: fullMessage,
          role: "assistant",
          id: generateMessageId(),
        });
      } catch (error) {
        console.error("Chat error:", error);
        addMessage({
          content: `I apologize, but I'm having trouble processing your edited message. Please try again in a moment.`,
          role: "assistant",
          id: generateMessageId(),
        });
      } finally {
        setIsLoading(false);
      }
    },
    [messages, addMessage, setIsLoading]
  );

  const handleSendMessage = async (content: string) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: "user", content },
          ],
        }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.text();

      addMessage({
        content: data,
        role: "assistant",
        id: generateMessageId(),
      });
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const preloadQuestion = useCallback(
    (question: string) => {
      setIsOpen(true);
      addMessage({
        content: question,
        role: "user",
        id: generateMessageId(),
      });

      setIsLoading(true);
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant for Trimble Connect and ProjectSight web applications and you will provide concise answers to questions. You can answer questions about projects, folders, and files in the system. When asked about a specific project, folder, or file, use the context provided in the question. For projects, you can provide general information about the project. For folders, you can explain their purpose and contents. For files, you can explain their format, purpose, and how they can be used. If specific information is not available, explain what would typically be available for that entity type.",
            },
            ...messages.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: "user", content: question },
          ],
        }),
      })
        .then((response) => {
          if (!response.ok)
            throw new Error(`HTTP error! status: ${response.status}`);
          return response.text();
        })
        .then((data) => {
          addMessage({
            content: data,
            role: "assistant",
            id: generateMessageId(),
          });
        })
        .catch((error) => console.error("Chat error:", error))
        .finally(() => setIsLoading(false));
    },
    [messages, addMessage, setIsLoading]
  );

  const toggleMode = () =>
    setMode((prev) => (prev === "chat" ? "collaborator" : "chat"));

  return (
    <AssistantContext.Provider
      value={{
        isAssistantOpen,
        toggleAssistant,
        messages,
        addMessage,
        isLoading,
        setIsLoading,
        isExpanded,
        toggleExpanded,
        isCentered,
        toggleCentered,
        preloadQuestion,
        isOpen,
        setIsOpen,
        editMessage,
        exampleQuestions,
        setExampleQuestions,
        mode,
        setMode,
        toggleMode,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error("useAssistant must be used within an AssistantProvider");
  }
  return context;
}
