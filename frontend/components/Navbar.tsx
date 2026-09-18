"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, X, Bell, User, Menu, ChevronRight, CheckCheck, LogOut, Loader2, BookOpen, ArrowRight, Flag, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import Button from "./ui/Button";
import AuthModal from "./AuthModal";
import { API_BASE_URL, apiFetch } from "@/lib/config";

export interface NavbarProps {
  onSearch?: (query: string) => void;
  bgColor?: string;
  activeNav?: string;
}

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  read: boolean;
  relatedStoryId: string | null;
  createdAt: string;
}

interface SearchResultStory {
  id: string;
  title: string;
  slug: string;
  category?: string;
  coverImageUrl?: string | null;
  authorName?: string | null;
  authorEmail?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearch,
  bgColor,
  activeNav,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultStory[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [targetRedirect, setTargetRedirect] = useState<string>("/submit");
  const [user, setUser] = useState<any>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifPage, setNotifPage] = useState<number>(1);
  const [hasMoreNotifs, setHasMoreNotifs] = useState<boolean>(true);
  const [isLoadingNotifs, setIsLoadingNotifs] = useState<boolean>(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const notifScrollRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (pageToFetch: number = 1, append: boolean = false) => {
    if (isLoadingNotifs) return;
    setIsLoadingNotifs(true);
    try {
      const cRes = await apiFetch(`${API_BASE_URL}/notifications/unread-count`, { cache: "no-store" });
      if (cRes.ok) {
        const cData = await cRes.json();
        setUnreadCount(cData.count || 0);
      }

      const limit = 8;
      const nRes = await apiFetch(
        `${API_BASE_URL}/notifications?page=${pageToFetch}&limit=${limit}`,
        { cache: "no-store" }
      );
      if (nRes.ok) {
        const json = await nRes.json();
        const items: NotificationItem[] = json.data || (Array.isArray(json) ? json : []);
        const meta = json.meta || { hasMore: false };

        setHasMoreNotifs(Boolean(meta.hasMore));
        setNotifPage(pageToFetch);

        if (append) {
          setNotifications((prev) => {
            const existingIds = new Set(prev.map((i) => i.id));
            const newUnique = items.filter((i) => !existingIds.has(i.id));
            return [...prev, ...newUnique];
          });
        } else {
          setNotifications(items);
        }
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setIsLoadingNotifs(false);
    }
  };

  const loadUserData = async () => {
    const savedUser = localStorage.getItem("akam_user");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error(e);
      }
    } else {
      setUser(null);
    }

    await fetchNotifications();
  };

