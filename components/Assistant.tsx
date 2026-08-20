import React, { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Send,
  Bot,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Camera,
  Pencil,
  Crop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssistant, Message } from "@/contexts/AssistantContext";
import ReactMarkdown from "react-markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { captureScreenshot } from "@/components/utils/screenCapture";
import { useToast } from "@/hooks/use-toast";
import {
  saveScreenshotToSupabase,
  savePromptCaptureToSupabase,
  supabase,
} from "@/components/utils/supabase";
import Image from "next/image";

interface MessageFeedback {
  [messageId: string]: {
    liked?: boolean;
    disliked?: boolean;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onerror: (event: any) => void;
  onend: () => void;
  onresult: (event: any) => void;
  onstart: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface MessageItemProps {
  message: Message;
  toggleSpeech: (text: string) => void;
  isSpeaking: boolean;
  onEdit: (content: string) => void;
}

// Define example question sets for different contexts
export interface ExampleQuestions {
  questions: string[];
}

export const defaultExampleQuestions: ExampleQuestions = {
  questions: [
    "What are the key features of ProjectSight?",
    "How can I collaborate with my team on a project?",
    "How do I create a new project in ProjectSight?",
  ],
};

export const projectsightExampleQuestions: ExampleQuestions = {
  questions: [
    "What are the key features of ProjectSight?",
    "How can I collaborate with my team on a project?",
    "How do I create a new project in ProjectSight?",
  ],
};
export const projectsightexplorerExampleQuestions: ExampleQuestions = {
  questions: [
    "How do I upload files to ProjectSight Explorer?",
    "What file formats are supported in ProjectSight Explorer?",
    "How can I share files with my team members?",
  ],
};

export const explorerExampleQuestions: ExampleQuestions = {
  questions: [
    "How do I upload files to Trimble Connect?",
    "What file formats are supported in Trimble Connect?",
    "How can I share files with my team members?",
  ],
};

export const fileSpecificExampleQuestions: ExampleQuestions = {
  questions: [
    "What can I do with a file?",
    "How do I share a file with others?",
    "Can I edit a file in Trimble Connect?",
  ],
};

export const folderSpecificExampleQuestions: ExampleQuestions = {
  questions: [
    "How do I add files to a folder?",
    "How do I share a folder with my team?",
    "Can I set permissions for a folder?",
  ],
};

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  toggleSpeech,
  isSpeaking,
  onEdit,
}) => {
  const [feedback, setFeedback] = useState<MessageFeedback>({});
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isInitialMessage = message.id === "initial-message";

  const handleFeedback = (messageId: string, type: "like" | "dislike") => {
    setFeedback((prev) => ({
      ...prev,
      [messageId]: {
        liked: type === "like",
        disliked: type === "dislike",
      },
    }));
    // Here you could add API call to save feedback
  };

  const handleCopy = async (content: string) => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }
    onEdit(editedContent.trim());
    setIsEditing(false);
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.setSelectionRange(
        inputRef.current.value.length,
        inputRef.current.value.length
      );
    }
  }, [isEditing]);

  return (
    <div
      className={cn(
        "flex mb-4",
        message.role === "assistant"
          ? "justify-start w-full"
          : "justify-end w-full"
      )}
    >
      {message.role === "assistant" && (
        <Bot className="w-5 h-5 text-primary mt-1 flex-shrink-0 mr-2" />
      )}
      <div
        className={cn(
          "rounded-lg p-3",
          message.role === "assistant"
            ? "bg-primary/10 text-foreground w-[95%]"
            : "bg-primary/20 text-foreground w-fit max-w-[75%] ml-auto"
        )}
      >
        {isEditing && message.role === "user" ? (
          <form onSubmit={handleEditSubmit} className="flex flex-col gap-2">
            <textarea
              ref={inputRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full min-h-[100px] p-2 text-sm bg-background/50 rounded-md border focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsEditing(false);
                  setEditedContent(message.content);
                }
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleEditSubmit(e);
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditedContent(message.content);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                Save & Resend
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div
              className={cn(
                "text-sm break-words prose dark:prose-invert prose-sm",
                message.role === "assistant"
                  ? "max-w-none overflow-x-hidden"
                  : "w-fit"
              )}
            >
              <ReactMarkdown
                components={{
                  // Style code blocks
                  code: ({
                    className,
                    children,
                    ...props
                  }: React.HTMLProps<HTMLElement>) => {
                    const match = /language-(\w+)/.exec(className || "");
                    const isCodeBlock = match && children;

                    return (
                      <code
                        className={cn(
                          "bg-background px-1.5 py-0.5 rounded-md text-sm font-mono text-primary",
                          isCodeBlock &&
                            "block overflow-x-auto p-3 my-2 w-full",
                          className
                        )}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                  // Style links
                  a: ({ node, className, children, ...props }) => (
                    <a
                      className="text-primary underline underline-offset-4"
                      {...props}
                    >
                      {children}
                    </a>
                  ),
                  // Style lists
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 my-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 my-2">{children}</ol>
                  ),
                  // Update pre tag styling for better containment
                  pre: ({ children, ...props }) => (
                    <pre
                      className="bg-background rounded-md overflow-x-auto w-full max-w-[320px] my-2 whitespace-pre-wrap break-all"
                      {...props}
                    >
                      {children}
                    </pre>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
            <p className="text-xs opacity-50 mt-1">{message.timestamp}</p>

            {message.role === "user" && (
              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => handleCopy(message.content)}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-full"
                  onClick={() => toggleSpeech(message.content)}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {message.role === "assistant" && !isInitialMessage && (
              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 rounded-full",
                      feedback[message.id]?.liked && "text-green-500"
                    )}
                    onClick={() => handleFeedback(message.id, "like")}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 rounded-full",
                      feedback[message.id]?.disliked && "text-red-500"
                    )}
                    onClick={() => handleFeedback(message.id, "dislike")}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => handleCopy(message.content)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => toggleSpeech(message.content)}
                  >
                    {isSpeaking ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Assistant: React.FC<{ exampleQuestions?: ExampleQuestions }> = ({
  exampleQuestions = defaultExampleQuestions,
}) => {
  const { messages, addMessage, isLoading, setIsLoading, editMessage } =
    useAssistant();
  const { toast } = useToast();
  const [input, setInput] = useState("");
  const [showDefaultQuestions, setShowDefaultQuestions] = useState(true);
  const [currentStreamedMessage, setCurrentStreamedMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const initialScrollRef = useRef(false);

  // Add a function to generate unique IDs
  const generateMessageId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Simplified scroll to bottom without animations
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, []);

  // Only scroll when a new message is added or streaming ends
  useEffect(() => {
    // Only scroll if we have messages and we're not loading or streaming
    if (messages.length > 0 && !isLoading && currentStreamedMessage === "") {
      scrollToBottom();
    }
  }, [messages.length, isLoading, currentStreamedMessage, scrollToBottom]);

  // Handle initial scroll once the component mounts
  useEffect(() => {
    if (!initialScrollRef.current && messages.length > 0) {
      scrollToBottom();
      initialScrollRef.current = true;
    }
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join("");

        setInput(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      (recognitionRef.current as SpeechRecognition).stop();
      setIsListening(false);
    } else {
      (recognitionRef.current as SpeechRecognition).start();
      setIsListening(true);
    }
  };

  const handleCaptureScreenshot = async () => {
    if (isCapturingScreenshot || isLoading) return;
    setIsCapturingScreenshot(true);
    try {
      // Minimize the assistant panel while taking a screenshot
      const assistantElement = document.querySelector("[data-assistant-panel]");
      if (assistantElement) {
        assistantElement.setAttribute("data-minimized", "true");
      }

      // Capture the screenshot using region selection
      const imageData = await captureScreenshot().catch((err) => {
        console.log("Screenshot capture was cancelled or failed:", err.message);
        // Return null to indicate cancellation
        return null;
      });

      // If capture was cancelled (ESC pressed), just return
      if (imageData === null) {
        console.log("Screenshot capture was cancelled");
        if (assistantElement) {
          assistantElement.removeAttribute("data-minimized");
        }
        return;
      }

      setCapturedImage(imageData);

      // Reset UI
      if (assistantElement) {
        assistantElement.removeAttribute("data-minimized");
      }

      // Save screenshot to local memory
      if (imageData) {
        console.log("Saving screenshot to local memory...");
        const result = await saveScreenshotToSupabase({
          imageData,
          promptText: input || "What do you see in this screenshot?",
        });

        if (!result.success) {
          console.error("Error saving screenshot:", result.error);
          toast({
            title: "Region captured",
            description: "Selected region is available for this session only.",
            className: "bg-green-800 text-background dark:text-white",
            variant: "destructive",
            duration: 3000,
          });
        } else {
          toast({
            title: "Region captured",
            description:
              "Your selected region is ready. You can now ask questions about what you're seeing.",
            className: "bg-green-800 text-background dark:text-white",
            duration: 3000,
          });
          console.log("Screenshot saved to local memory successfully");
        }
      } else {
        toast({
          title: "Region selection failed",
          description: "No image data was returned. Please try again.",
          className: "bg-red-800 text-background dark:text-white",
          variant: "destructive",
          duration: 3000,
        });
      }

      // Focus the input field for user to type a question
      setInput((input) => input || "What do you see in this screenshot?");
    } catch (error) {
      console.error("Error capturing screenshot:", error);

      // Reset UI first in case of error
      const assistantElement = document.querySelector("[data-assistant-panel]");
      if (assistantElement) {
        assistantElement.removeAttribute("data-minimized");
      }

      // Check for canceled selection
      if (
        error instanceof Error &&
        error.message === "Screenshot capture cancelled"
      ) {
        // Just return silently for cancellation - don't show a toast
        console.log("User cancelled screenshot selection");
      } else if (
        error instanceof Error &&
        error.message === "Selected region is too small"
      ) {
        toast({
          title: "Region too small",
          description: "Please select a larger area to capture.",
          className: "bg-red-800 text-background dark:text-white",
          variant: "destructive",
          duration: 3000,
        });
      } else {
        toast({
          title: "Selection failed",
          description:
            error instanceof Error
              ? error.message
              : "Could not capture the selected region. Please try again.",
          className: "bg-red-800 text-background dark:text-white",
          variant: "destructive",
          duration: 3000,
        });
      }
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if ((!content.trim() && !capturedImage) || isLoading) return;

    // Force hide default questions
    setShowDefaultQuestions(false);
    setInput("");

    // Store image data for API request
    const imageForRequest = capturedImage;

    // Add user message immediately
    addMessage({
      content: content.trim() || "What do you see in this screenshot?",
      role: "user",
      id: generateMessageId(),
    });

    // Scroll right after adding user message
    scrollToBottom();

    // We'll save the promptId to update it with the response later
    let promptCaptureId: string | null = null;

    // Save prompt capture to Supabase (hasScreenCapture: true if image attached)
    const promptResult = await savePromptCaptureToSupabase({
      prompt: content.trim() || "What do you see in this screenshot?",
      hasScreenCapture: !!imageForRequest,
    });

    if (promptResult.success && promptResult.data) {
      promptCaptureId = promptResult.data[0]?.id || null;
    }

    scrollToBottom(); // Scroll after sending message

    setIsLoading(true);
    setCurrentStreamedMessage("");

    try {
      const requestMessages = [
        {
          role: "system",
          content:
            "You are a helpful assistant for Trimble Connect and ProjectSight web applications and you will provide concise answers to questions about Trimble applications only. Users interacting with you will already have access to the Trimble web applications and they won't need to login to it. When asked about a specific project please respond that this is currently not available and will be implemented in the future",
        },
        ...messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content: content.trim() || "What do you see in this screenshot?",
        },
      ];

      console.log(
        `Sending request with ${imageForRequest ? "image" : "no image"}`
      );

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: requestMessages,
          imageData: imageForRequest,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server responded with status: ${response.status}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      let fullMessage = "";

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the chunk to text and append it
        const text = new TextDecoder().decode(value);
        fullMessage += text;
        setCurrentStreamedMessage(fullMessage);
      }

      // Add the complete message
      addMessage({
        content: fullMessage,
        role: "assistant",
        id: generateMessageId(),
      });

      // If we have a promptCaptureId, update the record with the LLM response
      if (promptCaptureId && supabase) {
        try {
          const { error } = await supabase
            .from("assistant_prompt_captures")
            .update({ llm_response: fullMessage })
            .eq("id", promptCaptureId);

          if (error) {
            console.error("Error updating LLM response:", error);
          } else {
            console.log("Successfully saved LLM response to Supabase");
          }
        } catch (updateError) {
          console.error(
            "Error updating prompt with LLM response:",
            updateError
          );
        }
      }

      // Clear the captured image after it's been used
      setCapturedImage(null);
    } catch (error) {
      console.error("Chat error:", error);

      // Add a more user-friendly error message
      addMessage({
        content: `I apologize, but I'm having trouble connecting to the server. This might be due to:
- A temporary service disruption
- Network connectivity issues
- Server configuration problems

Please try again in a few moments.

Technical details: ${error instanceof Error ? error.message : "Unknown error"}`,
        role: "assistant",
        id: generateMessageId(),
      });
    } finally {
      setIsLoading(false);
      setCurrentStreamedMessage("");
    }
  };

  // Modify the suggested questions section to only show if there are no messages except the initial one
  const shouldShowSuggestions = showDefaultQuestions && messages.length <= 1;

  useEffect(() => {
    if (typeof window !== "undefined") {
      speechSynthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const toggleSpeech = (text: string) => {
    if (!speechSynthesisRef.current) return;

    if (isSpeaking) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      speechSynthesisRef.current.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    editMessage(messageId, newContent);
  };

  // Add this section to render example questions
  const renderExampleQuestions = () => {
    if (messages.length > 1) return null; // Only show examples when no conversation has started

    return (
      <div className="p-4 mb-4">
        <h3 className="text-sm font-medium mb-13">Example Questions:</h3>
        <div className="space-y-3">
          {exampleQuestions.questions.map((question: string, index: number) => (
            <Button
              key={index}
              variant="ghost"
              className="w-full justify-start text-left py-2 px-3 h-auto text-sm bg-slate-100 dark:bg-slate-800 rounded-md border-none font-normal"
              onClick={() => handleSendMessage(question)}
              disabled={isLoading}
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full relative" data-assistant-panel>
      {/* Messages Area - Dynamic bottom padding */}
      <div
        className="flex-1 overflow-y-auto pb-32"
        style={{ minHeight: 0 }}
        ref={scrollAreaRef}
      >
        <div className="space-y-4 p-4">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              toggleSpeech={toggleSpeech}
              isSpeaking={isSpeaking}
              onEdit={(newContent) => handleEdit(message.id, newContent)}
            />
          ))}
          {currentStreamedMessage && (
            <div className="flex items-start space-x-2 mb-4 justify-start">
              <Bot className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div className="max-w-[75%] rounded-lg p-3 bg-primary/10 text-foreground">
                <div className="text-sm break-words prose dark:prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      // Style code blocks
                      code: ({
                        className,
                        children,
                        ...props
                      }: React.HTMLProps<HTMLElement>) => (
                        <code
                          className={cn(
                            "bg-muted px-1.5 py-0.5 rounded-md text-sm",
                            className
                          )}
                          {...props}
                        >
                          {children}
                        </code>
                      ),
                      // Style links
                      a: ({ node, className, children, ...props }) => (
                        <a
                          className="text-primary underline underline-offset-4"
                          {...props}
                        >
                          {children}
                        </a>
                      ),
                      // Style lists
                      ul: ({ children }) => (
                        <ul className="list-disc pl-4 my-2">{children}</ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-4 my-2">{children}</ol>
                      ),
                    }}
                  >
                    {currentStreamedMessage}
                  </ReactMarkdown>
                </div>
                <span className="animate-pulse">▊</span>
              </div>
            </div>
          )}
          {capturedImage && (
            <div className="flex items-start space-x-2 mb-4 justify-end">
              <div className="max-w-[75%] rounded-lg p-3 bg-primary/20 text-foreground">
                <div className="text-sm break-words">
                  <p className="mb-2">Screenshot captured:</p>
                  <Image
                    src={capturedImage}
                    alt="Captured screenshot"
                    className="rounded-md max-h-48 object-contain"
                    width={320}
                    height={192}
                  />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Bottom Fixed Section */}
      <div className="absolute inset-x-0 bottom-0 bg-background border-t border-border">
        {/* Suggested Questions */}
        {shouldShowSuggestions && (
          <div className="border-t border-border bg-background p-4">
            <p className="text-sm font-medium mb-3">Example Questions:</p>
            <div className="space-y-3">
              {exampleQuestions.questions.map(
                (question: string, index: number) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-left py-2 px-3 h-auto text-sm bg-slate-100 dark:bg-slate-800 rounded-md border-none font-normal"
                    onClick={() => handleSendMessage(question)}
                    disabled={isLoading}
                  >
                    {question}
                  </Button>
                )
              )}
            </div>
          </div>
        )}
        {/* Input Area */}
        <div className="bg-secondary/50 p-4 border-t border-border">
          <div className="flex items-center space-x-2 max-w-3xl mx-auto">
            <div className="flex items-center gap-2 w-full bg-background border rounded-full px-2 py-2">
              {speechSupported && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={toggleListening}
                        variant="ghost"
                        size="icon"
                        disabled={isLoading}
                        className={cn(
                          "h-8 w-8 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-full",
                          isListening && "text-red-500"
                        )}
                      >
                        {isListening ? (
                          <MicOff className="h-4 w-4" />
                        ) : (
                          <Mic className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Voice Input {isListening ? "(recording)" : ""}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-full",
                        isCapturingScreenshot && "animate-pulse text-amber-500"
                      )}
                      disabled={isLoading || isCapturingScreenshot}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isCapturingScreenshot && !isLoading) {
                          handleCaptureScreenshot();
                        }
                      }}
                    >
                      <Crop className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {isCapturingScreenshot
                        ? "Selecting region..."
                        : capturedImage
                          ? "Region captured"
                          : "Capture screen region"}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  capturedImage
                    ? "Ask about the screenshot..."
                    : "Type something..."
                }
                className="flex-1 bg-transparent border-none focus:outline-none focus:ring-0 text-sm px-2 text-foreground"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage(input);
                  }
                }}
                disabled={isLoading}
                autoFocus
              />

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => handleSendMessage(input)}
                      disabled={isLoading || (!input.trim() && !capturedImage)}
                      variant="default"
                      size="icon"
                      className="h-8 w-8 p-1 transition-colors rounded-full"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isLoading ? "Sending..." : "Send Message"}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground p-2 text-center font-mono">
            AI can make mistakes, double check its results.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
