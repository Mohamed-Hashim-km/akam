"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  Image as ImageIcon,
  Send,
  ArrowLeft,
  ChevronDown,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit3,
  Calendar,
  Save,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  RemoveFormatting,
  X,
  Globe,
  Loader2,
  BookOpen,
  Palette,
  Video,
  Play,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Star,
  Plus,
  Check,
  Trash2,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch } from "@/lib/config";

export interface PaintingImageItem {
  id: string;
  file?: File;
  url?: string;
  previewUrl: string;
  name: string;
}

type SubmissionType = "STORY" | "PAINTING" | "VIDEO";

interface SubmissionTabItem {
  type: SubmissionType;
  label: string;
  icon: React.ReactNode;
  description: string;
  activeCard: string;
  activeIconWrapper: string;
  activeLabel: string;
  activeDesc: string;
  activeCheck: string;
  inactiveCard: string;
  inactiveIconWrapper: string;
}

const SUBMISSION_TABS: SubmissionTabItem[] = [
  {
    type: "STORY",
    label: "Article",
    icon: <BookOpen className="w-5 h-5" />,
    description: "Write & submit an article, blog, story, or essay",
    // globals.css L15: --color-primary-green: #21B573
    activeCard: "border-[#21B573] bg-[#21B573] text-white shadow-md hover:bg-[#1ea266]",
    activeIconWrapper: "bg-white/20 text-white",
    activeLabel: "text-white",
    activeDesc: "text-white/85",
    activeCheck: "text-white",
    inactiveCard:
      "border-gray-200 bg-white text-gray-700 hover:border-[#21B573] hover:bg-[#21B573]/10 hover:shadow-xs",
    inactiveIconWrapper: "bg-gray-100 text-gray-700 group-hover:bg-[#21B573]/20 group-hover:text-[#21B573]",
  },
  {
    type: "PAINTING",
    label: "Visual Arts",
    icon: <Palette className="w-5 h-5" />,
    description: "Upload paintings, photographs, digital art, or illustrations",
    // Creative Purple (matches artwork badges & upload container across the app)
    activeCard: "border-purple-600 bg-purple-600 text-white shadow-md hover:bg-purple-700",
    activeIconWrapper: "bg-white/20 text-white",
    activeLabel: "text-white",
    activeDesc: "text-white/85",
    activeCheck: "text-white",
    inactiveCard:
      "border-gray-200 bg-white text-gray-700 hover:border-purple-500 hover:bg-purple-50 hover:shadow-xs",
    inactiveIconWrapper: "bg-gray-100 text-gray-700 group-hover:bg-purple-100 group-hover:text-purple-600",
  },
  {
    type: "VIDEO",
    label: "Video",
    icon: <Video className="w-5 h-5" />,
    description: "Share a video from YouTube, Vimeo, Google Drive, or video link",
    // globals.css L17: --color-brand-yellow: #E4F953
    activeCard: "border-[#cce42e] bg-[#E4F953] text-[#040706] shadow-md hover:bg-[#d8ed3e]",
    activeIconWrapper: "bg-[#040706]/10 text-[#040706]",
    activeLabel: "text-[#040706]",
    activeDesc: "text-[#040706]/75",
    activeCheck: "text-[#040706]",
    inactiveCard:
      "border-gray-200 bg-white text-gray-700 hover:border-[#cce42e] hover:bg-[#E4F953]/25 hover:shadow-xs",
    inactiveIconWrapper: "bg-gray-100 text-gray-700 group-hover:bg-[#E4F953]/35 group-hover:text-[#040706]",
  },
];

export type VideoEmbedType = "youtube" | "vimeo" | "dailymotion" | "googledrive" | "direct";

export interface ParsedVideo {
  type: VideoEmbedType;
  id?: string;
  embedUrl?: string;
  directUrl?: string;
}

export function parseVideoUrl(url: string): ParsedVideo | null {
  if (!url || !url.trim()) return null;
  const clean = url.trim();

  // YouTube (standard, youtu.be, shorts, live, embed)
  const ytMatch = clean.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/
  );
  if (ytMatch) {
    return {
      type: "youtube",
      id: ytMatch[1],
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}`,
    };
  }

  // Vimeo
  const vimMatch = clean.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimMatch) {
    return {
      type: "vimeo",
      id: vimMatch[1],
      embedUrl: `https://player.vimeo.com/video/${vimMatch[1]}`,
    };
  }

  // Dailymotion
  const dmMatch = clean.match(/(?:dailymotion\.com\/(?:video|embed\/video)\/|dai\.ly\/)([a-zA-Z0-9]+)/);
  if (dmMatch) {
    return {
      type: "dailymotion",
      id: dmMatch[1],
      embedUrl: `https://www.dailymotion.com/embed/video/${dmMatch[1]}`,
    };
  }

  // Google Drive
  const gdMatch = clean.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdMatch) {
    return {
      type: "googledrive",
      id: gdMatch[1],
      embedUrl: `https://drive.google.com/file/d/${gdMatch[1]}/preview`,
    };
  }

  // Direct video file (mp4, webm, ogg, mov)
  if (
    /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(clean) ||
    clean.startsWith("blob:") ||
    /^https?:\/\/.*\/uploads\/.*video/i.test(clean)
  ) {
    return {
      type: "direct",
      directUrl: clean,
    };
  }

  return null;
}

function extractYoutubeId(url: string): string | null {
  const parsed = parseVideoUrl(url);
  return parsed?.type === "youtube" ? parsed.id || null : null;
}

function createDemoImageFile(
  name: string,
  titleText: string,
  subtitleText: string,
  color1: string,
  color2: string
): { file: File; previewUrl: string } | null {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 750;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, 1200, 750);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1200, 750);

    // Subtle background decorative circles
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.arc(1060, 160, 280, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.arc(140, 620, 220, 0, Math.PI * 2);
    ctx.fill();

    // AKAM Brand Pill
    ctx.fillStyle = "#E4F953";
    if (typeof (ctx as any).roundRect === "function") {
      (ctx as any).roundRect(80, 70, 180, 42, 21);
    } else {
      ctx.fillRect(80, 70, 180, 42);
    }
    ctx.fill();

    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#040706";
    ctx.fillText("AKAM DIGITAL", 115, 97);

    // Decorative divider line
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(80, 410);
    ctx.lineTo(1120, 410);
    ctx.stroke();

    // Main Title
    ctx.font = "bold 44px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(titleText, 80, 360);

    // Subtitle
    ctx.font = "normal 24px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(subtitleText, 80, 470);

    // Tagline
    ctx.font = "italic 18px sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
    ctx.fillText("Akam Cultural Editorial • Featured Showcase", 80, 680);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const arr = dataUrl.split(",");
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: "image/jpeg" });
    const file = new File([blob], name, { type: "image/jpeg" });
    const previewUrl = URL.createObjectURL(blob);
    return { file, previewUrl };
  } catch (err) {
    console.error("Failed to generate demo image:", err);
    return null;
  }
}