  // Lock body scroll when mobile menu drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Live search effect
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      setShowSearchDropdown(true);
      try {
        const res = await apiFetch(
          `${API_BASE_URL}/stories?status=APPROVED&limit=5&search=${encodeURIComponent(searchQuery.trim())}`
        );
        if (res.ok) {
          const json = await res.json();
          const data = json.data || (Array.isArray(json) ? json : []);
          setSearchResults(data);
        }
      } catch (err) {
        console.error("Live search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    loadUserData();
    window.addEventListener("akam_user_updated", loadUserData);
    window.addEventListener("storage", loadUserData);

    // Real-time polling for notifications every 12 seconds
    const pollInterval = setInterval(() => {
      if (localStorage.getItem("akam_user")) {
        fetchNotifications();
      }
    }, 12000);

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("akam_user_updated", loadUserData);
      window.removeEventListener("storage", loadUserData);
      document.removeEventListener("mousedown", handleClickOutside);
      clearInterval(pollInterval);
    };
  }, []);

  const toggleNotifications = () => {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    if (nextState) {
      fetchNotifications(1, false);
    }
  };

  const handleNotifScroll = () => {
    if (!notifScrollRef.current || isLoadingNotifs || !hasMoreNotifs) return;
    const { scrollTop, scrollHeight, clientHeight } = notifScrollRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 30) {
      fetchNotifications(notifPage + 1, true);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch(`${API_BASE_URL}/notifications/read-all`, {
        method: "PATCH",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiFetch(`${API_BASE_URL}/notifications/${id}/read`, {
        method: "PATCH",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.read && n.id && !n.id.startsWith("sample-")) {
      await handleMarkRead(n.id);
    }
    setNotificationsOpen(false);

    // If report notification or editorial alert
    if (n.type === "CONTENT_REPORTED" || n.message?.includes("flagged for review") || n.message?.includes("reported")) {
      if (user?.role === "EDITOR" || user?.role === "ADMIN") {
        router.push("/editorial?tab=reports&page=1");
        return;
      }
    }

    // If story submission notification
    if (n.type === "STORY_SUBMITTED" && (user?.role === "EDITOR" || user?.role === "ADMIN")) {
      router.push("/editorial?tab=queue&page=1");
      return;
    }

    // If related story is present and not removed
    if (n.relatedStoryId && n.type !== "CONTENT_REMOVED") {
      router.push(`/works/${n.relatedStoryId}`);
      return;
    }
  };

  const getUserDisplayName = (u: any) => {
    if (!u) return "";
    if (u.name && u.name.trim().length > 0) {
      return u.name;
    }
    return u.email || "Profile";
  };

  const renderNotificationText = (text: string) => {
    if (!text) return "";
    const parts = text.split(/('.*?')/g);
    return parts.map((part, index) => {
      if (part.startsWith("'") && part.endsWith("'")) {
        return (
          <span key={index} className="text-[#22B573] font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const isMasikaPage = pathname === "/emagazine" || pathname?.startsWith("/emagazine");
  const isEventsPage = pathname === "/events" || pathname?.startsWith("/events");
  const isMediaPage = pathname === "/media" || pathname?.startsWith("/media");
  const isAboutPage = pathname === "/about" || pathname?.startsWith("/about");
  const isEditorialPage = pathname === "/editorial" || pathname?.startsWith("/editorial/");

  const isLibraryPage = pathname === "/library" || pathname?.startsWith("/library");

  const headerBgClass =
    bgColor ||
    (isMasikaPage
      ? "bg-transparent"
      : isAboutPage
        ? "bg-[#DBF4FF]"
        : "bg-white");

  const currentActiveNav =
    activeNav ||
    (isMasikaPage
      ? "E-Magazine"
      : isEventsPage
        ? "Events"
        : isMediaPage
          ? "Media"
          : isAboutPage
            ? "About"
            : isLibraryPage
              ? "Library"
              : isEditorialPage
                ? "Editorial"
                : "");

  const navLinks = [
    { name: "E-Magazine", href: "/emagazine" },
    { name: "Events", href: "/events" },
    { name: "Media", href: "/media" },
    { name: "About", href: "/about" },
  ];

  if (user) {
    navLinks.splice(4, 0, { name: "Library", href: "/library" });
  }

  if (user && ['EDITOR', 'ADMIN'].includes(user.role)) {
    navLinks.push({ name: "Editorial", href: "/editorial" });
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) onSearch(val);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setShowSearchDropdown(false);
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
    if (onSearch) onSearch(searchQuery.trim());
    router.push(`/works?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSelectSearchResult = (slugOrId: string) => {
    setShowSearchDropdown(false);
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setMobileMenuOpen(false);
    router.push(`/works/${slugOrId}`);
  };

  const handleStartWriting = () => {
    setMobileMenuOpen(false);
    if (user || localStorage.getItem("akam_user")) {
      router.push("/submit");
    } else {
      setTargetRedirect("/submit");
      setAuthModalOpen(true);
    }
  };

  const handleOpenSignIn = (intendedPath: string = "/profile") => {
    setMobileMenuOpen(false);
    setTargetRedirect(intendedPath);
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    try {
      await apiFetch(`${API_BASE_URL}/auth/logout`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
    localStorage.removeItem("akam_user");
    localStorage.removeItem("akam_token");
    document.cookie = "akam_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0";
    setUser(null);
    window.dispatchEvent(new Event("akam_user_updated"));
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header
        className={`w-full ${headerBgClass} py-3.5 relative z-50 border-b border-[#A4A4A4] font-poppins`}
      >
        <div className="container px-4 mx-auto flex items-center justify-between gap-4 sm:gap-6 lg:gap-8 relative">
          {/* Brand Logo & Links */}
          <div className="flex items-center gap-8 lg:gap-10">
            <Link href="/" className="flex items-center shrink-0 group">
              <Image
                src="/images/akamdigital.png"
                alt="AKAM Digital Logo"
                width={300}
                height={100}
                priority
                className="h-10 sm:h-14 w-auto object-contain transition-transform"
              />
            </Link>

            {/* Desktop Navigation Links + Search Icon */}
            <nav className="hidden lg:flex items-center justify-center space-x-6 lg:space-x-8 text-sm lg:text-base font-normal text-gray-800">
              {navLinks.map((link) => {
                const isActive = currentActiveNav === link.name;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative py-1 transition-colors group/link ${isActive ? "font-semibold text-gray-950" : "hover:text-black"}`}
                  >
                    <span>{link.name}</span>
                    <span
                      className={`absolute bottom-0 left-0 h-[2.5px] rounded-full transition-all duration-300 bg-[linear-gradient(to_right,#29ACD8,#26AFB1,#23B47B,#57C15C,#7FCA49,#D8E021)] ${isActive ? "w-full" : "w-0 group-hover/link:w-full"}`}
                    />
                  </Link>
                );
              })}

              {/* Search Icon right next to About link */}
              <div className="relative flex items-center" ref={searchRef}>
                {searchOpen ? (
                  <form
                    onSubmit={handleSearchSubmit}
                    className="relative flex items-center animate-in fade-in zoom-in-95 duration-200"
                  >
                    <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search works..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      autoFocus
                      className="bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 pl-9 pr-8 py-1.5 rounded-full w-52 outline-none focus:border-gray-400 focus:ring-2 focus:ring-black/5 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setShowSearchDropdown(false);
                      }}
                      className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search"
                    className="p-1.5 text-gray-700 hover:text-black transition-colors cursor-pointer"
                    title="Search"
                  >
                    <Search className="w-4 h-4 text-gray-700" />
                  </button>
                )}

                {/* Desktop Live Search Results Dropdown */}
                {searchOpen && showSearchDropdown && (
                  <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden font-poppins animate-in fade-in zoom-in-95 duration-150">
                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-gray-500" /> Top Matches
                      </span>
                      {isSearching && <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />}
                    </div>

                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                      {isSearching ? (
                        <div className="p-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          <span>Searching works...</span>
                        </div>
                      ) : searchResults.length === 0 ? (
                        <div className="p-4 text-center text-xs text-gray-500">
                          No works found for &ldquo;{searchQuery}&rdquo;
                        </div>
                      ) : (
                        searchResults.map((story) => (
                          <div
                            key={story.id}
                            onClick={() => handleSelectSearchResult(story.slug || story.id)}
                            className="p-3 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer group"
                          >
                            <div className="relative w-10 h-1
                            0 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                              <Image
                                src={story.coverImageUrl || "/images/stories/ramachi.jpg"}
                                alt={story.title}
                                fill
                                unoptimized
                                className="object-cover group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-gray-900 group-hover:text-black truncate leading-snug">
                                {story.title}
                              </h5>
                              <p className="text-[10px] text-gray-500 truncate mt-0.5">
                                By {story.authorName || story.authorEmail || "Author"} &bull; {story.category || "Story"}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 shrink-0 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden lg:flex items-center space-x-3 lg:space-x-4">
            {/* Desktop Notification Bell (rounded-2xl box) */}
            {user && (
              <button
                onClick={toggleNotifications}
                className="relative w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-2xs"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth / Profile Link & Dropdown Card */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  className="relative w-10 h-10 rounded-full p-[1.5px] bg-[linear-gradient(to_bottom,#00A2D0,#D9E021)] flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity shadow-2xs"
                  aria-label="User menu"
                  title={getUserDisplayName(user)}
                >
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-white flex items-center justify-center">
                    {user?.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={getUserDisplayName(user)}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white font-bold text-sm">
                        {(getUserDisplayName(user)[0] || "U").toUpperCase()}
                      </div>
                    )}
                  </div>
                </button>

                {/* Profile Card Dropdown Popover */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-72 p-[2px] bg-[linear-gradient(to_bottom,#00A2D0,#D9E021)] rounded-2xl shadow-xl z-50 font-poppins animate-in fade-in duration-150">
                    <div className="bg-white rounded-[14px] p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-full p-[1.5px] bg-[linear-gradient(to_bottom,#00A2D0,#D9E021)] shrink-0 overflow-hidden">
                          <div className="w-full h-full rounded-full overflow-hidden relative bg-white flex items-center justify-center">
                            {user?.avatarUrl ? (
                              <Image
                                src={user.avatarUrl}
                                alt={getUserDisplayName(user)}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white font-bold text-sm">
                                {(getUserDisplayName(user)[0] || "U").toUpperCase()}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {getUserDisplayName(user)}
                          </p>
                          <p className="text-xs text-gray-400 truncate capitalize">
                            {user?.role ? user.role.toLowerCase() : "Author"}
                          </p>
                        </div>
                      </div>

                      <div className="border-b border-gray-100 my-3" />

                      <div className="space-y-1">
                        <Link
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="block py-1.5 text-sm font-medium text-gray-700 hover:text-black transition-colors"
                        >
                          View Profile
                        </Link>

                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center justify-between py-1.5 text-sm font-medium text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <span>Log Out</span>
                          <LogOut className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleOpenSignIn("/profile")}
                className="text-sm font-medium text-gray-900 bg-white border border-gray-200 px-5 py-2 rounded-full hover:bg-gray-50 transition-colors shadow-2xs cursor-pointer"
              >
                Sign in
              </button>
            )}

            {/* Start Writing CTA Button */}
            <Button
              variant="primary"
              size="md"
              onClick={handleStartWriting}
              className="group px-6 py-2.5 text-sm font-medium shadow-xs cursor-pointer rounded-full"
            >
              Start writing
            </Button>
          </div>

          {/* Mobile Right Controls: Search Icon, Bell, Menu */}
          <div className="flex lg:hidden items-center gap-1.5">
            {/* Mobile Search Toggle Icon */}
            <button
              onClick={() => {
                const nextState = !mobileSearchOpen;
                setMobileSearchOpen(nextState);
                if (!nextState) {
                  setShowSearchDropdown(false);
                } else if (searchQuery.trim().length >= 2) {
                  setShowSearchDropdown(true);
                }
              }}
              className="p-2 text-gray-700 hover:text-black rounded-full hover:bg-black/5 cursor-pointer transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Mobile Notifications Bell */}
            {user && (
              <button
                onClick={toggleNotifications}
                className="relative p-2 text-gray-700 hover:text-black rounded-full hover:bg-black/5 cursor-pointer transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}

            {/* Mobile Hamburger Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-gray-800 rounded-lg hover:bg-black/5 focus:outline-none cursor-pointer transition-colors"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Header Search Bar (Expands Below Navbar) */}
          {mobileSearchOpen && (
            <div
              ref={mobileSearchRef}
              className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 shadow-md z-40 animate-in fade-in slide-in-from-top-2 duration-200 font-poppins"
            >
              <div className="flex items-center gap-2 relative">
                <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center relative">
                  <Search className="absolute left-3.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search works..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoFocus
                    className="w-full bg-gray-100 border border-transparent focus:border-gray-300 text-sm text-gray-900 placeholder-gray-400 pl-10 pr-9 py-2.5 rounded-full outline-none focus:ring-2 focus:ring-black/5"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        setShowSearchDropdown(false);
                      }}
                      className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </form>

                <button
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setShowSearchDropdown(false);
                  }}
                  className="text-xs font-semibold text-gray-600 hover:text-black px-2.5 py-2 rounded-lg cursor-pointer shrink-0"
                >
                  Cancel
                </button>
              </div>

              {/* Mobile Live Search Results Dropdown */}
              {showSearchDropdown && (
                <div className="mt-2.5 w-full bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden font-poppins animate-in fade-in zoom-in-95 duration-150">
                  <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Search className="w-3.5 h-3.5 text-gray-500" /> Top Matches
                    </span>
                    {isSearching && <Loader2 className="w-3.5 h-3.5 text-gray-500 animate-spin" />}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
                    {isSearching ? (
                      <div className="p-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        <span>Searching works...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-4 text-center text-xs text-gray-500">
                        No works found for &ldquo;{searchQuery}&rdquo;
                      </div>
                    ) : (
                      searchResults.map((story) => (
                        <div
                          key={story.id}
                          onClick={() => handleSelectSearchResult(story.slug || story.id)}
                          className="p-3 hover:bg-gray-50 flex items-center gap-3 transition-colors cursor-pointer group"
                        >
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                            <Image
                              src={story.coverImageUrl || "/images/stories/ramachi.jpg"}
                              alt={story.title}
                              fill
                              unoptimized
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-gray-900 group-hover:text-black truncate leading-snug">
                              {story.title}
                            </h5>
                            <p className="text-[10px] text-gray-500 truncate mt-0.5">
                              By {story.authorName || story.authorEmail || "Author"} &bull; {story.category || "Story"}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-900 shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Responsive Notifications Popover Dropdown (Mobile + Desktop) */}
          {user && notificationsOpen && (
            <div
              ref={notifRef}
              className="absolute right-4 lg:right-16 top-full mt-3 w-[calc(100vw-32px)] sm:w-[350px] bg-white border border-[#22B5738A] rounded-[24px] shadow-xl z-50 p-5 font-poppins animate-in fade-in duration-150"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                <h4 className="text-base font-bold text-gray-900">Notifications</h4>
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  Mark All as Read
                </button>
              </div>

              {/* Items List */}
              <div
                ref={notifScrollRef}
                onScroll={handleNotifScroll}
                className="max-h-80 overflow-y-auto divide-y divide-gray-100/60 pr-1"
              >
                {notifications.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-2 text-gray-400">
                      <Bell className="w-5 h-5 text-gray-300" />
                    </div>
                    <p className="text-xs font-bold text-gray-800">No notifications yet</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      You will be notified about updates to your stories, approvals, and comments.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isReportType = n.type === "CONTENT_REPORTED";
                    const isRemovalType = n.type === "CONTENT_REMOVED";
                    const isResolvedType = n.type === "REPORT_RESOLVED";
                    const isDismissedType = n.type === "REPORT_DISMISSED";

                    return (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`py-3 px-3 transition-colors cursor-pointer rounded-xl ${
                          !n.read
                            ? isReportType
                              ? "bg-rose-50/70 border border-rose-100 my-2"
                              : isRemovalType
                                ? "bg-amber-50/70 border border-amber-100 my-2"
                                : "bg-[#F4FBF7] my-2 first:mt-0 last:mb-0 !border-none"
                            : "bg-white hover:bg-gray-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          {isReportType && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                              <Flag className="w-2.5 h-2.5" /> Moderation Flag
                            </span>
                          )}
                          {isRemovalType && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="w-2.5 h-2.5" /> Action Notice
                            </span>
                          )}
                          {isResolvedType && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Resolved
                            </span>
                          )}
                          {isDismissedType && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                              Reviewed
                            </span>
                          )}
                          {n.createdAt && (
                            <span className="text-[10px] text-gray-400 ml-auto">
                              {new Date(n.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-[13px] text-gray-800 leading-relaxed font-normal">
                          {renderNotificationText(n.message)}
                        </p>
                      </div>
                    );
                  })
                )}

                {isLoadingNotifs && (
                  <div className="py-3 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#22B573]" />
                    <span>Loading more notifications...</span>
                  </div>
                )}
              </div>

       
            </div>
          )}
        </div>

        {/* Mobile Navigation Drawer Modal */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden font-poppins">
            {/* Dark Backdrop Overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Panel */}
            <div className="fixed inset-y-0 left-0 z-50 w-full max-w-xs sm:max-w-sm bg-white shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-left duration-300 ease-out">
              {/* Top Section: Logo & Close Button (Identically aligned with main navbar) */}
              <div>
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#A4A4A4] bg-white">
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center shrink-0">
                    <Image
                      src="/images/akamdigital.png"
                      alt="AKAM Digital Logo"
                      width={300}
                      height={100}
                      priority
                      className="h-10 sm:h-14 w-auto object-contain transition-transform"
                    />
                  </Link>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    aria-label="Close menu"
                    className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="p-6 flex flex-col space-y-2">
                  {navLinks.map((link) => {
                    const isActive = currentActiveNav === link.name;
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive
                            ? "bg-gray-900 text-white font-semibold shadow-xs"
                            : "text-gray-800 hover:bg-gray-100 font-medium"
                          }`}
                      >
                        <span>{link.name}</span>
                        <ChevronRight
                          className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-400"}`}
                        />
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Bottom Section: Profile / Actions */}
              <div className="p-6 pt-4 border-t border-gray-100 space-y-4">
                {user ? (
                  <>
                    <div className="flex items-center justify-between gap-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                      <Link
                        href="/profile"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 min-w-0 flex-1"
                      >
                        <div className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-gray-700" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {getUserDisplayName(user)}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                        </div>
                      </Link>
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        title="Sign out"
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                      </button>
                    </div>

                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleStartWriting}
                      className="w-full justify-center py-3 text-sm font-semibold shadow-md cursor-pointer rounded-full"
                    >
                      Start writing
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleStartWriting}
                      className="w-full justify-center py-3 text-sm font-semibold shadow-md cursor-pointer rounded-full"
                    >
                      Start writing
                    </Button>
                    <button
                      onClick={() => handleOpenSignIn("/profile")}
                      className="w-full py-3 text-sm font-semibold text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors cursor-pointer text-center"
                    >
                      Sign in
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        redirectTo={targetRedirect}
        onSuccess={(u) => {
          setUser(u);
          loadUserData();
        }}
      />
    </>
  );
};

export default Navbar;
