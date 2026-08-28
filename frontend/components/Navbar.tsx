"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Search, Menu, X } from "lucide-react";
import Button from "./ui/Button";

export interface NavbarProps {
  onSearch?: (query: string) => void;
  bgColor?: string;
  activeNav?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onSearch,
  bgColor,
  activeNav,
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isMasikaPage = pathname === "/masika" || pathname?.startsWith("/masika");
  const isEventsPage = pathname === "/events" || pathname?.startsWith("/events");
  const isMediaPage = pathname === "/media" || pathname?.startsWith("/media");
  const isAboutPage = pathname === "/about" || pathname?.startsWith("/about");

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
      : "");

  const navLinks = [
    { name: "Masika", href: "/masika" },
    { name: "Events", href: "/events" },
    { name: "Media", href: "/media" },
    { name: "About", href: "/about" },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) onSearch(val);
  };

  return (
    <header
      className={`w-full ${headerBgClass} py-3.5 relative z-50 border-b border-[#A4A4A4]`}
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

                  {/* Gradient Underline Indicator (Active & Hover) */}
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

        {/* Desktop Right Side (Search Circle + Sign In + Start Writing CTA) */}
        <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
          {/* Search Button / Bar */}
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

          {/* Sign In Link / Pill */}
          <Link
            href="#signin"
            className="text-sm font-medium text-gray-900 bg-white border border-gray-200 px-5 py-2 rounded-full hover:bg-gray-50 transition-colors shadow-xs"
          >
            Sign in
          </Link>

          {/* Start Writing CTA Button */}
          <Button
            variant="primary"
            size="md"
            className="group px-6 py-2.5 text-sm font-medium shadow-xs"
          >
            Start writing
          </Button>
        </div>

        {/* Mobile Toggle Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-gray-800 rounded-lg hover:bg-black/5 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pb-4 px-4 space-y-4 border-t border-black/5 pt-4 animate-in slide-in-from-top-2 duration-200">
          <div className="relative flex items-center mb-2">
            <Search className="absolute left-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search stories..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-white border border-gray-200 text-sm text-gray-900 placeholder-gray-400 pl-9 pr-4 py-2 rounded-full w-full outline-none focus:ring-2 focus:ring-black/10"
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
                  className="relative py-1 w-fit group/mob"
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

          <div className="flex items-center justify-between pt-2 gap-3">
            <Link
              href="#signin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-dark-bg"
            >
              Sign in
            </Link>
            <Button
              variant="primary"
              size="md"
              className="group px-6 py-2.5 text-sm font-medium shadow-xs"
            >
              Start writing
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
