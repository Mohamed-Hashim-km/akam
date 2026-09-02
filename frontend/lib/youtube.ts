export function extractYouTubeId(url: string): string {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : url.trim();
}

export function getYouTubeThumbnail(urlOrId: string): string {
  if (!urlOrId) return '/editors_note_bg.png';
  const id = extractYouTubeId(urlOrId);
  if (!id) return '/editors_note_bg.png';
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(urlOrId: string): string {
  if (!urlOrId) return '';
  const id = extractYouTubeId(urlOrId);
  return `https://www.youtube.com/embed/${id}`;
}
