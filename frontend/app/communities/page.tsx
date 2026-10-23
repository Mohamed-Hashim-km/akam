"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, MessageSquare, ArrowRight, Sparkles, BookOpen, Layers } from "lucide-react";
import { API_BASE_URL, apiFetch } from "@/lib/config";

interface Community {
  id: string;
  slug: string;
  name: string;
  title?: string;
  description: string | null;
  color: string | null;
  memberCount?: number;
  postCount?: number;
  _count?: {
    members?: number;
    posts?: number;
  };
}

const FALLBACK_PALETTE = [
  "#FEE2E2",
  "#FEF3C7",
  "#E0E7FF",
  "#DCFCE7",
  "#F3E8FF",
  "#FFEDD5",
  "#E0F2FE",
  "#FCE7F3",
];

export default function CommunitiesPage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchCommunities = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/communities`);
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : json?.data || [];
          if (isMounted) {
            setCommunities(list);
          }
        }
      } catch (err) {
        console.error("Failed to fetch communities", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCommunities();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 sm:py-16 lg:py-20 font-poppins">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Malayalam Literary Circles</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-950 tracking-tight mb-4">
            AKAM Communities
          </h1>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Discover discussion circles dedicated to Malayalam stories, poetry, novellas, translations, and cultural discourses. Join conversations with passionate readers and writers.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse space-y-4"
              >
                <div className="h-6 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-8 bg-gray-100 rounded w-1/3 pt-4" />
              </div>
            ))}
          </div>
        ) : communities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-8">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No communities available yet</h3>
            <p className="text-sm text-gray-500">Check back soon for new literary discussion circles.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((comm, index) => {
              const slug =
                comm.slug ||
                (comm.name || comm.title || "")
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-");
              const title = comm.name || comm.title || "Community";
              const bgColor = comm.color || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
              const memberCount = comm.memberCount ?? comm._count?.members ?? 0;
              const postCount = comm.postCount ?? comm._count?.posts ?? 0;

              return (
                <Link
                  key={comm.id || slug}
                  href={`/communities/${slug}`}
                  className="group relative flex flex-col justify-between bg-white rounded-2xl p-6 border border-black/[0.06] shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  <div>
                    {/* Top Accent pill */}
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-gray-800 text-sm shadow-sm"
                        style={{ backgroundColor: bgColor }}
                      >
                        <Layers className="w-5 h-5 opacity-80" />
                      </div>
                      <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 group-hover:text-emerald-700 transition-colors">
                        Explore <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 group-hover:text-emerald-800 transition-colors mb-2">
                      {title}
                    </h2>

                    {comm.description ? (
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-3 leading-relaxed mb-4">
                        {comm.description}
                      </p>
                    ) : (
                      <p className="text-xs sm:text-sm text-gray-400 italic mb-4">
                        A dedicated Malayalam literary discussion space on AKAM Digital.
                      </p>
                    )}
                  </div>

                  {/* Footer stats */}
                  <div className="pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <strong className="text-gray-700">{memberCount}</strong> {memberCount === 1 ? "member" : "members"}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
                      <strong className="text-gray-700">{postCount}</strong> {postCount === 1 ? "discussion" : "discussions"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
