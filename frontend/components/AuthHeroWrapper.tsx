"use client";

import React, { useState, useEffect } from "react";
import { HeroSection } from "./HeroSection";
import { API_BASE_URL, apiFetch } from "@/lib/config";

export default function AuthHeroWrapper() {
  const [mounted, setMounted] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    const cachedUser = localStorage.getItem("akam_user");
    if (cachedUser) {
      setIsLoggedIn(true);
    }

    const checkAuth = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/users/me`);
        if (res.ok) {
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
          localStorage.removeItem("akam_user");
        }
      } catch (e) {
        setIsLoggedIn(false);
      }
    };
    checkAuth();

    const handleAuthUpdate = () => {
      const user = localStorage.getItem("akam_user");
      setIsLoggedIn(!!user);
    };
    window.addEventListener("akam_user_updated", handleAuthUpdate);
    return () => window.removeEventListener("akam_user_updated", handleAuthUpdate);
  }, []);

  if (mounted && isLoggedIn) return null;
  return <HeroSection />;
}