async function captureVideoFrame(
  videoUrl: string
): Promise<{ file: File; previewUrl: string } | null> {
  if (typeof window === "undefined" || typeof document === "undefined") return null;
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.src = videoUrl;
      video.muted = true;
      video.currentTime = 1;
      video.onloadeddata = () => {
        try {
          video.currentTime = Math.min(1, (video.duration || 2) / 2);
        } catch {}
      };
      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 1280;
          canvas.height = video.videoHeight || 720;
          const ctx = canvas.getContext("2d");
          if (!ctx) { resolve(null); return; }
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], "video-thumbnail.jpg", { type: "image/jpeg" });
              const previewUrl = URL.createObjectURL(blob);
              resolve({ file, previewUrl });
            } else {
              resolve(null);
            }
          }, "image/jpeg", 0.85);
        } catch {
          resolve(null);
        }
      };
      video.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function fetchVideoThumbnailFile(
  video: ParsedVideo
): Promise<{ file: File; previewUrl: string } | null> {
  if (typeof window === "undefined") return null;
  try {
    if (video.type === "youtube" && video.id) {
      const maxresUrl = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`;
      const hqUrl = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`;
      try {
        let res = await fetch(maxresUrl);
        let blob = res.ok ? await res.blob() : null;
        if (!blob || blob.size < 2000) {
          const fallbackRes = await fetch(hqUrl);
          if (fallbackRes.ok) blob = await fallbackRes.blob();
        }
        if (blob) {
          const file = new File([blob], `youtube-${video.id}.jpg`, { type: "image/jpeg" });
          return { file, previewUrl: URL.createObjectURL(blob) };
        }
      } catch {}
      return {
        file: new File([], `youtube-${video.id}.jpg`, { type: "image/jpeg" }),
        previewUrl: hqUrl,
      };
    }

    if (video.type === "vimeo" && video.id) {
      try {
        const oembedRes = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${video.id}`);
        if (oembedRes.ok) {
          const data = await oembedRes.json();
          const thumbUrl = data.thumbnail_url || data.thumbnail_url_with_play_button;
          if (thumbUrl) {
            try {
              const imgRes = await fetch(thumbUrl);
              if (imgRes.ok) {
                const blob = await imgRes.blob();
                const file = new File([blob], `vimeo-${video.id}.jpg`, { type: "image/jpeg" });
                return { file, previewUrl: URL.createObjectURL(blob) };
              }
            } catch {}
            return {
              file: new File([], `vimeo-${video.id}.jpg`, { type: "image/jpeg" }),
              previewUrl: thumbUrl,
            };
          }
        }
      } catch {}
    }

    if (video.type === "dailymotion" && video.id) {
      try {
        const dmRes = await fetch(`https://api.dailymotion.com/video/${video.id}?fields=thumbnail_720_url,thumbnail_480_url,thumbnail_url`);
        if (dmRes.ok) {
          const data = await dmRes.json();
          const thumbUrl = data.thumbnail_720_url || data.thumbnail_480_url || data.thumbnail_url;
          if (thumbUrl) {
            try {
              const imgRes = await fetch(thumbUrl);
              if (imgRes.ok) {
                const blob = await imgRes.blob();
                const file = new File([blob], `dailymotion-${video.id}.jpg`, { type: "image/jpeg" });
                return { file, previewUrl: URL.createObjectURL(blob) };
              }
            } catch {}
            return {
              file: new File([], `dailymotion-${video.id}.jpg`, { type: "image/jpeg" }),
              previewUrl: thumbUrl,
            };
          }
        }
      } catch {}
    }

    if (video.type === "direct" && video.directUrl) {
      const frame = await captureVideoFrame(video.directUrl);
      if (frame) return frame;
    }
  } catch (err) {
    console.error("Failed to auto-fetch video thumbnail:", err);
  }
  return null;
}

