"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Menu, X } from "lucide-react";
import Button from "./ui/Button";

export interface NavbarProps {
  onSearch?: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navLinks = [
    { name: "Masika", href: "#masika" },
    { name: "Events", href: "#events" },
    { name: "Media", href: "#media" },
    { name: "Communities", href: "#communities" },
    { name: "Discover", href: "#discover" },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) onSearch(val);
  };

  return (
    <header className="w-full bg-accent-yellow py-4 px-4 sm:px-6 lg:px-12 transition-all">
      <div className="container px-4 mx-auto flex items-center justify-between gap-4 sm:gap-6 lg:gap-8">
        {/* Brand Logo & Links */}
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center shrink-0 group">
            <Image
              src="/images/akamdigital.png"
              alt="AKAM Digital Logo"
              width={160}
              height={48}
              priority
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center justify-center space-x-6 lg:space-x-8 font-medium lg:text-lg text-dark-bg/80">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-black/70 transition-colors py-1 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-black/80 hover:after:w-full after:transition-all"
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Desktop Right Side (Search + Sign In + CTA) */}
        <div className="hidden lg:flex items-center space-x-4">
          {/* Search Pill */}
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-black/50 pointer-events-none" />
            <input
              type="text"
              placeholder="Search stories.."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-white/90 focus:bg-white lg:text-lg text-dark-bg placeholder-black/40 pl-9 pr-4 py-2 rounded-full w-48 xl:w-56 outline-none focus:ring-2 focus:ring-black/20 shadow-xs transition-all"
            />
          </div>

          {/* Sign In Link */}
          <Link
            href="#signin"
            className="lg:text-lg font-medium text-dark-bg hover:text-black/70 px-2 py-1 transition-colors"
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
            className="p-2 text-dark-bg rounded-lg hover:bg-black/10 focus:outline-none"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pb-4 px-2 space-y-4 border-t border-black/10 pt-4 animate-in slide-in-from-top-2 duration-200">
          <div className="relative flex items-center mb-2">
            <Search className="absolute left-3.5 w-4 h-4 text-black/50" />
            <input
              type="text"
              placeholder="Search stories.."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-white text-sm text-dark-bg placeholder-black/40 pl-9 pr-4 py-2 rounded-full w-full outline-none"
            />
          </div>

          <nav className="flex flex-col space-y-3 font-medium text-base text-dark-bg">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-black/70 py-1 border-b border-black/5"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-between pt-2">
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
