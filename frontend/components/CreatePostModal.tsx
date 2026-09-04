"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { X, Upload, Tag, Send, Loader2, Image as ImageIcon, Link as LinkIcon, AlertCircle } from "lucide-react";
import Button from "./ui/Button";
import { API_BASE_URL, apiFetch } from "@/lib/config";

interface CreatePostModalProps {
  isOpen: boolean;
  communitySlug: string;
  communityName: string;
  onClose: () => void;
  onSuccess: (postId: string) => void;
}

const flairs = [
  { id: "DISCUSSION", label: "Discussion", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "QUESTION", label: "Question", color: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "ANNOUNCEMENT", label: "Announcement", color: "bg-red-100 text-red-700 border-red-200" },
  { id: "RESOURCE", label: "Resource", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { id: "FEEDBACK", label: "Feedback", color: "bg-amber-100 text-amber-700 border-amber-200" },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  communitySlug,
  communityName,
  onClose,
  onSuccess,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [flair, setFlair] = useState("DISCUSSION");
  const [linkUrl, setLinkUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle Image File Selection & Asynchronous Upload
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show instant local preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setUploadingImage(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = typeof window !== "undefined" ? localStorage.getItem("akam_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/uploads/image`, {
        method: "POST",
        headers,
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image. Please try again.");
      }

      const data = await res.json();
      if (data.url) {
        const fullUrl = data.url.startsWith("http")
          ? data.url
          : `${API_BASE_URL}${data.url.startsWith("/") ? "" : "/"}${data.url}`;
        setImageUrl(fullUrl);
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeSelectedImage = () => {
    setImagePreview(null);
    setImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Post title is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch(`${API_BASE_URL}/communities/${communitySlug}/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim() || undefined,
          flair,
          imageUrl: imageUrl.trim() || undefined,
          linkUrl: linkUrl.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || "Failed to create post. Ensure you have joined the community.");
      }

      const postData = await res.json();
      onSuccess(postData.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs font-poppins animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-[28px] p-6 sm:p-8 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
          <div>
            <span className="bg-gray-100 text-gray-900 font-bold text-xs px-2.5 py-1 rounded-lg inline-block mb-1">
              r/{communityName}
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-950 tracking-tight">
              Create Community Post
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Flair selection */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Select Post Flair
            </label>
            <div className="flex flex-wrap gap-2">
              {flairs.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFlair(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer border-0 ${
                    flair === f.id
                      ? "bg-dark-bg text-white font-bold shadow-xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={300}
              required
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Body Text (Optional)
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share your thoughts, story, or ideas..."
              rows={4}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:border-black focus:bg-white transition-all resize-y"
            />
          </div>

          {/* Image Upload Dropzone */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" /> Attach Image (Optional)
            </label>

            {imagePreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-gray-200 max-h-48 bg-gray-50 flex items-center justify-center">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading image...
                  </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 hover:border-black rounded-2xl p-6 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-gray-50 flex flex-col items-center justify-center gap-2"
              >
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900">Click to upload an image</p>
                  <p className="text-[11px] text-gray-400">PNG, JPG, WEBP up to 10MB</p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />
          </div>

          {/* External Link */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5" /> External Link URL (Optional)
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com/article"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-black focus:bg-white transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={submitting || uploadingImage || !title.trim()}
              icon={<Send className="w-4 h-4" />}
              iconPosition="right"
            >
              {submitting ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
