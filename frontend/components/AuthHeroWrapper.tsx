"use client";

import React, { useState, useEffect, useSyncExternalStore } from "react";
import { HeroSection } from "./HeroSection";
import AboutAkam from "./AboutAkam";
import { API_BASE_URL, apiFetch } from "@/lib/config";

interface AuthHeroWrapperProps {
  initialIsLoggedIn?: boolean;
}

const subscribe = (callback: () => void) => {
  window.addEventListener("akam_user_updated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("akam_user_updated", callback);
    window.removeEventListener("storage", callback);
  };
};

const getClientSnapshot = () => {
  try {
    return !!(
      localStorage.getItem("akam_user") ||
      document.cookie.includes("akam_logged_in=true")
    );
  } catch {
    return false;
  }
};

const getServerSnapshot = () => false;

export default function AuthHeroWrapper({ initialIsLoggedIn = false }: AuthHeroWrapperProps) {
  const isClientLoggedIn = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  const [verifiedState, setVerifiedState] = useState<boolean | null>(
    initialIsLoggedIn ? true : null
  );

  useEffect(() => {
    if (isClientLoggedIn) {
      document.documentElement.classList.add("akam-logged-in");
    }

    const checkAuth = async () => {
      const cachedUser = localStorage.getItem("akam_user");
      if (!cachedUser) {
        setVerifiedState(false);
        document.documentElement.classList.remove("akam-logged-in");
        return;
      }
      try {
        const res = await apiFetch(`${API_BASE_URL}/users/me`);
        if (res.ok) {
          setVerifiedState(true);
          document.documentElement.classList.add("akam-logged-in");
          document.cookie = "akam_logged_in=true; path=/; max-age=604800; SameSite=Lax";
        } else {
          setVerifiedState(false);
          document.documentElement.classList.remove("akam-logged-in");
          document.cookie = "akam_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
          localStorage.removeItem("akam_user");
          localStorage.removeItem("akam_token");
          window.dispatchEvent(new Event("akam_user_updated"));
        }
      } catch {
        // Keep current state if offline
      }
    };

    checkAuth();
  }, []);

  const isLoggedIn = verifiedState !== null ? verifiedState : isClientLoggedIn;

  if (isLoggedIn) return null;

  return (
    <div id="akam-auth-hero-container">
      <HeroSection />
      <AboutAkam />
    </div>
  );
}


