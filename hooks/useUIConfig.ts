"use client";

import { useState, useEffect, useCallback } from "react";

export interface UIConfig {
  showAppLauncher: boolean;
  showAccountPicker: boolean;
  showHomeSidebar: boolean;
  showMapView: boolean;
  showProjectStatusFilter: boolean;
  enabledMenuItems: string[];
  showSettings: boolean;
  showCreateNewProjectDialog: boolean;
  showThemes: boolean;
  showTrialBanner: boolean;
  showFreeVersionBanner: boolean;
  showFreeVersionSplash: boolean;
  showUserTestingDialog: boolean;
  showHoldingArea: boolean;
  showLiveCollaboration: boolean;
  showConnectLabs: boolean;
  showAssistant: boolean;
  showAdvancedUserPopover: boolean;
  // showGeoExplorer: boolean;
  // showDefaultExplorer: boolean;
  showAutomation: boolean;
  showAccessInsights: boolean;
  showAccessInsightsAdvanced: boolean;
  showFolderPermissionsV2: boolean;
  showUpdatedNavigation: boolean;
  showIntegrations: boolean;
  show3DViewer: boolean;
  // Chaos mode settings
  showRandomErrors: boolean;
  showLoadingStates: boolean;
  showNetworkErrors: boolean;
  showIssueManagement: boolean;
}

const DEFAULT_CONFIG: UIConfig = {
  showAppLauncher: false,
  showAccountPicker: false,
  showHomeSidebar: false,
  showMapView: false,
  showProjectStatusFilter: false,
  enabledMenuItems: [] as string[],
  showSettings: false,
  showCreateNewProjectDialog: false,
  showThemes: false,
  showTrialBanner: false,
  showFreeVersionBanner: false,
  showFreeVersionSplash: false,
  showUserTestingDialog: false,
  showHoldingArea: false,
  showLiveCollaboration: false,
  showConnectLabs: false,
  showAssistant: false,
  showAdvancedUserPopover: false,
  // showGeoExplorer: false,
  // showDefaultExplorer: false,
  showAutomation: false,
  showAccessInsights: false,
  showAccessInsightsAdvanced: false,
  showFolderPermissionsV2: false,
  showUpdatedNavigation: false,
  showIntegrations: false,
  show3DViewer: false,
  // Chaos mode settings
  showRandomErrors: false,
  showLoadingStates: false,
  showNetworkErrors: false,
  showIssueManagement: false,
};

const STORAGE_KEY = "trimble_connect_ui_config";

export function useUIConfig() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      setConfig(JSON.parse(savedConfig));
    }
    setIsLoaded(true);
  }, []);

  const updateConfig = useCallback((newConfig: UIConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  }, []);

  return { config, updateConfig, isLoaded };
}
