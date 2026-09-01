"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, X, Bell, User, Menu, ChevronRight, CheckCheck, LogOut } from "lucide-react";
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

export const Navbar: React.FC<NavbarProps> = ({
  onSearch,
  bgColor,
  activeNav,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [targetRedirect, setTargetRedirect] = useState<string>("/submit");
  const [user, setUser] = useState<any>(null);

  // Notifications state
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const notifRef = useRef<HTMLDivElement>(null);

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

    try {
      // Fetch notifications via HttpOnly cookie credentials
      const cRes = await apiFetch(`${API_BASE_URL}/notifications/unread-count`);
      if (cRes.ok) {
        const cData = await cRes.json();
        setUnreadCount(cData.count || 0);
      }

      const nRes = await apiFetch(`${API_BASE_URL}/notifications`);
      if (nRes.ok) {
        setNotifications(await nRes.json());
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    loadUserData();
    window.addEventListener("akam_user_updated", loadUserData);
    window.addEventListener("storage", loadUserData);

    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("akam_user_updated", loadUserData);
      window.removeEventListener("storage", loadUserData);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

  const getUserDisplayName = (u: any) => {
    if (!u) return "";
    if (u.name && u.name.trim().length > 0) {
      return u.name;
    }
    return u.email || "Profile";
  };

  const isMasikaPage = pathname === "/masika" || pathname?.startsWith("/masika");
  const isEventsPage = pathname === "/events" || pathname?.startsWith("/events");
  const isMediaPage = pathname === "/media" || pathname?.startsWith("/media");
  const isAboutPage = pathname === "/about" || pathname?.startsWith("/about");
  const isEditorialPage = pathname === "/editorial" || pathname?.startsWith("/editorial");

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
      ? "Masika"
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
    { name: "Masika", href: "/masika" },
    { name: "Events", href: "/events" },
    { name: "Media", href: "/media" },
    { name: "About", href: "/about" },
  ];

  if (user) {
    navLinks.splice(1, 0, { name: "Library", href: "/library" });
  }

  if (user && ['EDITOR', 'ADMIN'].includes(user.role)) {
    navLinks.push({ name: "Editorial", href: "/editorial" });
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) onSearch(val);
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
    setUser(null);
    window.dispatchEvent(new Event("akam_user_updated"));
    router.push("/");
  };

  return (
    <>
      <header
        className={`w-full ${headerBgClass} py-3.5 relative z-50 border-b border-[#A4A4A4] font-poppins`}
      >
        <div className="container px-4 mx-auto flex items-center justify-between gap-4 sm:gap-6 lg:gap-8">
          {/* Brand Logo & Links */}
          <div className="flex items-center gap-10 lg:gap-14">
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

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center justify-center space-x-6 lg:space-x-8 text-sm lg:text-base font-normal text-gray-800">
              {navLinks.map((link) => {
                const isActive = currentActiveNav === link.name;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`relative py-1 transition-colors group/link ${
                      isActive ? "font-semibold text-gray-950" : "hover:text-black"
                    }`}
                  >
                    <span>{link.name}</span>
                    <span
                      className={`absolute bottom-0 left-0 h-[2.5px] rounded-full transition-all duration-300 bg-[linear-gradient(to_right,#29ACD8,#26AFB1,#23B47B,#57C15C,#7FCA49,#D8E021)] ${
                        isActive ? "w-full" : "w-0 group-hover/link:w-full"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Right Side */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {/* Search Bar */}
            <div className="relative flex items-center">
              {searchOpen ? (
                <div className="relative flex items-center animate-in fade-in zoom-in-95 duration-200">
                  <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search stories..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    autoFocus
                    onBlur={() => !searchQuery && setSearchOpen(false)}
                    className="bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 pl-9 pr-8 py-2 rounded-full w-52 outline-none focus:border-gray-400 transition-all shadow-xs"
                  />
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-2.5 p-1 text-gray-400 hover:text-gray-600 rounded-full"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Notification Bell with Dropdown Popover */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all cursor-pointer shadow-xs"
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

                {/* Notifications Popover Dropdown */}
                {notificationsOpen && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-gray-200 rounded-[24px] shadow-2xl z-50 p-4 font-poppins animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gray-700" />
                        <h4 className="text-sm font-bold text-gray-900">Notifications</h4>
                        {unreadCount > 0 && (
                          <span className="bg-rose-100 text-rose-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                            {unreadCount} Unread
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-gray-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => !n.read && handleMarkRead(n.id)}
                            className={`p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                              n.read
                                ? "bg-white border-gray-100 text-gray-600 hover:bg-gray-50"
                                : "bg-amber-50/60 border-amber-200 text-gray-900 font-medium hover:bg-amber-50"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="leading-snug flex-1">{n.message}</p>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1" />
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1.5 block">
                              {new Date(n.createdAt).toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Auth / Profile Link & Logout Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50 transition-colors shadow-xs"
                >
                  <User className="w-4 h-4 text-gray-600" />
                  <span>{getUserDisplayName(user)}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all cursor-pointer shadow-xs"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleOpenSignIn("/profile")}
                className="text-sm font-medium text-gray-900 bg-white border border-gray-200 px-5 py-2 rounded-full hover:bg-gray-50 transition-colors shadow-xs cursor-pointer"
              >
                Sign in
              </button>
            )}

            {/* Start Writing CTA Button */}
            <Button
              variant="primary"
              size="md"
              onClick={handleStartWriting}
              className="group px-6 py-2.5 text-sm font-medium shadow-xs cursor-pointer"
            >
              Start writing
            </Button>
          </div>

          {/* Mobile Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-gray-700 hover:text-black cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-4 h-4 px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-800 rounded-lg hover:bg-black/5 focus:outline-none cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown / Sidebar */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pb-4 px-4 space-y-4 border-t border-black/10 pt-4 bg-white/95 backdrop-blur-md animate-in slide-in-from-top-2 duration-200">
            <div className="relative flex items-center mb-2">
              <Search className="absolute left-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search stories..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 pl-9 pr-4 py-2.5 rounded-full w-full outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <nav className="flex flex-col space-y-3 font-normal text-base text-gray-800">
              {navLinks.map((link) => {
                const isActive = currentActiveNav === link.name;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="relative py-1.5 w-fit group/mob"
                  >
                    <span className={isActive ? "font-semibold text-black" : "hover:text-black"}>
                      {link.name}
                    </span>
                    <span
                      className={`absolute bottom-0 left-0 h-[2.5px] rounded-full transition-all duration-300 bg-[linear-gradient(to_right,#29ACD8,#26AFB1,#23B47B,#57C15C,#7FCA49,#D8E021)] ${
                        isActive ? "w-full" : "w-0 group-hover/mob:w-full"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <div className="pt-3 border-t border-gray-100 space-y-3">
              {user ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 px-4 py-2 rounded-full flex-1 min-w-0"
                    >
                      <User className="w-4 h-4 text-gray-600 shrink-0" />
                      <span className="truncate">{getUserDisplayName(user)}</span>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<LogOut className="w-3.5 h-3.5" />}
                      iconPosition="left"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 cursor-pointer shrink-0"
                    >
                      Sign out
                    </Button>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleStartWriting}
                    className="w-full justify-center px-6 py-2.5 text-sm font-medium shadow-xs cursor-pointer"
                  >
                    Start writing
                  </Button>
                </>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleOpenSignIn("/profile")}
                    className="text-sm font-medium text-gray-900 bg-gray-50 border border-gray-200 px-5 py-2.5 rounded-full cursor-pointer flex-1"
                  >
                    Sign in
                  </button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleStartWriting}
                    className="group px-6 py-2.5 text-sm font-medium shadow-xs cursor-pointer"
                  >
                    Start writing
                  </Button>
                </div>
              )}
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
