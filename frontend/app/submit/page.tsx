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
} from "lucide-react";
import Button from "@/components/ui/Button";
import { API_BASE_URL, apiFetch } from "@/lib/config";

type SubmissionType = "STORY" | "PAINTING" | "VIDEO";

const SUBMISSION_TABS: { type: SubmissionType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    type: "STORY",
    label: "Article / Story",
    icon: <BookOpen className="w-5 h-5" />,
    description: "Write & submit an article, blog, story, or essay",
  },
  {
    type: "PAINTING",
    label: "Painting",
    icon: <Palette className="w-5 h-5" />,
    description: "Upload a painting, artwork, or visual piece",
  },
  {
    type: "VIDEO",
    label: "Video",
    icon: <Video className="w-5 h-5" />,
    description: "Share a YouTube or Vimeo video link",
  },
];

function extractYoutubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function extractVimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
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

  // Video fields
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPreviewId, setVideoPreviewId] = useState<{ type: "youtube" | "vimeo"; id: string } | null>(null);

  // Refs
  const coverInputRef = useRef<HTMLInputElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

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

  // ─── Video preview helper ─────────────────────────────────────────────────
  useEffect(() => {
    if (!videoUrl.trim()) { setVideoPreviewId(null); return; }
    const ytId = extractYoutubeId(videoUrl);
    if (ytId) { setVideoPreviewId({ type: "youtube", id: ytId }); return; }
    const vimId = extractVimeoId(videoUrl);
    if (vimId) { setVideoPreviewId({ type: "vimeo", id: vimId }); return; }
    setVideoPreviewId(null);
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

  // ─── Submit / Save ─────────────────────────────────────────────────────────
  const handleSave = async (isSubmitForReview: boolean) => {
    setError(null);

    if (!title.trim()) { setError("Please enter a title."); return; }
    if (!description.trim()) { setError("Description is required."); return; }

    if (submissionType === "STORY") {
      const rawHtml = editorRef.current ? editorRef.current.innerHTML : content;
      const md = convertHtmlToMarkdown(rawHtml);
      if (!md.trim()) { setError("Article or story content is required."); return; }
      if (!coverFile && !coverPreview) { setError("Cover image is required for articles & stories."); return; }
    }

    if (submissionType === "PAINTING") {
      if (!coverFile && !coverPreview) { setError("Please upload your painting artwork."); return; }
    }

    if (submissionType === "VIDEO") {
      if (!videoUrl.trim()) { setError("Please enter a video URL."); return; }
      if (!videoPreviewId) { setError("Please enter a valid YouTube or Vimeo URL."); return; }
    }

    if (isSubmitForReview) setSubmitting(true);
    else setSavingDraft(true);

    try {
      await apiFetch(`${API_BASE_URL}/users/me/become-author`, { method: "POST" });

      const rawHtml = editorRef.current ? editorRef.current.innerHTML : content;
      const markdownContent = submissionType === "STORY" ? convertHtmlToMarkdown(rawHtml) : "";
      const selectedCategory = category || (categories.length > 0 ? categories[0].name : "General");

      const storyPayload = {
        title,
        description,
        content: markdownContent,
        category: selectedCategory,
        submissionType,
        mediaUrl: submissionType === "VIDEO" ? videoUrl.trim() : undefined,
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

      // Upload cover if present
      if (coverFile) {
        const fd = new FormData();
        fd.append("file", coverFile);
        await apiFetch(`${API_BASE_URL}/stories/${story.id}/cover`, { method: "POST", body: fd });
      }

      if (isSubmitForReview) {
        const submitRes = await apiFetch(`${API_BASE_URL}/stories/${story.id}/submit`, { method: "POST" });
        if (!submitRes.ok) throw new Error("Saved but failed to submit for review");
        const typeLabel = submissionType === "STORY" ? "article / story" : submissionType === "PAINTING" ? "painting" : "video";
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
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
              {editingStoryId ? "Edit Submission" : "Submit Your Work"}
            </h1>
            <p className="text-sm text-[#646464] mt-1">
              AKAM Digital Platform — share your articles, stories, blogs, paintings, and videos with the world.
            </p>
          </div>

          {/* Submission Type Selector */}
          {!editingStoryId && (
            <div className="mb-8">
              <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">What are you submitting?</p>
              <div className="grid grid-cols-3 gap-3">
                {SUBMISSION_TABS.map((tab) => (
                  <button
                    key={tab.type}
                    type="button"
                    onClick={() => { setSubmissionType(tab.type); setError(null); }}
                    className={`relative flex flex-col items-center gap-2 p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                      submissionType === tab.type
                        ? "border-black bg-black text-white shadow-md"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl ${submissionType === tab.type ? "bg-white/15" : "bg-gray-100"}`}>
                      {tab.icon}
                    </div>
                    <span className="font-bold text-sm">{tab.label}</span>
                    <span className={`text-[11px] leading-snug hidden sm:block ${submissionType === tab.type ? "text-white/70" : "text-gray-400"}`}>
                      {tab.description}
                    </span>
                    {submissionType === tab.type && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
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
            {/* Common: Category + Title */}
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
                  placeholder={submissionType === "STORY" ? "Enter your article or story title..." : submissionType === "PAINTING" ? "Enter your artwork title..." : "Enter your video title..."}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-5 py-3.5 placeholder:text-[14px] bg-white border border-gray-200 rounded-2xl text-base text-gray-900 placeholder-gray-400 outline-none focus:border-black transition-all font-medium"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
              Description <span className="text-rose-500 font-bold">*</span>
              </label>
              <textarea
                rows={2}
                placeholder={
                  submissionType === "STORY" ? "Enter a brief summary or excerpt of your article, blog, or story..." :
                  submissionType === "PAINTING" ? "Describe the artwork, medium, inspiration..." :
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
                        <span className="text-sm text-gray-400 font-normal">Click to upload cover image for your article / story</span>
                        <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Story editor */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider">
                      Article / Story Content <span className="text-rose-500">*</span>
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

            {/* ─── PAINTING: Image upload section ─── */}
            {submissionType === "PAINTING" && (
              <div>
                <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
                  Artwork / Painting Image <span className="text-rose-500 font-bold">*</span>
                </label>
                <div
                  className="relative border-2 border-dashed transition-all rounded-[28px] overflow-hidden bg-white flex flex-col items-center justify-center text-center cursor-pointer min-h-[320px] border-gray-200 hover:border-gray-400"
                  onClick={() => !coverPreview && coverInputRef.current?.click()}
                >
                  {coverPreview ? (
                    <div className="relative w-full aspect-[4/3] max-h-[500px] bg-gray-50">
                      <Image src={coverPreview} alt="Artwork Preview" fill className="object-contain" unoptimized />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); coverInputRef.current?.click(); }} className="shadow-md">Change Image</Button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }} className="p-1.5 bg-white border border-gray-200 rounded-xl shadow-md hover:bg-rose-50 text-gray-600 hover:text-rose-600 cursor-pointer transition-all"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center py-16 px-6">
                      <div className="w-20 h-20 rounded-[28px] bg-purple-50 border-2 border-purple-100 flex items-center justify-center mb-4">
                        <Palette className="w-10 h-10 text-purple-400 stroke-[1.2]" />
                      </div>
                      <h3 className="text-base font-bold text-gray-800 mb-1">Upload Your Artwork</h3>
                      <p className="text-sm text-gray-400 max-w-xs">Drag & drop or click to upload a high-resolution scan or photo of your painting.</p>
                      <p className="text-xs text-gray-300 mt-3">Supports JPG, PNG, WebP — max 20MB</p>
                    </div>
                  )}
                  <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
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
                      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-black transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 px-1">
                    Accepted: YouTube (<code className="bg-gray-100 px-1 rounded text-xs">youtube.com</code>, <code className="bg-gray-100 px-1 rounded text-xs">youtu.be</code>) and Vimeo (<code className="bg-gray-100 px-1 rounded text-xs">vimeo.com</code>)
                  </p>
                </div>

                {/* Video embed preview */}
                {videoPreviewId ? (
                  <div className="bg-white rounded-[28px] border border-gray-200 overflow-hidden shadow-xs">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                      <Play className="w-4 h-4 text-emerald-600 fill-emerald-600" />
                      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Video Preview</span>
                      <span className={`ml-auto text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${videoPreviewId.type === "youtube" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                        {videoPreviewId.type}
                      </span>
                    </div>
                    <div className="aspect-video w-full bg-gray-900">
                      {videoPreviewId.type === "youtube" ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${videoPreviewId.id}`}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title="Video Preview"
                        />
                      ) : (
                        <iframe
                          src={`https://player.vimeo.com/video/${videoPreviewId.id}`}
                          className="w-full h-full"
                          allow="autoplay; fullscreen; picture-in-picture"
                          allowFullScreen
                          title="Vimeo Preview"
                        />
                      )}
                    </div>
                  </div>
                ) : videoUrl.trim() ? (
                  <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-700 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>URL not recognized. Please use a valid YouTube or Vimeo link.</span>
                  </div>
                ) : null}

                {/* Optional thumbnail */}
                <div>
                  <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
                    Thumbnail Image <span className="text-gray-400 font-normal lowercase">(optional)</span>
                  </label>
                  <div
                    className="relative border-2 border-dashed rounded-[28px] bg-white flex flex-col items-center justify-center cursor-pointer min-h-[140px] border-gray-200 hover:border-gray-400 transition-all"
                    onClick={() => !coverPreview && coverInputRef.current?.click()}
                  >
                    {coverPreview ? (
                      <div className="relative w-full max-w-xs aspect-video rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-gray-100 m-4">
                        <Image src={coverPreview} alt="Thumbnail Preview" fill className="object-cover" unoptimized />
                        <Button type="button" variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); setCoverFile(null); setCoverPreview(null); }} className="absolute top-3 right-3 shadow-md">Change</Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-8 px-4">
                        <ImageIcon className="w-8 h-8 text-gray-300 mb-2 stroke-[1.2]" />
                        <span className="text-xs text-gray-400">Upload a thumbnail image (optional)</span>
                      </div>
                    )}
                    <input ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverSelect} className="hidden" />
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
