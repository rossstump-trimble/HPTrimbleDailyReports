interface Release {
  version: string;
  date: string;
  features: string[];
  improvements: string[];
}

export const changelog: Release[] = [
  {
    version: "1.0.27",
    date: "2025-04-20",
    features: ["Enhanced Multimodal Live API Integration"],
    improvements: [
      "Added professional AI assistant with audio, webcam and screen sharing capabilities",
      "Integrated volume meter visualization for audio feedback",
      "Implemented system instructions for Trimble Connect-specific assistance",
      "Added Google Search integration for up-to-date information",
      "Enhanced error handling and connection state management",
      "Optimized audio streaming with PCM16 format support",
    ],
  },
  {
    version: "1.0.26",
    date: "2025-04-15",
    features: ["Added Multimodal Live API Integration"],
    improvements: [
      "Integrated Google's Multimodal Live API for real-time audio/video streaming",
      "Added CollaboratorAssistant component with audio, webcam, and screen sharing capabilities",
      "Implemented real-time video frame processing and streaming",
      "Added media controls with visual feedback and preview window",
      "Enhanced audio processing with volume visualization",
      "Optimized streaming performance with configurable frame rates",
    ],
  },
  {
    version: "1.0.25",
    date: "2025-04-10",
    features: ["Improved Trimble Assistant Panel"],
    improvements: [
      "Redesigned Assistant Panel for better visual consistency across the application",
      "Fixed scrolling behavior to eliminate unwanted jumps during navigation",
      "Made Assistant Panel globally accessible from any page",
      "Enhanced UI with prominent left border for better visual separation",
      "Improved header and footer alignment for better visual hierarchy",
      "Optimized scrolling performance for smoother user experience",
      "Added proper spacing to ensure messages are fully visible",
    ],
  },
  {
    version: "1.0.24",
    date: "2025-04-03",
    features: ["Enhanced Shared Files View"],
    improvements: [
      "Improved shared files view with proper folder path resolution",
      "Added hierarchical folder path display",
      "Enhanced UI to match folder permissions view style",
      "Integrated with Supabase for real-time folder structure",
      "Added tooltips and improved action buttons",
    ],
  },
  {
    version: "1.0.23",
    date: "2025-04-02",
    features: ["Switched to Gemini Flash AI integration"],
    improvements: [
      "Replaced Groq with Gemini Flash for AI assistance",
      "Updated environment configurations",
      "Streamlined integration section",
      "Refined UI responsiveness description",
    ],
  },
  {
    version: "1.0.22",
    date: "2025-03-12",
    features: ["Added CDE Search"],
    improvements: ["Added CDE Search to the application"],
  },
  {
    version: "1.0.21",
    date: "2025-02-27",
    features: ["Added Mini Map"],
    improvements: ["Added Mini Map to the application"],
  },
  {
    version: "1.0.20",
    date: "2025-02-24",
    features: ["Added Automation Builder"],
    improvements: ["Added Automation Builder to the application"],
  },
  {
    version: "1.0.19",
    date: "2025-02-21",
    features: ["Added Geo Explorer configuration and routing options"],
    improvements: [
      "Implement configuration for toggling between default and Geo Explorer",
      "Update routing in HomePage to conditionally navigate to Geo Explorer",
      "Add new configuration option `showDefaultExplorer` in AppSettingsDialog",
      "Modify ProjectSidebar to dynamically show explorer based on configuration",
      "Update URLConfigHandler to support new configuration parameter",
      "Enhance GeoDataTable with column visibility and additional type support",
    ],
  },
  {
    version: "1.0.18",
    date: "2025-02-13",
    features: ["Added project boundary settings"],
    improvements: ["Added project boundary settings to the application"],
  },
  {
    version: "1.0.17",
    date: "2025-02-05",
    features: ["Added advanced user popover"],
    improvements: ["Added advanced user popover to the application"],
  },
  {
    version: "1.0.16",
    date: "2025-02-03",
    features: ["Added advanced user popover"],
    improvements: ["Added advanced user popover to the application"],
  },
  {
    version: "1.0.15",
    date: "2024-12-27",
    features: ["Added PostHog, Clarity and Analytics"],
    improvements: [
      "Added PostHog to the application",
      "Added Clarity to the application",
      "Added Analytics to the application",
    ],
  },
  {
    version: "1.0.14",
    date: "2024-12-19",
    features: ["Added Trimble Assistant"],
    improvements: ["Added Trimble Assistant to the application"],
  },
  {
    version: "1.0.13",
    date: "2024-12-13",
    features: ["Added live avatars"],
    improvements: ["Added live avatars to the header"],
  },
  {
    version: "1.0.12",
    date: "2024-12-09",
    features: ["Added free version splash and banner"],
    improvements: [
      "Added free version splash to the project sidebar",
      "Added free version banner to the home page",
    ],
  },
  {
    version: "1.0.11",
    date: "2024-12-07",
    features: ["Added approval workflows"],
    improvements: [
      "Update dependencies and configuration",
      "Update HomeSidebarConfig to include a new href for the Approval Workflows section",
      "Enhancing project structure and maintainability",
    ],
  },
  {
    version: "1.0.10",
    date: "2024-12-05",
    features: [
      "Added integration configuration",
      "Added new integrations: WorksManager and ProjectSight Disrupt",
    ],
    improvements: [
      "Ability to connect projects to external services",
      "Enhanced project creation dialog with team, linked projects and integrations",
    ],
  },
  {
    version: "1.0.9",
    date: "2024-12-04",
    features: ["Added project creation dialog"],
    improvements: [
      "Ability to customise the prototype configuration with different project creation dialogs",
    ],
  },
  {
    version: "1.0.8",
    date: "2024-12-02",
    features: ["Added shareable URL functionality"],
    improvements: ["Ability to customise the prototype configuration"],
  },

  {
    version: "1.0.7",
    date: "2024-11-29",
    features: [
      "Enhanced HomePage and MapComponent with layout adjustments and project selection features",
    ],
    improvements: [
      "Updated HomePage layout by adjusting padding and element widths for improved spacing and visual consistency.",
      "Enhanced MapComponent to support project selection, allowing users to click on project markers to view details and adjust the map's zoom and center.",
      "Introduced new components for displaying project details alongside the map, improving user interaction and information accessibility.",
      "Refactored AccountPicker and HeaderHome components for better alignment.",
    ],
  },

  {
    version: "1.0.6",
    date: "2024-11-29",
    features: [
      "Added project users count to project card",
      "Introduced a new DataTable component for better project display and interaction.",
    ],
    improvements: [
      "Enhanced HomePage with new project data handling and layout improvements",
      "Updated HomeLayout to improve overflow handling in the main content area.",
      "Expanded Project interface to include additional fields: size, users, lastVisited, and modifiedOn.",
      "Implemented dropdown menu functionality for project actions based on status.",
      "Refactored HomePage to manage user preferences for view type, region, and status more effectively.",
      "Added utility function for formatting file sizes to enhance project data presentation.",
    ],
  },
  {
    version: "1.0.5",
    date: "2024-11-28",
    features: [
      "Added project status filter to projects page",
      "Added project status filter to map view",
      "Added project status marker to map view",
    ],
    improvements: ["Improved project status filter functionality"],
  },

  {
    version: "1.0.4",
    date: "2024-11-28",
    features: [
      "Introduced a tabbed layout in AppSettingsDialog for better organization",
      "Enhanced menu item management with automatic Account Settings handling",
      "Added new sections for App Launcher and Account Picker configuration",
    ],
    improvements: [
      "Improved settings organization with separate tabs for Header, Navigation, and Projects",
      "Enhanced user experience with better layout and accessibility",
      "Refined configuration options with clearer labeling and grouping",
    ],
  },
  {
    version: "1.0.3",
    date: "2024-11-28",
    features: [
      "Added account picker to header",
      "Introduced account picker toggle in settings",
      "Enhanced AppSettingsDialog functionality",
    ],
    improvements: [
      "Improved menu item management system",
      "Enhanced sidebar rendering with dynamic configuration",
      "Refined user interface for better clarity",
    ],
  },
  {
    version: "1.0.2",
    date: "2024-11-22",
    features: [
      "Added app launcher to projects page",
      "Introduced app launcher configuration",
    ],
    improvements: [
      "Enhanced application settings dialog",
      "Improved header component flexibility",
    ],
  },
  {
    version: "1.0.1",
    date: "2024-11-19",
    features: [
      "Added project grid and list views",
      "Implemented interactive map view",
      "Added UI configuration system",
    ],
    improvements: [
      "Enhanced project visualization options",
      "Added project status marker to map view",
      "Improved settings management",
    ],
  },
];

export const getLatestVersion = (): string => {
  return changelog[0].version;
};
