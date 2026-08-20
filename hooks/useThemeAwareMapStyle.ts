import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { darkMapStyle } from "@/config/MapStyles";

export function useThemeAwareMapStyle() {
  const { theme } = useTheme();
  const [mapStyle, setMapStyle] = useState(darkMapStyle);

  useEffect(() => {
    if (theme === "dark") {
      setMapStyle(darkMapStyle);
    } else {
      setMapStyle([]); // Use an empty array for the default light theme
    }
  }, [theme]);

  return { mapStyle, theme };
}
