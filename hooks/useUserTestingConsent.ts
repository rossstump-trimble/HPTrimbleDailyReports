import { useState, useEffect } from "react";

const CONSENT_KEY = "userTestingConsent";
const SESSION_CONSENT_KEY = "userTestingSessionConsent";
const CONSENT_VERSION = "1.0"; // Add versioning to handle consent updates

interface ConsentData {
  acknowledged: boolean;
  version: string;
  timestamp: number;
  isPersistent: boolean;
}

export function useUserTestingConsent() {
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Check session storage first
    const sessionConsent = sessionStorage.getItem(SESSION_CONSENT_KEY);
    if (sessionConsent) {
      const consentData: ConsentData = JSON.parse(sessionConsent);
      setHasConsented(
        consentData.acknowledged && consentData.version === CONSENT_VERSION
      );
      setIsLoaded(true);
      return;
    }

    // Then check local storage for persistent consent
    const persistentConsent = localStorage.getItem(CONSENT_KEY);
    if (persistentConsent) {
      const consentData: ConsentData = JSON.parse(persistentConsent);
      if (consentData.acknowledged && consentData.version === CONSENT_VERSION) {
        // If persistent consent exists, also set it in session storage
        sessionStorage.setItem(SESSION_CONSENT_KEY, persistentConsent);
        setHasConsented(true);
      }
    }
    setIsLoaded(true);
  }, []);

  const giveConsent = (isPersistent: boolean = false) => {
    const consentData: ConsentData = {
      acknowledged: true,
      version: CONSENT_VERSION,
      timestamp: Date.now(),
      isPersistent,
    };

    // Always store in session storage
    sessionStorage.setItem(SESSION_CONSENT_KEY, JSON.stringify(consentData));

    // If persistent consent is requested, also store in local storage
    if (isPersistent) {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(consentData));
    }

    setHasConsented(true);
  };

  const revokeConsent = () => {
    localStorage.removeItem(CONSENT_KEY);
    sessionStorage.removeItem(SESSION_CONSENT_KEY);
    setHasConsented(false);
  };

  return {
    hasConsented,
    isLoaded,
    giveConsent,
    revokeConsent,
  };
}
