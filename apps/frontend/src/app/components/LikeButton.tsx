import { useState } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface LikeButtonProps {
  projectId: string;
  initialLikes: number;
  initialUserHasLiked?: boolean;
  onLikeSuccess?: (newLikes: number, hasLiked: boolean) => void;
}

const LikeButton = ({
  projectId,
  initialLikes,
  initialUserHasLiked = false,
  onLikeSuccess,
}: LikeButtonProps) => {
  const { user, getAuthHeaders } = useAuth();
  const [likes, setLikes] = useState<number>(initialLikes);
  const [hasLiked, setHasLiked] = useState<boolean>(initialUserHasLiked);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLike = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent navigation if used in cards with links
    e.stopPropagation();

    if (!user) {
      // Optional: Add a notification or redirect to login
      alert("Please log in to like projects");
      return;
    }

    try {
      setIsLoading(true);

      // Get the authentication headers
      const headers = getAuthHeaders();

      const response = await axios.post(
        `${API_URL}/projects/${projectId}/like`,
        {},
        {
          withCredentials: true,
          headers,
        }
      );

      if (response.data.success) {
        const { likes: newLikes, userHasLiked } = response.data.data;
        setLikes(newLikes);
        setHasLiked(userHasLiked);

        // Callback for parent component if provided
        if (onLikeSuccess) {
          onLikeSuccess(newLikes, userHasLiked);
        }
      }
    } catch (error) {
      console.error("Error liking project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading}
      className={`flex items-center gap-1 text-sm focus:outline-none transition-all duration-300 ${
        hasLiked
          ? "text-rose-500 hover:text-rose-600"
          : "text-gray-500 hover:text-rose-500"
      }`}
    >
      <i
        className={`${
          hasLiked ? "fas" : "far"
        } fa-heart transition-all duration-300 ${
          hasLiked ? "animate-like" : ""
        }`}
      ></i>
      <span>{likes}</span>
      <style jsx>{`
        @keyframes like {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.3);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-like {
          animation: like 0.3s ease-in-out;
        }
      `}</style>
    </button>
  );
};

export default LikeButton;
