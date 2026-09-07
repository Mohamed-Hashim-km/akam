"use client";

import React, { useState, useEffect } from "react";
import { HeroSection } from "./HeroSection";
import { API_BASE_URL, apiFetch } from "@/lib/config";

interface AuthHeroWrapperProps {
  initialIsLoggedIn?: boolean;
}

export default function AuthHeroWrapper({ initialIsLoggedIn = false }: AuthHeroWrapperProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (initialIsLoggedIn) return true;
    if (typeof window !== "undefined") {
      return !!localStorage.getItem("akam_user");
    }
    return false;
  });

  useEffect(() => {
    const cachedUser = localStorage.getItem("akam_user");
    if (cachedUser) {
      setIsLoggedIn(true);
      document.cookie = "akam_logged_in=true; path=/; max-age=604800; SameSite=Lax";
    } else {
      setIsLoggedIn(false);
      document.cookie = "akam_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    }

    const checkAuth = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/users/me`);
        if (res.ok) {
          setIsLoggedIn(true);
          document.cookie = "akam_logged_in=true; path=/; max-age=604800; SameSite=Lax";
        } else {
          setIsLoggedIn(false);
          document.cookie = "akam_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
          localStorage.removeItem("akam_user");
        }
      } catch (e) {
        // Keep current state if offline
      }
    };
    checkAuth();

    const handleAuthUpdate = () => {
      const user = localStorage.getItem("akam_user");
      setIsLoggedIn(!!user);
      if (user) {
        document.cookie = "akam_logged_in=true; path=/; max-age=604800; SameSite=Lax";
      } else {
        document.cookie = "akam_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      }
    };
    window.addEventListener("akam_user_updated", handleAuthUpdate);
    return () => window.removeEventListener("akam_user_updated", handleAuthUpdate);
  }, []);

  if (isLoggedIn) return null;
  return <HeroSection />;
}


