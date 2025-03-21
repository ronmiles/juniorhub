import { useState } from "react";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart as faHeartSolid } from "@fortawesome/free-solid-svg-icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";

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
  const [isAnimating, setIsAnimating] = useState<boolean>(false);

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

        // Trigger animation if liking
        if (!hasLiked && userHasLiked) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 300);
        }

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
      className="flex items-center gap-2 text-sm focus:outline-none transition-all duration-300"
    >
      <span
        className={`transition-all duration-300 ${
          isAnimating ? "scale-130" : "scale-100"
        }`}
        style={{
          display: "inline-block",
          transform: isAnimating ? "scale(1.3)" : "scale(1)",
        }}
      >
        <FontAwesomeIcon
          icon={hasLiked ? faHeartSolid : faHeartRegular}
          className={`text-xl ${hasLiked ? "text-red-600" : "text-gray-800"}`}
        />
      </span>
      <span className="text-gray-600">{likes}</span>
    </button>
  );
};

export default LikeButton;
