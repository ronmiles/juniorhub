import { useState } from "react";
import { useComments } from "../hooks/useComments";
import { useAuth } from "../hooks/useAuth";
import CommentItem from "./CommentItem";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaperPlane } from "@fortawesome/free-solid-svg-icons";

interface CommentsSectionProps {
  projectId: string;
}

const CommentsSection = ({ projectId }: CommentsSectionProps) => {
  const {
    comments,
    isLoading,
    error,
    createComment,
    updateComment,
    deleteComment,
  } = useComments(projectId);
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle comment submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("Please log in to comment");
      return;
    }

    if (newComment.trim() === "") return;

    setIsSubmitting(true);
    try {
      await createComment(newComment);
      setNewComment(""); // Clear the input after successful submission
    } catch (error) {
      console.error("Error submitting comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Comments</h2>

      {/* Comment form */}
      <div className="mb-6">
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={3}
              disabled={isSubmitting}
              autoFocus
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition flex items-center"
                disabled={isSubmitting || newComment.trim() === ""}
              >
                <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                Post Comment
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-gray-50 p-4 rounded-md text-center">
            <p className="text-gray-600">Please log in to leave a comment.</p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center border-t border-gray-200">
          <p className="text-gray-500">
            No comments yet. Be the first to comment!
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onUpdate={updateComment}
              onDelete={deleteComment}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;
