"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Image as ImageIcon, Send, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, LogIn, Eye, Edit3, Calendar, Save } from "lucide-react";
import Button from "@/components/ui/Button";
import AuthModal from "@/components/AuthModal";
import { API_BASE_URL, apiFetch } from "@/lib/config";

export default function SubmitStoryPage() {
  const router = useRouter();
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Fiction");
  const [content, setContent] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/categories`);
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
          setCategories(list);
          if (list.length > 0) {
            setCategory((prev) => (prev && prev !== "General" ? prev : list[0].name));
          }
        }
      } catch (e) {
        console.error("Failed to fetch categories", e);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiFetch(`${API_BASE_URL}/users/me`);
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          localStorage.setItem("akam_user", JSON.stringify(userData));
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setAuthModalOpen(true);
        }
      } catch (e) {
        setIsAuthenticated(false);
        setAuthModalOpen(true);
      }
    };
    checkAuth();
  }, []);

  const convertMarkdownToHtml = (mdStr: string): string => {
    if (!mdStr) return "";
    let html = mdStr;

    // Convert markdown images ![alt](url) to HTML <div contenteditable="false"...><img src="url" .../></div>
    html = html.replace(
      /!\[(.*?)\]\((.*?)\)/g,
      '<div contenteditable="false" class="my-6 text-center select-none"><img src="$2" alt="$1" class="max-h-[420px] w-auto mx-auto rounded-2xl border border-gray-200 shadow-md object-cover inline-block" /></div><p><br></p>'
    );

    const paragraphs = html.split("\n\n").filter(Boolean);
    return paragraphs
      .map((p) => {
        if (p.trim().startsWith('<div contenteditable="false"')) return p;
        return `<p>${p}</p>`;
      })
      .join("");
  };

  // Fetch story details if editing an existing draft
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const id = params.get("id");
      if (id) {
        setEditingStoryId(id);
        apiFetch(`${API_BASE_URL}/stories/${id}`).then(async (res) => {
          if (res.ok) {
            const s = await res.json();
            setTitle(s.title || "");
            setCategory(s.category || "Fiction");
            const formattedHtml = convertMarkdownToHtml(s.content || "");
            setContent(formattedHtml);
            if (s.coverImageUrl) {
              setCoverPreview(s.coverImageUrl);
            }
            if (editorRef.current) {
              editorRef.current.innerHTML = formattedHtml;
            }
          }
        });
      }
    }
  }, []);

  // Ensure contenteditable div stays synced when active tab switches
  useEffect(() => {
    if (activeTab === "write" && editorRef.current && content) {
      if (!editorRef.current.innerHTML.trim()) {
        editorRef.current.innerHTML = content;
      }
    }
  }, [activeTab, content]);

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch(`${API_BASE_URL}/uploads/image`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        const imgUrl = data.url;

        if (editorRef.current) {
          editorRef.current.focus();
          const imgElementHtml = `<div contenteditable="false" class="my-6 text-center select-none"><img src="${imgUrl}" alt="Inline image" class="max-h-[420px] w-auto mx-auto rounded-2xl border border-gray-200 shadow-md object-cover inline-block" /></div><p><br></p>`;
          document.execCommand("insertHTML", false, imgElementHtml);
          setContent(editorRef.current.innerHTML);
        } else {
          const markdownImg = `\n![Inline Image](${imgUrl})\n`;
          setContent((prev) => prev + markdownImg);
        }
      } else {
        alert("Failed to upload inline image");
      }
    } catch (err) {
      console.error(err);
      alert("Error uploading image");
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  };

  const convertHtmlToMarkdown = (htmlStr: string): string => {
    let result = htmlStr;
    result = result.replace(/<div contenteditable="false".*?<img src="(.*?)".*?<\/div>/g, '\n\n![Inline Image]($1)\n\n');
    result = result.replace(/<img src="(.*?)".*?>/g, '\n\n![Inline Image]($1)\n\n');
    result = result.replace(/<p><br\s*\/?>\s*<\/p>/gi, '\n\n');
    result = result.replace(/<p>/gi, '').replace(/<\/p>/gi, '\n\n');
    result = result.replace(/<br\s*\/?>/gi, '\n\n');
    result = result.replace(/<div>/gi, '\n\n').replace(/<\/div>/gi, '');
    result = result.replace(/\n{3,}/g, '\n\n');
    return result.trim();
  };

  const handleSaveStory = async (isSubmitForReview: boolean) => {
    const rawEditorHtml = editorRef.current ? editorRef.current.innerHTML : content;
    const markdownContent = convertHtmlToMarkdown(rawEditorHtml);

    if (!title.trim() || !markdownContent.trim()) {
      setError("Please fill in both title and story content.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Ensure user has AUTHOR role
      await apiFetch(`${API_BASE_URL}/users/me/become-author`, {
        method: "POST",
      });

      let story: any;

      if (editingStoryId) {
        // Update existing draft
        const storyRes = await apiFetch(`${API_BASE_URL}/stories/${editingStoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content: markdownContent, category }),
        });
        if (!storyRes.ok) {
          const errData = await storyRes.json();
          throw new Error(errData.message || "Failed to update story");
        }
        story = await storyRes.json();
      } else {
        // Create new draft
        const storyRes = await apiFetch(`${API_BASE_URL}/stories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content: markdownContent, category }),
        });
        if (!storyRes.ok) {
          const errData = await storyRes.json();
          throw new Error(errData.message || "Failed to save story");
        }
        story = await storyRes.json();
      }

      // 3. Upload cover image if provided
      if (coverFile) {
        const formData = new FormData();
        formData.append("file", coverFile);
        await apiFetch(`${API_BASE_URL}/stories/${story.id}/cover`, {
          method: "POST",
          body: formData,
        });
      }

      // 4. Submit for review if requested
      if (isSubmitForReview) {
        const submitRes = await apiFetch(`${API_BASE_URL}/stories/${story.id}/submit`, {
          method: "POST",
        });

        if (!submitRes.ok) {
          throw new Error("Story saved, but failed to submit to pending queue");
        }
        setSuccess("Your story has been submitted for editorial review!");
      } else {
        setSuccess(editingStoryId ? "Draft updated successfully!" : "Story draft saved successfully!");
      }

      setTimeout(() => {
        router.push("/profile");
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Something went wrong saving your story");
    } finally {
      setLoading(false);
    }
  };

  const renderVisualContent = () => {
    const rawEditorHtml = editorRef.current ? editorRef.current.innerHTML : content;
    const markdownContent = convertHtmlToMarkdown(rawEditorHtml);

    // Regex to match both markdown ![alt](src) and HTML <img src="...">
    const regex = /!\[(.*?)\]\((.*?)\)|<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    const parts: Array<{ type: "text"; value: string } | { type: "image"; src: string; alt: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(markdownContent)) !== null) {
      if (match.index > lastIndex) {
        const rawText = markdownContent.substring(lastIndex, match.index);
        const cleanText = rawText.replace(/<[^>]*>/g, '').trim();
        if (cleanText) {
          parts.push({ type: "text", value: cleanText });
        }
      }

      const imgSrc = match[2] || match[3] || "";
      const imgAlt = match[1] || "Inline Image";
      if (imgSrc) {
        parts.push({ type: "image", alt: imgAlt, src: imgSrc });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < markdownContent.length) {
      const rawText = markdownContent.substring(lastIndex);
      const cleanText = rawText.replace(/<[^>]*>/g, '').trim();
      if (cleanText) {
        parts.push({ type: "text", value: cleanText });
      }
    }

    const currentDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const authorDisplayName = user?.name && user.name.trim().length > 0
      ? user.name
      : user?.email || "AKAM Author";

    return (
      <article className="bg-white rounded-[32px] p-6 sm:p-10 border border-gray-200 shadow-sm max-w-3xl mx-auto font-poppins space-y-6">
        {/* Category & Badge */}
        <div className="flex items-center gap-2">
          <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl shadow-xs">
            PUBLISHED ARTICLE
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> {currentDate}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-950 tracking-tight leading-tight">
          {title || "Untitled Story"}
        </h1>

        {/* Author Header */}
        <div className="flex items-center justify-between py-4 border-y border-gray-100 my-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt="Author" fill className="object-cover" unoptimized />
              ) : (
                <span>{(authorDisplayName)[0].toUpperCase()}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{authorDisplayName}</p>
              <p className="text-xs text-gray-500">Verified AKAM Author</p>
            </div>
          </div>

          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            Live Reader View
          </span>
        </div>

        {/* Body Blocks & Inline Images */}
        {parts.length === 0 ? (
          <div className="py-12 text-center text-gray-400 italic text-sm">
            Story content preview will render here as you write...
          </div>
        ) : (
          <div className="space-y-4 pt-2 text-gray-900 font-normal text-base sm:text-lg">
            {parts.map((part, index) => {
              if (part.type === "image") {
                return (
                  <div key={index} className="my-6 sm:my-8 flex justify-center">
                    <img
                      src={part.src}
                      alt={part.alt}
                      className="w-full max-w-3xl h-auto max-h-[500px] object-cover rounded-2xl"
                    />
                  </div>
                );
              }

              const paragraphs = part.value.split(/\n\n+/);
              return (
                <div key={index} className="space-y-4">
                  {paragraphs.map((pText, pIdx) => (
                    <p key={pIdx} className="text-base sm:text-lg leading-relaxed text-gray-900 whitespace-pre-wrap tracking-normal mb-4">
                      {pText}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </article>
    );
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-white font-poppins flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-white font-poppins flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-[#E4F953] text-[#040706] rounded-full flex items-center justify-center mb-6 shadow-md">
          <Sparkles className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Sign in to Start Writing</h2>
        <p className="text-sm text-gray-500 max-w-md mb-8 leading-relaxed">
          Create stories, upload custom cover art, and publish to the AKAM Digital platform.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Button
            variant="primary"
            size="md"
            onClick={() => setAuthModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 text-sm cursor-pointer"
          >
            <LogIn className="w-4 h-4" /> Sign In / Register
          </Button>
          <Link href="/">
            <Button variant="secondary" size="md" className="px-6 py-3 text-sm cursor-pointer">
              Back to Home
            </Button>
          </Link>
        </div>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          redirectTo="/submit"
          onSuccess={(u) => {
            setUser(u);
            setIsAuthenticated(true);
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-poppins flex flex-col">
      <main className="flex-1 py-10 lg:py-16">
        <div className="container px-4 mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-black mb-2 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to AKAM Digital
              </Link>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                {editingStoryId ? "Edit Story Draft" : "Authoring Studio"}
              </h1>
              <p className="text-sm text-[#646464] mt-1">
                {editingStoryId
                  ? "Update your story draft title, text, or cover image before submitting."
                  : "Draft your narrative, add inline imagery, set a cover image, and submit for editorial review."}
              </p>
            </div>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="space-y-8">
            {/* Story Cover Image Upload Dropzone (matching LatestStories card aspect ratio) */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
                Main Story Cover Image
              </label>
              <div className="relative border-2 border-dashed border-gray-200 hover:border-gray-400 transition-all rounded-[28px] overflow-hidden bg-white p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px]">
                {coverPreview ? (
                  <div className="relative w-full max-w-xs aspect-[3/4] sm:aspect-[4/5] rounded-[24px] overflow-hidden shadow-sm border border-gray-200 bg-gray-100">
                    <Image src={coverPreview} alt="Cover Preview" fill className="object-cover" unoptimized />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setCoverFile(null);
                        setCoverPreview(null);
                      }}
                      className="absolute top-3 right-3 shadow-md"
                    >
                      Change Cover
                    </Button>
                  </div>
                ) : (
                  <div className="w-full flex flex-col items-center justify-center py-6">
                    <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 mb-3 shadow-xs">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 mb-1">Click to upload cover image</span>
                    <span className="text-xs text-gray-400 mb-4">PNG, JPG or WEBP up to 5MB</span>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      icon={<Upload className="w-3.5 h-3.5" />}
                      iconPosition="left"
                      onClick={() => coverInputRef.current?.click()}
                      className="border border-gray-300 shadow-xs"
                    >
                      Upload Cover Image
                    </Button>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverSelect}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Story Title & Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
                  Story Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter a compelling title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 placeholder:text-[14px] bg-white border border-gray-200 rounded-2xl text-base text-gray-900 placeholder-gray-400 outline-none focus:border-black transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
                  Story Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 outline-none focus:border-black cursor-pointer shadow-xs"
                >
                  {categories.length > 0 ? (
                    categories.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Fiction">Fiction</option>
                      <option value="Non-Fiction">Non-Fiction</option>
                      <option value="Poetry">Poetry</option>
                      <option value="Culture">Culture</option>
                      <option value="Technology">Technology</option>
                      <option value="Opinion">Opinion</option>
                      <option value="Literature">Literature</option>
                      <option value="General">General</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Editor Workspace Toolbar */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                {/* Mode Tabs using custom Button */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={activeTab === "write" ? "primary" : "secondary"}
                    size="sm"
                    icon={<Edit3 className="w-3.5 h-3.5" />}
                    iconPosition="left"
                    onClick={() => setActiveTab("write")}
                    className="shadow-xs cursor-pointer"
                  >
                    Write Story
                  </Button>
                  <Button
                    type="button"
                    variant={activeTab === "preview" ? "primary" : "secondary"}
                    size="sm"
                    icon={<Eye className="w-3.5 h-3.5" />}
                    iconPosition="left"
                    onClick={() => setActiveTab("preview")}
                    className="shadow-xs cursor-pointer"
                  >
                    Reader Preview
                  </Button>
                </div>

                {/* Insert Inline Image Action using custom Button */}
                <div>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    icon={<ImageIcon className="w-3.5 h-3.5" />}
                    iconPosition="left"
                    onClick={() => inlineInputRef.current?.click()}
                    className="shadow-xs cursor-pointer"
                  >
                    Insert Inline Image
                  </Button>
                  <input
                    ref={inlineInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleInsertImage}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Rich Visual Document Canvas */}
              {activeTab === "write" ? (
                <div>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    className="w-full p-6 sm:p-8 bg-white border border-gray-200 rounded-[28px] text-base text-gray-900 outline-none focus:border-black transition-all leading-relaxed min-h-[380px] shadow-xs font-poppins overflow-y-auto"
                  />
                </div>
              ) : (
                /* Visual Reader View */
                <div className="animate-in fade-in py-2">
                  {renderVisualContent()}
                </div>
              )}
            </div>

            {/* Action Bar matching Design System UI Theme */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t border-gray-200">
              <Link href="/profile" className="w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="w-full sm:w-auto px-5 py-2.5 font-medium text-xs sm:text-sm border border-gray-300 shadow-xs cursor-pointer justify-center whitespace-nowrap"
                >
                  Cancel
                </Button>
              </Link>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  icon={<Save className="w-4 h-4" />}
                  iconPosition="left"
                  disabled={loading}
                  onClick={() => handleSaveStory(false)}
                  className="w-full sm:w-auto px-5 py-2.5 font-medium text-xs sm:text-sm border border-gray-300 shadow-xs cursor-pointer justify-center whitespace-nowrap"
                >
                  {editingStoryId ? "Update Draft" : "Save Draft"}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  icon={<Send className="w-4 h-4" />}
                  iconPosition="left"
                  disabled={loading}
                  onClick={() => handleSaveStory(true)}
                  className="w-full sm:w-auto px-5 py-2.5 font-medium text-xs sm:text-sm cursor-pointer shadow-xs justify-center whitespace-nowrap"
                >
                  {loading ? "Submitting..." : "Submit to Queue"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
