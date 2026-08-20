import { Loader } from "@googlemaps/js-api-loader";

const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

// Only create the loader if we have an API key
export const loader = apiKey 
  ? new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places", "drawing"],
    })
  : null;

// Helper function to check if Google Maps is available
export const isGoogleMapsAvailable = () => {
  return !!apiKey;
};
