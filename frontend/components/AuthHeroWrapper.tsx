"use client";

import React, { useState, useEffect } from "react";
import { HeroSection } from "./HeroSection";
import AboutAkam from "./AboutAkam";
import { API_BASE_URL, apiFetch } from "@/lib/config";

interface AuthHeroWrapperProps {
  initialIsLoggedIn?: boolean;
}

export default function AuthHeroWrapper({ initialIsLoggedIn = false }: AuthHeroWrapperProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(initialIsLoggedIn);

  useEffect(() => {
    const updateAuthState = () => {
      const cachedUser = localStorage.getItem("akam_user");
      const userExists = !!cachedUser;
      setIsLoggedIn(userExists);
      if (userExists) {
        document.cookie = "akam_logged_in=true; path=/; max-age=604800; SameSite=Lax";
      } else {
        document.cookie = "akam_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
        const el = document.getElementById("akam-auth-hero-container");
        if (el) el.style.display = "";
      }
    };

    updateAuthState();

    const checkAuth = async () => {
      const cachedUser = localStorage.getItem("akam_user");
      if (!cachedUser) {
        setIsLoggedIn(false);
        return;
      }
      try {
        const res = await apiFetch(`${API_BASE_URL}/users/me`);
        if (res.ok) {
          setIsLoggedIn(true);
          document.cookie = "akam_logged_in=true; path=/; max-age=604800; SameSite=Lax";
        } else {
          setIsLoggedIn(false);
          document.cookie = "akam_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
          localStorage.removeItem("akam_user");
          localStorage.removeItem("akam_token");
          const el = document.getElementById("akam-auth-hero-container");
          if (el) el.style.display = "";
        }
      } catch (e) {
        // Keep current state if offline
      }
    };
    checkAuth();

    window.addEventListener("akam_user_updated", updateAuthState);
    window.addEventListener("storage", updateAuthState);
    return () => {
      window.removeEventListener("akam_user_updated", updateAuthState);
      window.removeEventListener("storage", updateAuthState);
    };
  }, []);

  if (isLoggedIn) return null;

  return (
    <div id="akam-auth-hero-container" suppressHydrationWarning>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              if (localStorage.getItem("akam_user") || document.cookie.indexOf("akam_logged_in=true") !== -1) {
                var el = document.getElementById("akam-auth-hero-container");
                if (el) el.style.display = "none";
              }
            } catch (e) {}
          `,
        }}
      />
      <HeroSection />
      <AboutAkam />
    </div>
  );
}


