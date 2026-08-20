import React from "react";

export function LoadingSpinner() {
  const [messageIndex, setMessageIndex] = React.useState(0);

  const loadingMessages = [
    "Loading...",
    "Gathering permissions...",
    "Almost there...",
    "Processing folder structure...",
    "Analyzing access rights...",
    "Just a moment longer...",
    "Fetching the latest data...",
    "Organizing information...",
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % loadingMessages.length);
    }, 2000); // Change message every 2 seconds

    return () => clearInterval(interval);
  }, [loadingMessages.length]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground animate-fade-in">
          {loadingMessages[messageIndex]}
        </span>
      </div>
    </div>
  );
}
