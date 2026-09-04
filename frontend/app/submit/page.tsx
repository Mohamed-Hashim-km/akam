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
  CheckCircle2,
  AlertCircle,
  Sparkles,
  LogIn,
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
} from "lucide-react";
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

  // Link Insertion Modal State
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");
  const savedRangeRef = useRef<Range | null>(null);

  // Formatting Active States
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    bulletList: false,
    orderedList: false,
    h2: false,
    h3: false,
    blockquote: false,
  });

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
    let html = mdStr.replace(/\r\n/g, "\n");

    // Clean up &nbsp;
    html = html.replace(/&nbsp;/gi, " ");
    html = html.replace(/&#160;/gi, " ");

    // Convert markdown images ![alt](url)
    html = html.replace(
      /!\[(.*?)\]\((.*?)\)/g,
      '<div contenteditable="false" class="my-6 text-center select-none"><img src="$2" alt="$1" class="max-h-[420px] w-auto mx-auto rounded-2xl border border-gray-200 shadow-md object-cover inline-block" /></div><p><br></p>'
    );

    // Headings ## or ### (convert before bold/italic tags)
    html = html.replace(/^###\s+(.*)$/gm, '<h3 class="text-xl font-bold my-3 text-gray-900">$1</h3>');
    html = html.replace(/^##\s+(.*)$/gm, '<h2 class="text-2xl font-bold my-4 text-gray-950">$1</h2>');

    // Bold **text** or __text__
    html = html.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    html = html.replace(/__(.*?)__/g, "<b>$1</b>");

    // Italic *text* or _text_
    html = html.replace(/\*(.*?)\*/g, "<i>$1</i>");

    // Links [text](url)
    html = html.replace(
      /\[(.*?)\]\((.*?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-medium hover:text-emerald-900">$1</a>'
    );

    // Blockquotes > quote
    html = html.replace(
      /^>\s+(.*)$/gm,
      '<blockquote class="border-l-4 border-emerald-500 pl-4 py-2 italic my-4 text-gray-800 bg-gray-50/70 rounded-r-xl">$1</blockquote>'
    );

    // Bullet points
    html = html.replace(/^[\*\-]\s+(.*)$/gm, '<ul class="my-2"><li class="ml-4 list-disc mb-1 text-gray-900">$1</li></ul>');

    // Numbered points
    html = html.replace(/^\d+\.\s+(.*)$/gm, '<ol class="my-2"><li class="ml-4 list-decimal mb-1 text-gray-900">$1</li></ol>');

    // Strip remaining raw markdown syntax markers if unpaired
    html = html.replace(/\*\*/g, "");

    const lines = html.split("\n");
    const resultBlocks: string[] = [];
    let currentParagraphLines: string[] = [];

    const flushParagraph = () => {
      if (currentParagraphLines.length > 0) {
        const text = currentParagraphLines.join("<br>");
        if (text.trim()) {
          // Standard story paragraph: generous line-height + bottom margin
          resultBlocks.push(`<p class="mb-6 leading-[1.9] text-gray-900 whitespace-pre-wrap">${text}</p>`);
        }
        currentParagraphLines = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        if (currentParagraphLines.length > 0) {
          // First blank line after text → end the paragraph normally
          flushParagraph();
        } else {
          // Consecutive blank line (double-Enter) → visible section gap
          resultBlocks.push('<div class="mb-10 select-none" aria-hidden="true"></div>');
        }
        continue;
      }

      if (
        trimmed.startsWith('<div contenteditable="false"') ||
        trimmed.startsWith("<h2") ||
        trimmed.startsWith("<h3") ||
        trimmed.startsWith("<blockquote") ||
        trimmed.startsWith("<ul") ||
        trimmed.startsWith("<ol") ||
        trimmed.startsWith("<p")
      ) {
        flushParagraph();
        resultBlocks.push(trimmed);
        continue;
      }

      currentParagraphLines.push(trimmed);
    }
    flushParagraph();

    return resultBlocks.join("");
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
    } catch (e) {
      // ignore
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    setContent(editorRef.current.innerHTML);
    updateActiveStates();
  };

  const handleOpenLinkModal = () => {
    if (typeof window !== "undefined") {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
        setLinkText(sel.toString());
      } else {
        savedRangeRef.current = null;
        setLinkText("");
      }
    }
    setLinkUrl("");
    setLinkModalOpen(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl.trim()) {
      setLinkModalOpen(false);
      return;
    }
    let finalUrl = linkUrl.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    if (editorRef.current) {
      editorRef.current.focus();
      if (savedRangeRef.current && typeof window !== "undefined") {
        const sel = window.getSelection();
        if (sel) {
          sel.removeAllRanges();
          sel.addRange(savedRangeRef.current);
        }
      }

      const selectionText = window.getSelection()?.toString();
      if (linkText.trim() && (!selectionText || selectionText !== linkText)) {
        const linkHtml = `<a href="${finalUrl}" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline font-medium hover:text-emerald-900">${linkText}</a>`;
        document.execCommand("insertHTML", false, linkHtml);
      } else {
        document.execCommand("createLink", false, finalUrl);
      }
      setContent(editorRef.current.innerHTML);
    }
    setLinkModalOpen(false);
  };

  const handleRemoveLink = () => {
    executeCommand("unlink");
  };

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
          const markdownImg = `\n\n![Inline Image](${imgUrl})\n\n`;
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
      updateActiveStates();
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      const editor = editorRef.current;
      if (!editor) return;

      // Set default paragraph separator to p
      document.execCommand("defaultParagraphSeparator", false, "p");

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        let node: Node | null = range.startContainer;

        // Convert stray <div> block to <p>
        while (node && node !== editor) {
          if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === "DIV") {
            document.execCommand("formatBlock", false, "p");
            break;
          }
          node = node.parentNode;
        }

        // If at root of editor or bare text node, wrap in <p>
        if (range.startContainer === editor || range.startContainer.parentNode === editor) {
          document.execCommand("formatBlock", false, "p");
        }
      }

      // Insert paragraph break
      document.execCommand("insertParagraph", false);

      if (editor) {
        setContent(editor.innerHTML);
        updateActiveStates();
      }
    }
  };

  const convertHtmlToMarkdown = (htmlStr: string): string => {
    if (!htmlStr) return "";
    let result = htmlStr;

    // Clean up non-breaking spaces
    result = result.replace(/&nbsp;/gi, " ");
    result = result.replace(/&#160;/gi, " ");

    // Inline images
    result = result.replace(/<div contenteditable="false".*?<img src="(.*?)".*?<\/div>/gi, "\n\n![Inline Image]($1)\n\n");
    result = result.replace(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi, "\n\n![Inline Image]($1)\n\n");

    // Links
    result = result.replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, "[$2]($1)");

    // Formatting tags
    result = result.replace(/<b>(.*?)<\/b>/gi, "**$1**");
    result = result.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
    result = result.replace(/<i>(.*?)<\/i>/gi, "*$1*");
    result = result.replace(/<em>(.*?)<\/em>/gi, "*$1*");
    result = result.replace(/<u>(.*?)<\/u>/gi, "<u>$1</u>");
    result = result.replace(/<s>(.*?)<\/s>/gi, "~~$1~~");
    result = result.replace(/<strike>(.*?)<\/strike>/gi, "~~$1~~");

    // Headings
    result = result.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "\n\n## $1\n\n");
    result = result.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "\n\n### $1\n\n");

    // Blockquotes
    result = result.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "\n\n> $1\n\n");

    // Lists
    result = result.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
    result = result.replace(/<\/?ul[^>]*>/gi, "\n\n");
    result = result.replace(/<\/?ol[^>]*>/gi, "\n\n");

    // ── Step 1: Mark empty paragraphs with a placeholder BEFORE boundary processing.
    // This prevents the </p>\s*<p> regex from swallowing the gap on step 3.
    result = result.replace(/<p[^>]*><br\s*\/?>\s*<\/p>/gi, "§BLANK§");
    result = result.replace(/<div[^>]*aria-hidden[^>]*><\/div>/gi, "§BLANK§");
    result = result.replace(/<p[^>]*>\s*<\/p>/gi, "§BLANK§");

    // ── Step 2: Normal paragraph boundary → \n\n (single Enter gap)
    result = result.replace(/<\/p>\s*<p[^>]*>/gi, "\n\n");
    result = result.replace(/<p[^>]*>/gi, "");
    result = result.replace(/<\/p>/gi, "\n\n");
    result = result.replace(/<br\s*\/?>/gi, "\n");
    result = result.replace(/<div[^>]*>/gi, "\n\n").replace(/<\/div>/gi, "");

    // ── Step 3: Restore placeholder → \n (1 newline each).
    // Each §BLANK§ is already sandwiched between \n\n from </p> stripping,
    // so 1 extra Enter adds exactly 1 more \n to the gap (linear scaling).
    result = result.replace(/§BLANK§/g, "\n");

    // Strip unhandled HTML tags except <u>
    result = result.replace(/<(?!u|\/u)[^>]+>/gi, "");

    // Clean up spaces adjacent to markdown formatting
    result = result.replace(/\*\*\s+/g, "**");
    result = result.replace(/\s+\*\*/g, "**");

    // Normalize Windows newlines
    result = result.replace(/\r\n/g, "\n");

    // Allow up to 8 consecutive newlines (prevents accidental 100-Enter spam)
    result = result.replace(/\n{9,}/g, "\n\n\n\n\n\n\n\n");

    return result.trim();
  };

  const handleSaveStory = async (isSubmitForReview: boolean) => {
    const rawEditorHtml = editorRef.current ? editorRef.current.innerHTML : content;
    const markdownContent = convertHtmlToMarkdown(rawEditorHtml);

    if (!title.trim() || !markdownContent.trim()) {
      setError("Please fill in both title and story content.");
      return;
    }

    if (!coverFile && !coverPreview) {
      setError("Cover image is required. Please upload a main story cover image.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiFetch(`${API_BASE_URL}/users/me/become-author`, {
        method: "POST",
      });

      let story: any;

      if (editingStoryId) {
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

      if (coverFile) {
        const formData = new FormData();
        formData.append("file", coverFile);
        await apiFetch(`${API_BASE_URL}/stories/${story.id}/cover`, {
          method: "POST",
          body: formData,
        });
      }

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

    const regex = /!\[(.*?)\]\((.*?)\)|<img\s+[^>]*src=["']([^"']+)["'][^>]*>/gi;
    const parts: Array<{ type: "text"; value: string } | { type: "image"; src: string; alt: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(markdownContent)) !== null) {
      if (match.index > lastIndex) {
        const rawText = markdownContent.substring(lastIndex, match.index);
        if (rawText.trim()) {
          parts.push({ type: "text", value: rawText });
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
      if (rawText.trim()) {
        parts.push({ type: "text", value: rawText });
      }
    }

    const currentDate = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const authorDisplayName =
      user?.name && user.name.trim().length > 0 ? user.name : user?.email || "AKAM Author";

    return (
      <article className="bg-white rounded-[32px] p-6 sm:p-10 border border-gray-200 shadow-sm max-w-3xl mx-auto font-poppins space-y-6">
        <div className="flex items-center gap-2">
          <span className="bg-[#E4F953] text-[#040706] font-bold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-xl shadow-xs">
            PUBLISHED ARTICLE
          </span>
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> {currentDate}
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-950 tracking-tight leading-tight">
          {title || "Untitled Story"}
        </h1>

        <div className="flex items-center justify-between py-4 border-y border-gray-100 my-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gray-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt="Author" fill className="object-cover" unoptimized />
              ) : (
                <span>{authorDisplayName[0].toUpperCase()}</span>
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

              const renderedChunkHtml = convertMarkdownToHtml(part.value);
              return (
                <div
                  key={index}
                  className="prose prose-lg max-w-none text-gray-900 leading-[1.9] font-normal [&_p]:mb-6 [&_p]:mt-0 [&_p]:leading-[1.9] [&_p]:text-[#1A1A1A] [&_div]:mb-10 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_a]:text-emerald-700 [&_a]:underline [&_a]:font-medium [&_a]:hover:text-emerald-900 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-gray-950 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-gray-900 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:bg-gray-50/70 [&_blockquote]:rounded-r-xl"
                  dangerouslySetInnerHTML={{ __html: renderedChunkHtml }}
                />
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
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-black mb-2 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to AKAM Digital
              </Link>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                {editingStoryId ? "Edit Story Draft" : "Authoring Studio"}
              </h1>
              <p className="text-sm text-[#646464] mt-1">
                {editingStoryId
                  ? "Update your story draft title, text, or cover image before submitting."
                  : "Draft your narrative, apply rich formatting, insert hyperlinks & imagery, and submit for editorial review."}
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
            {/* Story Cover Image Upload Dropzone */}
            <div>
              <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-2">
                Main Story Cover Image <span className="text-rose-500 font-bold">*</span>
              </label>
              <div
                className={`relative border-2 border-dashed transition-all rounded-[28px] overflow-hidden bg-white p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[220px] ${
                  error && !coverPreview ? "border-rose-300 bg-rose-50/20" : "border-gray-200 hover:border-gray-400"
                }`}
              >
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

            {/* Editor Workspace & Editorial Formatting Toolbar */}
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

                {/* Inline Image Action */}
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<ImageIcon className="w-3.5 h-3.5 text-gray-700" />}
                    iconPosition="left"
                    onClick={() => inlineInputRef.current?.click()}
                    className="shadow-xs cursor-pointer border border-gray-300 bg-white hover:bg-gray-50 text-gray-800"
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

              {/* Editorial Formatting Toolbar */}
              {activeTab === "write" && (
                <div className="bg-white border border-gray-200 rounded-2xl p-2 mb-3 flex flex-wrap items-center gap-1.5 shadow-xs sticky top-4 z-20">
                  {/* Text Style Group */}
                  <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                    <button
                      type="button"
                      title="Bold (Ctrl+B)"
                      onClick={() => executeCommand("bold")}
                      className={`p-2 rounded-xl transition-all ${
                        activeFormats.bold
                          ? "bg-black text-white shadow-xs"
                          : "text-gray-600 hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Italic (Ctrl+I)"
                      onClick={() => executeCommand("italic")}
                      className={`p-2 rounded-xl transition-all ${
                        activeFormats.italic
                          ? "bg-black text-white shadow-xs"
                          : "text-gray-600 hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Underline (Ctrl+U)"
                      onClick={() => executeCommand("underline")}
                      className={`p-2 rounded-xl transition-all ${
                        activeFormats.underline
                          ? "bg-black text-white shadow-xs"
                          : "text-gray-600 hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Strikethrough"
                      onClick={() => executeCommand("strikeThrough")}
                      className={`p-2 rounded-xl transition-all ${
                        activeFormats.strikethrough
                          ? "bg-black text-white shadow-xs"
                          : "text-gray-600 hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Headings Group */}
                  <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                    <button
                      type="button"
                      title="Section Heading (H2)"
                      onClick={() =>
                        executeCommand("formatBlock", activeFormats.h2 ? "<p>" : "<h2>")
                      }
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 ${
                        activeFormats.h2
                          ? "bg-black text-white shadow-xs"
                          : "text-gray-600 hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      <Heading2 className="w-4 h-4" /> H2
                    </button>
                    <button
                      type="button"
                      title="Subheading (H3)"
                      onClick={() =>
                        executeCommand("formatBlock", activeFormats.h3 ? "<p>" : "<h3>")
                      }
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1 ${
                        activeFormats.h3
                          ? "bg-black text-white shadow-xs"
                          : "text-gray-600 hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      <Heading3 className="w-4 h-4" /> H3
                    </button>
                  </div>

                  {/* Lists Group */}
                  <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                    <button
                      type="button"
                      title="Bullet Points List"
                      onClick={() => executeCommand("insertUnorderedList")}
                      className={`p-2 rounded-xl transition-all ${
                        activeFormats.bulletList
                          ? "bg-black text-white shadow-xs"
                          : "text-gray-600 hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Numbered Points List"
                      onClick={() => executeCommand("insertOrderedList")}
                      className={`p-2 rounded-xl transition-all ${
                        activeFormats.orderedList
                          ? "bg-black text-white shadow-xs"
                          : "text-gray-600 hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Hyperlink & Quotes Group */}
                  <div className="flex items-center gap-1 pr-2 border-r border-gray-200">
                    <button
                      type="button"
                      title="Add / Edit Hyperlink"
                      onClick={handleOpenLinkModal}
                      className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black transition-all"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Remove Hyperlink"
                      onClick={handleRemoveLink}
                      className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black transition-all"
                    >
                      <Unlink className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Blockquote"
                      onClick={() =>
                        executeCommand("formatBlock", activeFormats.blockquote ? "<p>" : "blockquote")
                      }
                      className={`p-2 rounded-xl transition-all ${
                        activeFormats.blockquote
                          ? "bg-black text-white shadow-xs"
                          : "text-gray-600 hover:bg-gray-100 hover:text-black"
                      }`}
                    >
                      <Quote className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Utilities Group */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="Undo"
                      onClick={() => executeCommand("undo")}
                      className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black transition-all"
                    >
                      <Undo className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Redo"
                      onClick={() => executeCommand("redo")}
                      className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black transition-all"
                    >
                      <Redo className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      title="Clear Formatting"
                      onClick={() => executeCommand("removeFormat")}
                      className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black transition-all"
                    >
                      <RemoveFormatting className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Rich Visual Document Canvas */}
              {activeTab === "write" ? (
                <div>
                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    onKeyDown={handleEditorKeyDown}
                    onKeyUp={updateActiveStates}
                    onMouseUp={updateActiveStates}
                    onFocus={() => {
                      if (typeof window !== "undefined") {
                        document.execCommand("defaultParagraphSeparator", false, "p");
                      }
                    }}
                    className="w-full p-6 sm:p-8 bg-white border border-gray-200 rounded-[28px] text-base text-gray-900 outline-none focus:border-black transition-all leading-relaxed min-h-[380px] shadow-xs font-poppins overflow-y-auto [&_p]:mb-4 [&_p]:mt-0 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_a]:text-emerald-700 [&_a]:underline [&_a]:font-medium [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-gray-950 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-5 [&_h3]:mb-2 [&_h3]:text-gray-900 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-500 [&_blockquote]:pl-4 [&_blockquote]:py-2 [&_blockquote]:italic [&_blockquote]:my-4 [&_blockquote]:bg-gray-50/70 [&_blockquote]:rounded-r-xl"
                  />
                  <p className="text-xs text-gray-400 mt-2 px-3">
                    <span className="font-semibold text-gray-600">Tip:</span> Pressing <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 border border-gray-200 font-mono text-[11px]">Enter</kbd> creates double-spaced (<code className="text-gray-600 font-mono text-[11px]">\n\n</code>) paragraph breaks. Use <kbd className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 border border-gray-200 font-mono text-[11px]">Shift+Enter</kbd> for single line breaks.
                  </p>
                </div>
              ) : (
                /* Visual Reader View */
                <div className="animate-in fade-in py-2">{renderVisualContent()}</div>
              )}
            </div>

            {/* Action Bar */}
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

      {/* Interactive Link Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 font-poppins relative">
            <button
              onClick={() => setLinkModalOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-black p-1 rounded-full hover:bg-gray-100 transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Insert Hyperlink</h3>
                <p className="text-xs text-gray-500">Add an external link or reference URL</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-1.5">
                  Link Text <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Read full study"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-black focus:bg-white transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-800 uppercase tracking-wider mb-1.5">
                  Target URL <span className="text-rose-500">*</span>
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleApplyLink();
                  }}
                  autoFocus
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none focus:border-black focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setLinkModalOpen(false)}
                className="px-4 py-2 text-xs border border-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleApplyLink}
                className="px-5 py-2 text-xs"
              >
                Apply Hyperlink
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