export default function SubmitWorkPage() {
  const router = useRouter();

  // Auth
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);

  // Common fields
  const [submissionType, setSubmissionType] = useState<SubmissionType>("STORY");
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Fiction");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<any[]>([]);

  // Story fields
  const [content, setContent] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  // Cover / painting image
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // Visual Arts multiple images
  const [paintingImages, setPaintingImages] = useState<PaintingImageItem[]>([]);
  // Dedicated Cover Image for visual arts (optional)
  const [paintingCoverFile, setPaintingCoverFile] = useState<File | null>(null);
  const [paintingCoverPreview, setPaintingCoverPreview] = useState<string | null>(null);

  // Video fields
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPreview, setVideoPreview] = useState<ParsedVideo | null>(null);
  const [isCustomThumbnail, setIsCustomThumbnail] = useState(false);

  // Refs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const paintingFilesInputRef = useRef<HTMLInputElement>(null);
  const paintingCoverInputRef = useRef<HTMLInputElement>(null);

  // Status
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingInlineImage, setUploadingInlineImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Link modal
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const savedRangeRef = useRef<Range | null>(null);

  // Formatting
  const [activeFormats, setActiveFormats] = useState({
    bold: false, italic: false, underline: false, strikethrough: false,
    bulletList: false, orderedList: false, h2: false, h3: false, blockquote: false,
  });

  // ─── Auth check ────────────────────────────────────────────────────────────
  useEffect(() => {
    const cachedUser = typeof window !== "undefined" ? localStorage.getItem("akam_user") : null;
    if (!cachedUser) { router.replace("/"); return; }

    apiFetch(`${API_BASE_URL}/users/me`).then(async (res) => {
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem("akam_user", JSON.stringify(userData));
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("akam_user");
        setIsAuthenticated(false);
        router.replace("/");
      }
    }).catch(() => { localStorage.removeItem("akam_user"); setIsAuthenticated(false); router.replace("/"); });
  }, [router]);

  // ─── Categories ────────────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch(`${API_BASE_URL}/categories`).then(async (res) => {
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
        setCategories(list);
        if (list.length > 0) setCategory((prev) => (prev && prev !== "General" ? prev : list[0].name));
      }
    }).catch(() => {});
  }, []);

  // ─── Edit mode ─────────────────────────────────────────────────────────────
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
            setCategory(s.category || "General");
            setDescription(s.description || "");
            if (s.submissionType) setSubmissionType(s.submissionType);
            if (s.mediaUrl) setVideoUrl(s.mediaUrl);
            if (s.coverImageUrl) setCoverPreview(s.coverImageUrl);
            if (s.content && editorRef.current) {
              setContent(s.content);
              editorRef.current.innerHTML = convertMarkdownToHtml(s.content);
            }
            if (s.submissionType === "PAINTING") {
              const parsedImages: PaintingImageItem[] = [];
              if (s.content) {
                const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
                let match;
                let i = 1;
                while ((match = imgRegex.exec(s.content)) !== null) {
                  parsedImages.push({
                    id: `paint_edit_${i}_${Date.now()}`,
                    url: match[2],
                    previewUrl: match[2],
                    name: match[1] || `Artwork ${i}`,
                  });
                  i++;
                }
              }
              if (parsedImages.length === 0 && s.mediaUrl) {
                parsedImages.push({
                  id: `paint_edit_main_${Date.now()}`,
                  url: s.mediaUrl,
                  previewUrl: s.mediaUrl,
                  name: "Artwork 1",
                });
              }
              setPaintingImages(parsedImages);
              if (s.coverImageUrl && (!parsedImages[0] || s.coverImageUrl !== parsedImages[0].url)) {
                setPaintingCoverPreview(s.coverImageUrl);
              }
            }
          }
        });
      }
    }
  }, []);

  // ─── Sync tab switch ───────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "write" && editorRef.current && content) {
      if (!editorRef.current.innerHTML.trim()) editorRef.current.innerHTML = content;
    }
  }, [activeTab, content]);

  // ─── Video preview & auto-thumbnail helper ───────────────────────────────
  useEffect(() => {
    if (!videoUrl.trim()) { setVideoPreview(null); return; }
    const parsed = parseVideoUrl(videoUrl);
    setVideoPreview(parsed);

    if (parsed) {
      fetchVideoThumbnailFile(parsed).then((thumb) => {
        if (thumb) {
          setCoverFile(thumb.file);
          setCoverPreview(thumb.previewUrl);
        }
      });
    }
  }, [videoUrl]);

  // ─── Formatting helpers ───────────────────────────────────────────────────
  const updateActiveStates = () => {
    if (typeof window === "undefined") return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikethrough: document.queryCommandState("strikeThrough"),
        bulletList: document.queryCommandState("insertUnorderedList"),
        orderedList: document.queryCommandState("insertOrderedList"),
        h2: document.queryCommandValue("formatBlock") === "h2",
        h3: document.queryCommandValue("formatBlock") === "h3",
        blockquote: document.queryCommandValue("formatBlock") === "blockquote",
      });
    } catch (e) {}
  };

  const executeCommand = (command: string, value?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    setContent(editorRef.current.innerHTML);
    updateActiveStates();
  };

  const handleEditorInput = () => {
    if (editorRef.current) { setContent(editorRef.current.innerHTML); updateActiveStates(); }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const editor = editorRef.current;
      if (!editor) return;
      document.execCommand("defaultParagraphSeparator", false, "p");
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        let node: Node | null = range.startContainer;
        while (node && node !== editor) {
          if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "DIV") {
            document.execCommand("formatBlock", false, "p"); break;
          }
          node = node.parentNode;
        }
        if (range.startContainer === editor || range.startContainer.parentNode === editor) {
          document.execCommand("formatBlock", false, "p");
        }
      }
      document.execCommand("insertParagraph", false);
      if (editor) { setContent(editor.innerHTML); updateActiveStates(); }
    }
  };

  const handleOpenLinkModal = () => {
    if (typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        setLinkText(sel.toString());
      } else { savedRangeRef.current = null; setLinkText(""); }
    }
    setLinkUrl(""); setLinkModalOpen(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) { setLinkModalOpen(false); return; }
    let finalUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedRangeRef.current && typeof window !== "undefined") {
        const sel = window.getSelection();
        if (sel) { sel.removeAllRanges(); sel.addRange(savedRangeRef.current); }
      }
      const selectionText = window.getSelection()?.toString();
      if (linkText.trim() && (!selectionText || selectionText !== linkText)) {
        document.execCommand("insertHTML", false, `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-medium hover:text-emerald-900">${linkText}</a>`);
      } else {
        document.execCommand("createLink", false, finalUrl);
      }
      setContent(editorRef.current.innerHTML);
    }
    setLinkModalOpen(false);
  };

  // ─── Markdown / HTML helpers ───────────────────────────────────────────────
  const convertMarkdownToHtml = (mdStr: string): string => {
    if (!mdStr) return "";
    let html = mdStr.replace(/\r\n/g, "\n");
    html = html.replace(/&nbsp;/gi, " ").replace(/&#160;/gi, " ");
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<div contenteditable="false" class="my-6 text-center select-none"><img src="$2" alt="$1" class="max-h-[420px] w-auto mx-auto rounded-2xl border border-gray-200 shadow-md object-cover inline-block" /></div><p><br></p>');
    html = html.replace(/^###\s+(.*)$/gm, '<h3 class="text-xl font-bold my-3 text-gray-900">$1</h3>');
    html = html.replace(/^##\s+(.*)$/gm, '<h2 class="text-2xl font-bold my-4 text-gray-950">$1</h2>');
    html = html.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>").replace(/__(.*?)__/g, "<b>$1</b>");
    html = html.replace(/\*(.*?)\*/g, "<i>$1</i>");
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-medium hover:text-emerald-900">$1</a>');
    html = html.replace(/^>\s+(.*)$/gm, '<blockquote class="border-l-4 border-emerald-500 pl-4 py-2 italic my-4 text-gray-800 bg-gray-50/70 rounded-r-xl">$1</blockquote>');
    html = html.replace(/^[\*\-]\s+(.*)$/gm, '<ul class="my-2"><li class="ml-4 list-disc mb-1 text-gray-900">$1</li></ul>');
    html = html.replace(/^\d+\.\s+(.*)$/gm, '<ol class="my-2"><li class="ml-4 list-decimal mb-1 text-gray-900">$1</li></ol>');
    html = html.replace(/\*\*/g, "");
    const lines = html.split("\n");
    const resultBlocks: string[] = [];
    let currentParagraphLines: string[] = [];
    const flushParagraph = () => {
      if (currentParagraphLines.length > 0) {
        const text = currentParagraphLines.join("<br>");
        if (text.trim()) resultBlocks.push(`<p class="mb-6 leading-[1.9] text-gray-900 whitespace-pre-wrap">${text}</p>`);
        currentParagraphLines = [];
      }
    };
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) { flushParagraph(); continue; }
      if (trimmed.startsWith('<div contenteditable="false"') || trimmed.startsWith("<h2") || trimmed.startsWith("<h3") || trimmed.startsWith("<blockquote") || trimmed.startsWith("<ul") || trimmed.startsWith("<ol") || trimmed.startsWith("<p")) {
        flushParagraph(); resultBlocks.push(trimmed); continue;
      }
      currentParagraphLines.push(trimmed);
    }
    flushParagraph();
    return resultBlocks.join("");
  };

  const convertHtmlToMarkdown = (htmlStr: string): string => {
    if (!htmlStr) return "";
    let result = htmlStr;
    result = result.replace(/&nbsp;/gi, " ").replace(/&#160;/gi, " ");
    result = result.replace(/<div contenteditable="false".*?<img src="(.*?)".*?<\/div>/gi, "\n\n![Inline Image]($1)\n\n");
    result = result.replace(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi, "\n\n![Inline Image]($1)\n\n");
    result = result.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, "[$2]($1)");
    result = result.replace(/<b>(.*?)<\/b>/gi, "**$1**").replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
    result = result.replace(/<i>(.*?)<\/i>/gi, "*$1*").replace(/<em>(.*?)<\/em>/gi, "*$1*");
    result = result.replace(/<u>(.*?)<\/u>/gi, "<u>$1</u>");
    result = result.replace(/<s>(.*?)<\/s>/gi, "~~$1~~").replace(/<strike>(.*?)<\/strike>/gi, "~~$1~~");
    result = result.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n\n## $1\n\n");
    result = result.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n\n### $1\n\n");
    result = result.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "\n\n> $1\n\n");
    result = result.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
    result = result.replace(/<\/?ul[^>]*>/gi, "\n\n").replace(/<\/?ol[^>]*>/gi, "\n\n");
    result = result.replace(/<p[^>]*><br\s*\/?>\s*<\/p>/gi, "§BLANK§");
    result = result.replace(/<div[^>]*aria-hidden[^>]*><\/div>/gi, "§BLANK§");
    result = result.replace(/<p[^>]*>\s*<\/p>/gi, "§BLANK§");
    result = result.replace(/<\/p>\s*<p[^>]*>/gi, "\n\n").replace(/<p[^>]*>/gi, "").replace(/<\/p>/gi, "\n\n");
    result = result.replace(/<br\s*\/?>/gi, "\n");
    result = result.replace(/<div[^>]*>/gi, "\n\n").replace(/<\/div>/gi, "");
    result = result.replace(/§BLANK§/g, "\n");
    result = result.replace(/<(?!u|\/u)[^>]+>/gi, "");
    result = result.replace(/\*\*([^\S\r\n]+)(.*?)\*\*/g, "**$2**").replace(/\*\*(.*?)([^\S\r\n]+)\*\*/g, "**$1**");
    result = result.replace(/\*([^\S\r\n]+)(.*?)\*/g, "*$2*").replace(/\*(.*?)([^\S\r\n]+)\*/g, "*$1*");
    result = result.replace(/\r\n/g, "\n").replace(/\n{9,}/g, "\n\n\n\n\n\n\n\n");
    return result.trim();
  };

  // ─── Inline image ──────────────────────────────────────────────────────────
  const handleInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append("file", file);
    setUploadingInlineImage(true);
    try {
      const res = await apiFetch(`${API_BASE_URL}/uploads/image`, { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand("insertHTML", false, `<div contenteditable="false" class="my-6 text-center select-none"><img src="${data.url}" alt="Inline image" class="max-h-[420px] w-auto mx-auto rounded-2xl border border-gray-200 shadow-md object-cover inline-block" /></div><p><br></p>`);
          setContent(editorRef.current.innerHTML);
        }
      } else alert("Failed to upload inline image");
    } catch (err) { console.error(err); alert("Error uploading image"); }
    finally {
      setUploadingInlineImage(false);
      if (inlineInputRef.current) inlineInputRef.current.value = "";
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handlePaintingImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newItems: PaintingImageItem[] = Array.from(e.target.files).map((file, idx) => {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
        return {
          id: `paint_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          name: cleanName || file.name,
        };
      });
      setPaintingImages((prev) => [...prev, ...newItems]);
      if (paintingFilesInputRef.current) paintingFilesInputRef.current.value = "";
    }
  };

  const handleUpdatePaintingImageName = (id: string, newName: string) => {
    setPaintingImages((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const handleRemovePaintingImage = (id: string) => {
    setPaintingImages((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMakePaintingImageCover = (index: number) => {
    if (index <= 0) return;
    setPaintingImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
  };

  const handlePaintingCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPaintingCoverFile(file);
      setPaintingCoverPreview(URL.createObjectURL(file));
      if (paintingCoverInputRef.current) paintingCoverInputRef.current.value = "";
    }
  };

  // ─── Submit / Save ─────────────────────────────────────────────────────────
  const handleSave = async (isSubmitForReview: boolean) => {
    setError(null);

    if (!title.trim()) { setError("Please enter a title."); return; }
    if (!description.trim()) { setError("Description is required."); return; }

    if (submissionType === "STORY") {
      const rawHtml = editorRef.current ? editorRef.current.innerHTML : content;
      const md = convertHtmlToMarkdown(rawHtml);
      if (!md.trim()) { setError("Article content is required."); return; }
      if (!coverFile && !coverPreview) { setError("Cover image is required for articles."); return; }
    }

    if (submissionType === "PAINTING") {
      if (paintingImages.length === 0) {
        setError("Please upload at least one painting or photograph.");
        return;
      }
    }

    if (submissionType === "VIDEO") {
      if (!videoUrl.trim()) { setError("Please enter a video URL."); return; }
      if (!videoPreview) { setError("Please enter a valid video URL (YouTube, Vimeo, Dailymotion, Google Drive, or direct MP4/WebM)."); return; }
      if (!coverFile && !coverPreview) { setError("Thumbnail image is required for video submissions."); return; }
    }

    if (isSubmitForReview) setSubmitting(true);
    else setSavingDraft(true);

    try {
      await apiFetch(`${API_BASE_URL}/users/me/become-author`, { method: "POST" });

      let resolvedPaintingImages = [...paintingImages];
      let resolvedPrimaryMediaUrl: string | undefined = undefined;
      let resolvedCoverImageUrl: string | undefined = undefined;

      if (submissionType === "PAINTING") {
        // 1. Upload any newly added painting images to /uploads/image
        const uploadedGallery: PaintingImageItem[] = [];
        for (let i = 0; i < resolvedPaintingImages.length; i++) {
          const item = resolvedPaintingImages[i];
          if (item.file && (!item.url || item.url.startsWith("blob:"))) {
            const fd = new FormData();
            fd.append("file", item.file);
            const uploadRes = await apiFetch(`${API_BASE_URL}/uploads/image`, { method: "POST", body: fd });
            if (uploadRes.ok) {
              const uploadData = await uploadRes.json();
              uploadedGallery.push({
                ...item,
                url: uploadData.url,
                previewUrl: uploadData.url,
              });
            } else {
              throw new Error(`Failed to upload gallery image #${i + 1}`);
            }
          } else {
            uploadedGallery.push(item);
          }
        }
        resolvedPaintingImages = uploadedGallery;
        setPaintingImages(uploadedGallery);

        // 2. Upload optional dedicated cover if provided
        let dedicatedCoverUrl: string | undefined = undefined;
        if (paintingCoverFile) {
          const fd = new FormData();
          fd.append("file", paintingCoverFile);
          const uploadRes = await apiFetch(`${API_BASE_URL}/uploads/image`, { method: "POST", body: fd });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            dedicatedCoverUrl = uploadData.url;
            setPaintingCoverPreview(uploadData.url);
          }
        } else if (paintingCoverPreview && !paintingCoverPreview.startsWith("blob:")) {
          dedicatedCoverUrl = paintingCoverPreview;
        }

        resolvedPrimaryMediaUrl = resolvedPaintingImages[0]?.url;
        // Fallback: If dedicated cover is not given, the 1st painting/photograph (#1) is automatically used as the cover!
        resolvedCoverImageUrl = dedicatedCoverUrl || resolvedPrimaryMediaUrl;
      }

      const rawHtml = editorRef.current ? editorRef.current.innerHTML : content;
      let markdownContent = "";
      if (submissionType === "STORY") {
        markdownContent = convertHtmlToMarkdown(rawHtml);
      } else if (submissionType === "PAINTING") {
        markdownContent = resolvedPaintingImages
          .map((item, idx) => `![${(item.name || "").trim() || `Artwork ${idx + 1}`}](${item.url || item.previewUrl})`)
          .join("\n\n");
      }

      let resolvedVideoCoverUrl: string | undefined = undefined;
      if (submissionType === "VIDEO") {
        if (coverPreview && !coverPreview.startsWith("blob:")) {
          resolvedVideoCoverUrl = coverPreview;
        }
      }

      const selectedCategory = submissionType === "STORY"
        ? (category || (categories.length > 0 ? categories[0].name : "General"))
        : undefined;

      const storyPayload = {
        title: title.trim(),
        description: description.trim(),
        content: markdownContent,
        category: selectedCategory,
        submissionType,
        mediaUrl: submissionType === "VIDEO" ? videoUrl.trim() : (submissionType === "PAINTING" ? resolvedPrimaryMediaUrl : undefined),
        coverImageUrl: submissionType === "PAINTING" ? resolvedCoverImageUrl : submissionType === "VIDEO" ? resolvedVideoCoverUrl : undefined,
      };

      let story: any;
      if (editingStoryId) {
        const res = await apiFetch(`${API_BASE_URL}/stories/${editingStoryId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(storyPayload),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Failed to update"); }
        story = await res.json();
      } else {
        const res = await apiFetch(`${API_BASE_URL}/stories`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(storyPayload),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.message || "Failed to create"); }
        story = await res.json();
      }

      // Upload cover file if present (for STORY or VIDEO)
      if ((submissionType === "STORY" || submissionType === "VIDEO") && coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        await apiFetch(`${API_BASE_URL}/stories/${story.id}/cover`, { method: "POST", body: fd });
      } else if (submissionType === "PAINTING") {
        const coverUploadTarget = paintingCoverFile || (resolvedPaintingImages[0]?.file ? resolvedPaintingImages[0].file : null);
        if (coverUploadTarget) {
          const fd = new FormData();
          fd.append("file", coverUploadTarget);
          await apiFetch(`${API_BASE_URL}/stories/${story.id}/cover`, { method: "POST", body: fd });
        }
      }

      if (isSubmitForReview) {
        const submitRes = await apiFetch(`${API_BASE_URL}/stories/${story.id}/submit`, { method: "POST" });
        if (!submitRes.ok) throw new Error("Saved but failed to submit for review");
        const typeLabel = submissionType === "STORY" ? "article" : submissionType === "PAINTING" ? "visual arts submission" : "video";
        setSuccess(`Your ${typeLabel} has been submitted for editorial review!`);
      } else {
        setSuccess(editingStoryId ? "Draft updated!" : "Draft saved!");
      }

      setTimeout(() => router.push("/profile"), 1800);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSavingDraft(false);
      setSubmitting(false);
    }
  };

  // ─── Demo Auto-Fill ────────────────────────────────────────────────────────
  const fillDemoData = (type: SubmissionType = submissionType) => {
    setError(null);
    setSubmissionType(type);

    if (type === "STORY") {
      const cat =
        categories.find(
          (c: any) =>
            c.name.toLowerCase().includes("culture") ||
            c.name.toLowerCase().includes("fiction")
        )?.name || (categories.length > 0 ? categories[0].name : "Culture");
      setCategory(cat);
      setTitle("തീരദേശ സ്മൃതികൾ: മലബാറിന്റെ സാംസ്കാരിക വഴികൾ");
      setDescription(
        "നൂറ്റാണ്ടുകളായി അറബിക്കടലിന്റെ തീരത്ത് വികസിച്ച സാംസ്കാരിക പാരമ്പര്യങ്ങളും കടലോര ജീവിതത്തിന്റെ വികാരഭരിതമായ അനുഭവങ്ങളും."
      );

      const storyCoverUrl =
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSzeHMSIaqaxC25O13SYjHLvs1aIp15uDe_ZUDc9fBJkdfE81bLm9RDiEg&s=10";
      setCoverPreview(storyCoverUrl);
      fetch(storyCoverUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "story-cover.jpg", {
            type: blob.type || "image/jpeg",
          });
          setCoverFile(file);
          setCoverPreview(URL.createObjectURL(blob));
        })
        .catch((err) => {
          console.error("Failed to fetch story cover image blob:", err);
          setCoverPreview(storyCoverUrl);
        });

      const storyHtml = `<h2>തീരദേശ സ്മൃതികൾ: മലബാറിന്റെ സാംസ്കാരിക വഴികൾ</h2>
<p>നൂറ്റാണ്ടുകളായി അറബിക്കടലിന്റെ തിരമാലകൾ തീരത്തോട് മന്ത്രിക്കുന്ന കഥകൾ മലബാറിന്റെ സംസ്കാരത്തെ രൂപപ്പെടുത്തിയിട്ടുണ്ട്. ഉപ്പുകാറ്റും തടിപ്പണിയുടെ ഗന്ധവും ഇഴചേർന്ന ബേപ്പൂരിന്റെ ചരിത്രം ഉരു നിർമ്മാണത്തിന്റെ വൈദഗ്ധ്യവും സമുദ്രവാണിജ്യത്തിന്റെ പാരമ്പര്യവും നമ്മെ ഓർമ്മിപ്പിക്കുന്നു.</p>
<blockquote class="border-l-4 border-emerald-500 pl-4 py-2 italic my-4 text-gray-800 bg-gray-50/70 rounded-r-xl">"കടൽ വെറുമൊരു ജലാശയമല്ല; അത് തലമുറകളുടെ ഓർമ്മകളും കാത്തിരിപ്പുകളും കണ്ണീരും സംഗമിക്കുന്ന വികാരമാണ്."</blockquote>
<h3>സാംസ്കാരിക സങ്കലനവും സാഹിത്യ പാരമ്പര്യവും</h3>
<p>തീരദേശ ജീവിതം മലയാള സാഹിത്യത്തിനും കലകൾക്കും നൽകിയ സംഭാവനകൾ നിസ്തുലമാണ്. മാപ്പിളപ്പാട്ടുകളിലെ സംഗീതവും നാടൻ പാട്ടുകളിലെ കടൽപ്പാട്ടുകളും മനുഷ്യന്റെ അതിജീവനത്തെയും സ്നേഹത്തെയും അടയാളപ്പെടുത്തുന്നു.</p>
<ul class="my-2">
<li class="ml-4 list-disc mb-1 text-gray-900"><b>ബേപ്പൂർ ഉരു നിർമ്മാണം:</b> ലോകപ്രശസ്തമായ പാരമ്പര്യ തടിപ്പണി വിസ്മയം.</li>
<li class="ml-4 list-disc mb-1 text-gray-900"><b>സമുദ്രവ്യാപാര ചരിത്രം:</b> പുരാതന തുറമുഖങ്ങളും സംസ്കാരങ്ങളുടെ കൈമാറ്റവും.</li>
<li class="ml-4 list-disc mb-1 text-gray-900"><b>വാമൊഴി സാഹിത്യം:</b> കടലോര മനുഷ്യരുടെ അനുഭവ സാക്ഷ്യങ്ങൾ.</li>
</ul>
<p>കാലം മാറുമ്പോഴും ഈ തീരങ്ങൾ നമ്മുടെ ഓർമ്മകളിൽ ജ്വലിച്ചുനിൽക്കുന്നു. പുത്തൻ തലമുറയ്ക്ക് ഈ പാരമ്പര്യം പകർന്നുനൽകുക എന്നത് നമ്മുടെ സാംസ്കാരിക ഉത്തരവാദിത്തമാണ്.</p>`;

      setContent(storyHtml);
      if (editorRef.current) {
        editorRef.current.innerHTML = storyHtml;
      } else {
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = storyHtml;
          }
        }, 60);
      }
      setSuccess("Demo article loaded! You can preview or submit now.");
    } else if (type === "PAINTING") {
      setTitle("സന്ധ്യാരാഗം & തീരക്കാഴ്ചകൾ (Twilight & Coastal Impressions)");
      setDescription(
        "കേരളത്തിലെ കായലോരങ്ങളിലും കടൽത്തീരങ്ങളിലും സന്ധ്യാസമയത്ത് വിരിയുന്ന വർണ്ണവിന്യാസങ്ങളെ പ്രമേയമാക്കിയുള്ള ആധുനിക അക്രിലിക് പെയിന്റിംഗുകളും ലാൻഡ്സ്കേപ്പ് ഫോട്ടോഗ്രാഫിയും."
      );

      const demoArtworks = [
        {
          name: "സന്ധ്യാരാഗം (Colors of Twilight)",
          url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1200&auto=format&fit=crop&q=80",
        },
        {
          name: "തീരക്കാഴ്ചകൾ (Coastal Breeze)",
          url: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80",
        },
        {
          name: "പ്രകൃതിയുടെ നിഴലുകൾ (Nature in Monochrome)",
          url: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&auto=format&fit=crop&q=80",
        },
      ];

      const demoItems: PaintingImageItem[] = demoArtworks.map((art, idx) => ({
        id: `demo_${idx}_${Date.now()}`,
        url: art.url,
        previewUrl: art.url,
        name: art.name,
      }));

      setPaintingImages(demoItems);
      setPaintingCoverFile(null);
      setPaintingCoverPreview(null); // Leave empty so Image #1 is used as default cover
      setSuccess("Demo multi-image gallery loaded (3 items)! Image #1 acts as default cover.");
    } else if (type === "VIDEO") {
      setTitle("ബിഗ് ബക്ക് ബണ്ണി: ആനിമേഷൻ സിനിമാ സംവാദം (Big Buck Bunny)");
      setDescription(
        "ഓപ്പൺ സോഴ്സ് സിനിമാറ്റിക് ആനിമേഷൻ സാങ്കേതികതകളെക്കുറിച്ചും ലോകപ്രശസ്ത ബ്ലെൻഡർ ആനിമേഷൻ ഫിലിമിനെക്കുറിച്ചുമുള്ള സമഗ്ര വിശകലനം."
      );
      const demoUrl = "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4";
      const standardThumbnail = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&auto=format&fit=crop&q=80";
      const parsed = parseVideoUrl(demoUrl);
      setVideoUrl(demoUrl);
      setVideoPreview(parsed);
      setCoverFile(null);
      setCoverPreview(standardThumbnail);
      setIsCustomThumbnail(true);
      setSuccess("Demo MP4 video & standard thumbnail loaded!");
    }

    setTimeout(() => {
      setSuccess(null);
    }, 3500);
  };

  const clearForm = () => {
    setTitle("");
    setDescription("");
    setContent("");
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    setCoverFile(null);
    setCoverPreview(null);
    setPaintingImages([]);
    setPaintingCoverFile(null);
    setPaintingCoverPreview(null);
    setVideoUrl("");
    setVideoPreview(null);
    setError(null);
    setSuccess(null);
  };

  // ─── Story reader preview ──────────────────────────────────────────────────
  const renderVisualContent = () => {
    const rawHtml = editorRef.current ? editorRef.current.innerHTML : content;
    const md = convertHtmlToMarkdown(rawHtml);
    const regex = /!\[(.*?)\]\((.*?)\)|<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    const parts: Array<{ type: "text"; value: string } | { type: "image"; src: string; alt: string }> = [];
    let lastIndex = 0, match;
    while ((match = regex.exec(md)) !== null) {
      if (match.index > lastIndex) { const rawText = md.substring(lastIndex, match.index); if (rawText.trim()) parts.push({ type: "text", value: rawText }); }
      const imgSrc = match[2] || match[3] || "";
      if (imgSrc) parts.push({ type: "image", alt: match[1] || "Inline Image", src: imgSrc });
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < md.length) { const rawText = md.substring(lastIndex); if (rawText.trim()) parts.push({ type: "text", value: rawText }); }
    const authorDisplayName = user?.name?.trim() || user?.email || "AKAM Author";
    return (
      <article className="bg-white rounded-[32px] p-6 sm:p-10 border border-gray-200 shadow-sm max-w-3xl mx-auto font-poppins space-y-6">
        <div className="flex items-center gap-2">
          <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl shadow-xs">PUBLISHED ARTICLE</span>
          <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 tracking-tight leading-tight">{title || "Untitled Story"}</h1>
        {description && <p className="text-base text-gray-600 italic leading-relaxed">{description}</p>}
        <div className="flex items-center justify-between py-4 border-y border-gray-100 my-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {user?.avatarUrl ? <Image src={user.avatarUrl} alt="Author" fill className="object-cover" unoptimized /> : <span>{authorDisplayName[0].toUpperCase()}</span>}
            </div>
            <div><p className="text-sm font-bold text-gray-900">{authorDisplayName}</p><p className="text-xs text-gray-500">Verified AKAM Author</p></div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">Live Reader View</span>
        </div>
        {parts.length === 0 ? (
          <div className="py-12 text-center text-gray-400 italic text-sm">Story content preview will render here as you write...</div>
        ) : (
          <div className="space-y-4 pt-2 text-gray-900 font-normal text-base sm:text-lg">
            {parts.map((part, index) => {
              if (part.type === "image") return <div key={index} className="my-6 sm:my-8 flex justify-center"><img src={part.src} alt={part.alt} className="w-full max-w-3xl h-auto max-h-[500px] object-cover rounded-2xl" /></div>;
              const renderedChunkHtml = convertMarkdownToHtml(part.value);
              return <div key={index} className="prose prose-lg max-w-none text-gray-900 leading-[1.9] font-normal [&_p]:mb-6 [&_p]:mt-0 [&_p]:leading-[1.9] [&_p]:text-[#1A1A1A] [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_a]:text-emerald-700 [&_a]:underline [&_a]:font-medium [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-gray-950 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-gray-900 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:bg-gray-50/70 [&_blockquote]:rounded-r-xl" dangerouslySetInnerHTML={{ __html: renderedChunkHtml }} />;
            })}
          </div>
        )}
      </article>
    );
  };

  if (isAuthenticated === null || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white font-poppins flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black" />
      </div>
    );
  }

  const typeConfig = SUBMISSION_TABS.find((t) => t.type === submissionType)!;

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-poppins flex flex-col">
      <main className="flex-1 py-10 lg:py-16">
        <div className="container px-4 mx-auto max-w-4xl">

          {/* Header */}
          <div className="mb-8 pb-6 border-b border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-800 hover:text-black hover:border-gray-400 transition-all cursor-pointer shadow-2xs mb-6"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-gray-700" /> Go Back
            </button>

            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                {editingStoryId ? "Edit Submission" : "Submit Your Work"}
              </h1>
              <p className="text-sm text-[#646464] mt-1">
                AKAM Digital Platform — share your articles, stories, blogs, paintings, photographs, and videos with the world.
              </p>
            </div>
          </div>

          {/* Submission Type Selector */}
          {!editingStoryId && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">What are you submitting?</p>
              <div className="grid grid-cols-3 gap-3">
                {SUBMISSION_TABS.map((tab) => {
                  const isActive = submissionType === tab.type;
                  return (
                    <button
                      key={tab.type}
                      type="button"
                      onClick={() => {
                        setSubmissionType(tab.type);
                        setError(null);
                      }}
                      className={`group relative flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                        isActive ? tab.activeCard : tab.inactiveCard
                      }`}
                    >
                      <div
                        className={`p-2.5 rounded-xl transition-colors ${
                          isActive ? tab.activeIconWrapper : tab.inactiveIconWrapper
                        }`}
                      >
                        {tab.icon}
                      </div>
                      <span
                        className={`font-bold text-sm ${
                          isActive ? tab.activeLabel : "text-gray-900 group-hover:text-black"
                        }`}
                      >
                        {tab.label}
                      </span>
                      <span
                        className={`text-[11px] leading-snug hidden sm:block ${
                          isActive ? tab.activeDesc : "text-gray-400 group-hover:text-gray-600"
                        }`}
                      >
                        {tab.description}
                      </span>
                      {isActive && (
                        <div className="absolute top-3 right-3">
                          <CheckCircle2 className={`w-4 h-4 ${tab.activeCheck}`} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center justify-between mt-3 px-1 text-xs text-gray-500">
                <span>Presenting or testing?</span>
                <button
                  type="button"
                  onClick={() => fillDemoData(submissionType)}
                  className="inline-flex items-center gap-1 font-semibold text-amber-700 hover:text-amber-900 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Auto-fill {submissionType === "STORY" ? "Article" : submissionType === "PAINTING" ? "Visual Arts" : "Video"}
                </button>
              </div>
            </div>
          )}

          {/* Feedback alerts */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-700 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" /><span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0" /><span>{success}</span>
            </div>
          )}

          <div className="space-y-7">
            {/* Title & Category (Category only for Article) */}
            {submissionType === "STORY" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 outline-none focus:border-black cursor-pointer shadow-xs appearance-none pr-10"
                    >
                      {categories.length > 0 ? categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      )) : (
                        <>
                          <option value="Fiction">Fiction</option>
                          <option value="Non-Fiction">Non-Fiction</option>
                          <option value="Poetry">Poetry</option>
                          <option value="Culture">Culture</option>
                          <option value="Technology">Technology</option>
                          <option value="Art">Art</option>
                          <option value="Film">Film</option>
                          <option value="General">General</option>
                        </>
                      )}
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
                    Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your article title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 placeholder:text-[14px] bg-white border border-gray-200 rounded-2xl text-base text-gray-900 placeholder-gray-400 outline-none focus:border-black transition-all font-medium"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={submissionType === "PAINTING" ? "Enter your artwork or photograph title..." : "Enter your video title..."}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 placeholder:text-[14px] bg-white border border-gray-200 rounded-2xl text-base text-gray-900 placeholder-gray-400 outline-none focus:border-black transition-all font-medium"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
              Description <span className="text-rose-500 font-bold">*</span>
              </label>
              <textarea
                rows={2}
                placeholder={
                  submissionType === "STORY" ? "Enter a brief summary or excerpt of your article..." :
                  submissionType === "PAINTING" ? "Describe the artwork or photograph, medium/camera, inspiration..." :
                  "Describe what this video is about..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full px-5 py-3.5 placeholder:text-[14px] bg-white border border-gray-200 rounded-2xl text-base text-gray-900 placeholder-gray-400 outline-none focus:border-black transition-all font-medium resize-none"
              />
            </div>

            {/* ─── STORY: Cover image + text editor ─── */}
            {submissionType === "STORY" && (
              <>
                {/* Cover image */}
                <div>
                  <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
                    Cover Image <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div
                    className={`relative border-2 border-dashed transition-all rounded-[28px] overflow-hidden bg-white p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[180px] ${
                      error && !coverPreview ? "border-rose-300 bg-rose-50/20" : "border-gray-200 hover:border-gray-400"
                    }`}
                    onClick={() => !coverPreview && coverInputRef.current?.click()}
                  >
                    {coverPreview ? (
                      <div className="relative w-full max-w-xs aspect-[4/3] rounded-[24px] overflow-hidden shadow-sm border border-gray-200 bg-gray-100">
                        <Image src={coverPreview} alt="Cover Preview" fill className="object-cover" unoptimized />
                        <Button type="button" variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }} className="absolute top-3 right-3 shadow-md">Change Cover</Button>
                      </div>
                    ) : (
                      <div className="w-full flex flex-col items-center justify-center py-4">
                        <UploadCloud className="w-10 h-10 text-gray-300 stroke-[1.2] mb-2" />
                        <span className="text-sm text-gray-400 font-normal">Click to upload cover image for your article</span>
                        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Story editor */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider">
                      Article Content <span className="text-rose-500">*</span>
                    </label>
                    <Button
                      type="button"
                      variant={activeTab === "preview" ? "primary" : "secondary"}
                      size="sm"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      iconPosition="left"
                      onClick={() => { if (editorRef.current) setContent(editorRef.current.innerHTML); setActiveTab(activeTab === "write" ? "preview" : "write"); }}
                      className="shadow-xs cursor-pointer"
                    >
                      {activeTab === "write" ? "Reader Preview" : "Back to Editor"}
                    </Button>
                  </div>

                  {activeTab === "write" && (
                    <div className="bg-white border border-gray-200 rounded-2xl p-2 mb-3 flex flex-wrap items-center gap-1.5 shadow-xs sticky top-4 z-20">
                      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                        {[
                          { title: "Bold", cmd: "bold", icon: <Bold className="w-4 h-4" />, fmt: activeFormats.bold },
                          { title: "Italic", cmd: "italic", icon: <Italic className="w-4 h-4" />, fmt: activeFormats.italic },
                          { title: "Underline", cmd: "underline", icon: <Underline className="w-4 h-4" />, fmt: activeFormats.underline },
                          { title: "Strikethrough", cmd: "strikeThrough", icon: <Strikethrough className="w-4 h-4" />, fmt: activeFormats.strikethrough },
                        ].map((btn) => (
                          <button key={btn.cmd} type="button" title={btn.title} onClick={() => executeCommand(btn.cmd)} className={`p-2 rounded-xl transition-all cursor-pointer ${btn.fmt ? "bg-black text-white shadow-xs" : "text-gray-600 hover:bg-gray-100 hover:text-black"}`}>{btn.icon}</button>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                        <button type="button" title="H2" onClick={() => executeCommand("formatBlock", activeFormats.h2 ? "<p>" : "<h2>")} className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-all ${activeFormats.h2 ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}><Heading2 className="w-4 h-4" /> H2</button>
                        <button type="button" title="H3" onClick={() => executeCommand("formatBlock", activeFormats.h3 ? "<p>" : "<h3>")} className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer transition-all ${activeFormats.h3 ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}><Heading3 className="w-4 h-4" /> H3</button>
                      </div>
                      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                        <button type="button" title="Bullet List" onClick={() => executeCommand("insertUnorderedList")} className={`p-2 rounded-xl cursor-pointer transition-all ${activeFormats.bulletList ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}><List className="w-4 h-4" /></button>
                        <button type="button" title="Numbered List" onClick={() => executeCommand("insertOrderedList")} className={`p-2 rounded-xl cursor-pointer transition-all ${activeFormats.orderedList ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}><ListOrdered className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                        <button type="button" title="Insert Image" disabled={uploadingInlineImage} onClick={() => inlineInputRef.current?.click()} className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black cursor-pointer disabled:opacity-50 transition-all">
                          {uploadingInlineImage ? <Loader2 className="w-4 h-4 animate-spin text-purple-600" /> : <ImageIcon className="w-4 h-4" />}
                        </button>
                        <input ref={inlineInputRef} type="file" accept="image/*" onChange={handleInsertImage} className="hidden" />
                        <button type="button" title="Add Link" onClick={handleOpenLinkModal} className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black cursor-pointer transition-all"><LinkIcon className="w-4 h-4" /></button>
                        <button type="button" title="Remove Link" onClick={() => executeCommand("unlink")} className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black cursor-pointer transition-all"><Unlink className="w-4 h-4" /></button>
                        <button type="button" title="Blockquote" onClick={() => executeCommand("formatBlock", activeFormats.blockquote ? "<p>" : "blockquote")} className={`p-2 rounded-xl cursor-pointer transition-all ${activeFormats.blockquote ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"}`}><Quote className="w-4 h-4" /></button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button type="button" title="Undo" onClick={() => executeCommand("undo")} className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black cursor-pointer transition-all"><Undo className="w-4 h-4" /></button>
                        <button type="button" title="Redo" onClick={() => executeCommand("redo")} className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black cursor-pointer transition-all"><Redo className="w-4 h-4" /></button>
                        <button type="button" title="Clear Formatting" onClick={() => executeCommand("removeFormat")} className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black cursor-pointer transition-all"><RemoveFormatting className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}

                  <div className={activeTab === "write" ? "block" : "hidden"}>
                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handleEditorInput}
                      onKeyDown={handleEditorKeyDown}
                      onKeyUp={updateActiveStates}
                      onMouseUp={updateActiveStates}
                      onFocus={() => { if (typeof window !== "undefined") document.execCommand("defaultParagraphSeparator", false, "p"); }}
                      className="w-full p-6 sm:p-8 bg-white border border-gray-200 rounded-[28px] text-base text-gray-900 outline-none focus:border-black transition-all leading-relaxed min-h-[380px] shadow-xs font-poppins overflow-y-auto [&_p]:mb-4 [&_p]:mt-0 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_a]:text-emerald-700 [&_a]:underline [&_a]:font-medium [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-gray-950 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-gray-900 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:bg-gray-50/70 [&_blockquote]:rounded-r-xl"
                    />
                    <p className="text-xs text-gray-400 mt-2 px-3">
                      <span className="font-semibold text-gray-600">Tip:</span> Press{" "}
                      <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 border border-gray-200 font-mono text-[11px]">Enter</kbd> for a new paragraph.{" "}
                      <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 border border-gray-200 font-mono text-[11px]">Shift+Enter</kbd> for a line break.
                    </p>
                  </div>

                  {activeTab === "preview" && <div className="animate-in fade-in py-2">{renderVisualContent()}</div>}
                </div>
              </>
            )}

            {/* ─── VISUAL ARTS: Multi-Image Gallery & Optional Cover ─── */}
            {submissionType === "PAINTING" && (
              <div className="space-y-6">
                {/* 1. Main Gallery Upload Section */}
                <div className="bg-white rounded-[28px] border border-gray-200 p-6 sm:p-7 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-gray-100">
                    <div className="min-w-0">
                      <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider">
                        Visual Arts Artworks & Images <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Add one or multiple paintings, photographs, digital artworks, or illustrations. You can re-order or set any image as cover.
                      </p>
                    </div>
                    {paintingImages.length > 0 && (
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        <span className="inline-flex items-center justify-center whitespace-nowrap text-xs font-bold px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-full shrink-0">
                          {paintingImages.length}&nbsp;{paintingImages.length === 1 ? "Image" : "Images"}
                        </span>
                        <button
                          type="button"
                          onClick={() => paintingFilesInputRef.current?.click()}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 shadow-2xs hover:border-gray-400 transition-all cursor-pointer whitespace-nowrap shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span className="whitespace-nowrap">Add More</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Hidden file input supporting multiple */}
                  <input
                    ref={paintingFilesInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePaintingImagesSelect}
                    className="hidden"
                  />

                  {paintingImages.length === 0 ? (
                    <div
                      className="relative border-2 border-dashed border-gray-200 hover:border-purple-300 transition-all rounded-[24px] bg-purple-50/20 flex flex-col items-center justify-center text-center cursor-pointer py-14 px-6 group"
                      onClick={() => paintingFilesInputRef.current?.click()}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-purple-50 border-2 border-purple-100 flex items-center justify-center mb-3.5 group-hover:scale-105 transition-transform">
                        <Palette className="w-8 h-8 text-purple-600 stroke-[1.5]" />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">
                        Upload Visual Artworks
                      </h3>
                      <p className="text-xs text-gray-500 max-w-sm mb-3">
                        Drag & drop or click to select multiple high-resolution paintings, photographs, or digital artworks from your device.
                      </p>
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-xs group-hover:bg-purple-700 transition-colors">
                        <UploadCloud className="w-3.5 h-3.5" /> Choose Images (Multiple Allowed)
                      </span>
                      <p className="text-[11px] text-gray-400 mt-3">Supports JPG, PNG, WebP — max 20MB each</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {paintingImages.map((item, idx) => {
                          const isFirst = idx === 0;
                          return (
                            <div
                              key={item.id}
                              className={`group relative rounded-2xl border transition-all overflow-hidden bg-white flex flex-col ${
                                isFirst ? "border-purple-400 ring-2 ring-purple-100 shadow-sm" : "border-gray-200 hover:border-gray-300 shadow-xs"
                              }`}
                            >
                              {/* Image Aspect Box */}
                              <div className="relative aspect-[4/3] w-full bg-gray-900 overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={item.previewUrl}
                                  alt={item.name || `Artwork #${idx + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                                />

                                {/* Top Badges */}
                                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                  <span
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-xs ${
                                      isFirst
                                        ? "bg-purple-600 text-white flex items-center gap-1"
                                        : "bg-black/70 backdrop-blur-sm text-white"
                                    }`}
                                  >
                                    {isFirst ? (
                                      <>
                                        <Star className="w-3 h-3 fill-current" />
                                        #1 Cover (Default)
                                      </>
                                    ) : (
                                      `#${idx + 1}`
                                    )}
                                  </span>
                                </div>

                                {/* Action button on top right */}
                                <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePaintingImage(item.id)}
                                    title="Remove image"
                                    className="p-1.5 bg-black/60 hover:bg-rose-600 text-white rounded-lg shadow-md backdrop-blur-sm transition-all cursor-pointer flex items-center justify-center hover:scale-105"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Caption / Name Input & Card Action Footer */}
                              <div className="p-3 bg-white flex-1 flex flex-col justify-between gap-2.5">
                                <div>
                                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1 mb-1">
                                    <Edit3 className="w-3 h-3 text-purple-600" />
                                    Image / Artwork Name
                                  </label>
                                  <input
                                    type="text"
                                    value={item.name || ""}
                                    onChange={(e) => handleUpdatePaintingImageName(item.id, e.target.value)}
                                    placeholder={`e.g. Artwork #${idx + 1}`}
                                    className="w-full text-xs font-semibold text-gray-900 bg-gray-50/80 hover:bg-gray-100/90 focus:bg-white border border-gray-200 focus:border-purple-500 rounded-xl px-2.5 py-1.5 outline-none transition-all placeholder:text-gray-400 placeholder:font-normal shadow-2xs"
                                  />
                                </div>

                                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                  {isFirst ? (
                                    <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" /> Default Cover Image
                                    </span>
                                  ) : (
                                    <>
                                      <span className="text-[11px] text-gray-400">Slide #{idx + 1}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleMakePaintingImageCover(idx)}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border border-purple-200 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
                                      >
                                        <Star className="w-3 h-3 text-purple-600 fill-purple-200" />
                                        <span>Set as Cover</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Quick Add Card in Grid */}
                        <div
                          onClick={() => paintingFilesInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-200 hover:border-purple-300 rounded-2xl aspect-[4/3] flex flex-col items-center justify-center text-center cursor-pointer p-4 bg-gray-50/50 hover:bg-purple-50/30 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Plus className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-gray-700 group-hover:text-purple-700">Add More Images</span>
                          <span className="text-[10px] text-gray-400 mt-0.5">Click to select files</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Dedicated Optional Cover Image Section */}
                <div className="bg-white rounded-[28px] border border-gray-200 p-6 sm:p-7 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-semibold text-gray-800 uppercase tracking-wider">
                        Dedicated Cover Image
                      </label>
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md">
                        Optional
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl mb-4 text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Cover Image Option:</span> If you do not upload a custom cover image here,{" "}
                      <strong className="underline decoration-amber-400">the 1st image (#1)</strong> from your gallery above will automatically be used as the cover on all cards, homepage feeds, and previews.
                    </div>
                  </div>

                  <input
                    ref={paintingCoverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePaintingCoverSelect}
                    className="hidden"
                  />

                  {paintingCoverPreview ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-purple-200 bg-purple-50/30">
                      <div className="relative w-32 sm:w-40 aspect-[4/3] rounded-xl overflow-hidden shadow-xs border border-purple-200 bg-gray-100 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={paintingCoverPreview}
                          alt="Custom Cover Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md mb-1.5">
                          <Check className="w-3 h-3" /> Custom Cover Active
                        </div>
                        <p className="text-xs text-gray-600">
                          This dedicated image will be displayed on edition covers and work cards instead of Image #1.
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            type="button"
                            onClick={() => paintingCoverInputRef.current?.click()}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-gray-300 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-800 shadow-2xs transition-all cursor-pointer"
                          >
                            Change Custom Cover
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPaintingCoverFile(null);
                              setPaintingCoverPreview(null);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove (Use Image #1)
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => paintingCoverInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-200 hover:border-gray-400 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/60 transition-all group"
                    >
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                          <ImageIcon className="w-5 h-5 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 group-hover:text-black">
                            Upload a custom cover image (optional)
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Leave empty to automatically use Image #1 ({paintingImages[0]?.name || "Gallery Artwork #1"}) as the cover.
                          </p>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-300 bg-white text-xs font-semibold text-gray-800 shadow-2xs pointer-events-none shrink-0">
                        <UploadCloud className="w-3.5 h-3.5 text-gray-500" /> Select Cover
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── VIDEO: URL section ─── */}
            {submissionType === "VIDEO" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
                    Video URL <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-4 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="url"
                      placeholder="https://youtube.com/watch?v=... or Vimeo, Google Drive, MP4, WebM..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-black transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 px-1">
                    Accepted: YouTube (<code className="bg-gray-100 px-1 rounded text-xs">youtube.com</code>, <code className="bg-gray-100 px-1 rounded text-xs">youtu.be</code>, Shorts), Vimeo, Dailymotion, Google Drive, or direct video files (<code className="bg-gray-100 px-1 rounded text-xs">.mp4</code>, <code className="bg-gray-100 px-1 rounded text-xs">.webm</code>)
                  </p>
                </div>

                {/* Video embed preview */}
                {videoPreview ? (
                  <div className="bg-white rounded-[28px] border border-gray-200 overflow-hidden shadow-xs">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                      <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Video Preview</span>
                      <span
                        className={`ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${
                          videoPreview.type === "youtube"
                            ? "bg-red-100 text-red-700"
                            : videoPreview.type === "vimeo"
                            ? "bg-blue-100 text-blue-700"
                            : videoPreview.type === "googledrive"
                            ? "bg-amber-100 text-amber-700"
                            : videoPreview.type === "dailymotion"
                            ? "bg-sky-100 text-sky-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {videoPreview.type === "direct" ? "Direct Video File (MP4/WebM)" : videoPreview.type}
                      </span>
                    </div>
                    <div className="aspect-video w-full bg-black flex items-center justify-center">
                      {videoPreview.type === "direct" ? (
                        <video
                          src={videoPreview.directUrl}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <iframe
                          src={videoPreview.embedUrl}
                          className="w-full h-full border-0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Video Preview"
                        />
                      )}
                    </div>
                  </div>
                ) : videoUrl.trim() ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>URL not recognized. Supports YouTube, Shorts, Vimeo, Dailymotion, Google Drive, or direct MP4/WebM video links.</span>
                  </div>
                ) : null}

                {/* Mandatory Video Thumbnail */}
                <div className="bg-white rounded-[28px] border border-gray-200 p-6 sm:p-7 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider">
                        Thumbnail Image <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Required cover image displayed across catalog cards, search results, and video headers.
                      </p>
                    </div>
                    {coverPreview && (
                      <span className="self-start sm:self-auto text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Thumbnail Ready (Editable)
                      </span>
                    )}
                  </div>

                  <div
                    className="relative border-2 border-dashed rounded-[24px] bg-gray-50/40 hover:bg-gray-50/80 flex flex-col items-center justify-center cursor-pointer min-h-[160px] border-gray-200 hover:border-gray-400 transition-all p-4"
                    onClick={() => !coverPreview && coverInputRef.current?.click()}
                  >
                    {coverPreview ? (
                      <div className="relative w-full max-w-sm aspect-video rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-gray-900 group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverPreview}
                          alt="Thumbnail Preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              coverInputRef.current?.click();
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-gray-900 text-xs font-bold shadow-lg hover:bg-gray-100 transition-all cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-purple-600" />
                            Change Thumbnail
                          </button>
                        </div>
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              coverInputRef.current?.click();
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-black/70 hover:bg-black text-white backdrop-blur-sm shadow-md transition-all cursor-pointer"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-6 px-4 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-2.5">
                          <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                        </div>
                        <span className="text-xs font-bold text-gray-800">Upload Video Thumbnail</span>
                        <p className="text-[11px] text-gray-500 max-w-xs mt-1">
                          Auto-fetched when you paste a video link, or click here to upload your own custom thumbnail image.
                        </p>
                      </div>
                    )}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCoverSelect}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t border-gray-200">
              <Link href="/profile" className="w-full sm:w-auto">
                <Button type="button" variant="secondary" size="md" className="w-full sm:w-auto px-5 py-2.5 font-medium text-xs sm:text-sm border border-gray-300 shadow-xs cursor-pointer justify-center whitespace-nowrap">
                  Cancel
                </Button>
              </Link>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  icon={savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  iconPosition="left"
                  disabled={savingDraft || submitting}
                  onClick={() => handleSave(false)}
                  className="w-full sm:w-auto px-5 py-2.5 font-medium text-xs sm:text-sm border border-gray-300 shadow-xs cursor-pointer justify-center whitespace-nowrap disabled:opacity-50"
                >
                  {savingDraft ? "Saving..." : editingStoryId ? "Update Draft" : "Save Draft"}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  icon={submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  iconPosition="left"
                  disabled={savingDraft || submitting}
                  onClick={() => handleSave(true)}
                  className="w-full sm:w-auto px-5 py-2.5 font-medium text-xs sm:text-sm cursor-pointer shadow-xs justify-center whitespace-nowrap disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit for Review"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Link Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 font-poppins relative">
            <button onClick={() => setLinkModalOpen(false)} className="absolute top-5 right-5 text-gray-400 hover:text-black p-1 rounded-full hover:bg-gray-100 transition-all cursor-pointer"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700"><Globe className="w-5 h-5" /></div>
              <div><h3 className="text-lg font-bold text-gray-900">Insert Hyperlink</h3><p className="text-xs text-gray-500">Add an external link or reference URL</p></div>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-1.5">Link Text <span className="text-gray-400 font-normal">(Optional)</span></label>
                <input type="text" placeholder="e.g. Read full study" value={linkText} onChange={(e) => setLinkText(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-black focus:bg-white transition-all font-medium" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-1.5">Target URL <span className="text-rose-500">*</span></label>
                <input type="url" placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleApplyLink(); }} autoFocus className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-black focus:bg-white transition-all font-medium" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="secondary" size="sm" onClick={() => setLinkModalOpen(false)} className="px-4 py-2 text-xs border border-gray-300">Cancel</Button>
              <Button type="button" variant="primary" size="sm" onClick={handleApplyLink} className="px-5 py-2 text-xs">Apply Hyperlink</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
