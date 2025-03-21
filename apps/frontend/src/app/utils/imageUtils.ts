// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Converts relative image paths to full URLs
 * @param path The image path to convert
 * @returns The full URL for the image
 */
export const getFullImageUrl = (path: string): string => {
  if (!path) return "";
  // If it's already a full URL, return it as is
  if (path.startsWith("http")) return path;
  // Otherwise, prepend the base URL (without the /api part)
  return `${API_URL.replace("/api", "")}${path}`;
};
