import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Comment } from "@juniorhub/types";
import { useAuth } from "./useAuth";
import { io, Socket } from "socket.io-client";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface CommentsHookResult {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  createComment: (content: string) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
}

export const useComments = (projectId: string): CommentsHookResult => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, getAuthHeaders } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || "http://node58.cs.colman.ac.il";
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Clean up socket connection on unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join project room for real-time updates
  useEffect(() => {
    if (socket && projectId) {
      socket.emit("joinRoom", `project-${projectId}`);

      // Listen for new comments
      socket.on("newComment", (newComment: Comment) => {
        setComments((prevComments) => [newComment, ...prevComments]);
      });

      // Listen for updated comments
      socket.on("updateComment", (updatedComment: Comment) => {
        setComments((prevComments) =>
          prevComments.map((comment) =>
            comment.id === updatedComment.id ? updatedComment : comment
          )
        );
      });

      // Listen for deleted comments
      socket.on("deleteComment", (commentId: string) => {
        setComments((prevComments) =>
          prevComments.filter((comment) => comment.id !== commentId)
        );
      });

      // Clean up listeners on unmount
      return () => {
        socket.emit("leaveRoom", `project-${projectId}`);
        socket.off("newComment");
        socket.off("updateComment");
        socket.off("deleteComment");
      };
    }
  }, [socket, projectId]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `${API_URL}/projects/${projectId}/comments`
      );

      if (response.data.success) {
        setComments(response.data.data.comments);
      } else {
        setError("Failed to fetch comments");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error fetching comments");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Fetch comments on mount
  useEffect(() => {
    if (projectId) {
      fetchComments();
    }
  }, [projectId, fetchComments]);

  // Create a new comment
  const createComment = async (content: string): Promise<void> => {
    if (!user) {
      setError("You must be logged in to comment");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/projects/${projectId}/comments`,
        { content },
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.data.success) {
        // Socket will handle adding the comment to the list
        // If socket is not connected, add it manually
        if (!socket?.connected) {
          setComments((prevComments) => [
            response.data.data.comment,
            ...prevComments,
          ]);
        }
      } else {
        setError(response.data.error || "Failed to create comment");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error creating comment");
    }
  };

  // Update a comment
  const updateComment = async (
    commentId: string,
    content: string
  ): Promise<void> => {
    if (!user) {
      setError("You must be logged in to update a comment");
      return;
    }

    try {
      const response = await axios.put(
        `${API_URL}/comments/${commentId}`,
        { content },
        {
          headers: getAuthHeaders(),
        }
      );

      if (response.data.success) {
        // Socket will handle updating the comment
        // If socket is not connected, update it manually
        if (!socket?.connected) {
          setComments((prevComments) =>
            prevComments.map((comment) =>
              comment.id === commentId ? response.data.data.comment : comment
            )
          );
        }
      } else {
        setError(response.data.error || "Failed to update comment");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error updating comment");
    }
  };

  // Delete a comment
  const deleteComment = async (commentId: string): Promise<void> => {
    if (!user) {
      setError("You must be logged in to delete a comment");
      return;
    }

    try {
      const response = await axios.delete(`${API_URL}/comments/${commentId}`, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        // Socket will handle removing the comment
        // If socket is not connected, remove it manually
        if (!socket?.connected) {
          setComments((prevComments) =>
            prevComments.filter((comment) => comment.id !== commentId)
          );
        }
      } else {
        setError(response.data.error || "Failed to delete comment");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Error deleting comment");
    }
  };

  return {
    comments,
    isLoading,
    error,
    createComment,
    updateComment,
    deleteComment,
  };
};
