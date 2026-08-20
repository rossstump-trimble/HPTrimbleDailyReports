import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Log initialization status
console.log(`Supabase initialized with URL: ${supabaseUrl ? "✓" : "✗"}`);
console.log(`Supabase key available: ${supabaseKey ? "✓" : "✗"}`);

// Only create the client if both URL and key are available
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Local in-memory storage for screenshots (will be cleared on page refresh)
type StoredScreenshot = {
  id: string;
  filename: string;
  imageData: string;
  created_at: string;
  promptText?: string | null;
};

const localScreenshots: StoredScreenshot[] = [];

// Function to save a screenshot capture locally (no Supabase storage)
export async function saveScreenshotToSupabase({
  imageData,
  promptText = null,
}: {
  imageData: string;
  promptText?: string | null;
}) {
  try {
    // For POC, use a generic user ID
    const tempUserId = "poc-user";

    console.log("Saving screenshot locally (in memory)");

    // Create a unique filename and ID
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const filename = `screenshot-${tempUserId}-${timestamp}.jpg`;

    console.log(`Created local screenshot with ID: ${id}`);

    // Store the screenshot in our local array
    localScreenshots.push({
      id,
      filename,
      imageData,
      created_at: new Date().toISOString(),
      promptText,
    });

    // Sort by creation date (newest first)
    localScreenshots.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Limit the number of stored screenshots to prevent memory issues
    while (localScreenshots.length > 20) {
      localScreenshots.pop();
    }

    console.log(`Total local screenshots: ${localScreenshots.length}`);

    return {
      success: true,
      data: {
        imageUrl: imageData, // Just use the data URL directly
        id,
      },
    };
  } catch (error) {
    // Log error information
    console.error("Error saving screenshot locally:", error);
    return {
      success: false,
      error: `Error saving locally: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

// Function to get screenshot history from local memory
export async function getScreenshotHistory(limit = 10) {
  try {
    console.log("Fetching local screenshot history");

    if (localScreenshots.length === 0) {
      console.log("No local screenshots found");
      return { success: true, data: [] };
    }

    console.log(`Found ${localScreenshots.length} local screenshots`);

    // Convert to the expected format
    const screenshots = localScreenshots.slice(0, limit).map((screenshot) => ({
      filename: screenshot.filename,
      created_at: screenshot.created_at,
      size: Math.ceil(screenshot.imageData.length / 1.37), // Rough estimate of base64 to binary size
      imageUrl: screenshot.imageData,
    }));

    return { success: true, data: screenshots };
  } catch (error) {
    console.error("Error fetching local screenshots:", error);
    return { success: false, error };
  }
}

// Function to save a prompt capture to Supabase
export async function savePromptCaptureToSupabase({
  prompt,
  hasScreenCapture = false,
  llmResponse = null,
}: {
  prompt: string;
  hasScreenCapture?: boolean;
  llmResponse?: string | null;
}) {
  if (!supabase) {
    console.warn("Supabase client not available - environment variables may be missing");
    return { success: false, error: "Supabase client not configured" };
  }

  try {
    const insertObj = {
      prompt,
      has_screen_capture: hasScreenCapture,
      llm_response: llmResponse,
    };
    const { data, error } = await supabase
      .from("assistant_prompt_captures")
      .insert([insertObj])
      .select();
    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Error saving prompt capture to Supabase:", error);
    return { success: false, error };
  }
}
