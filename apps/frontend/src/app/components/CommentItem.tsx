import { useState } from "react";
import { Comment } from "@juniorhub/types";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "../hooks/useAuth";
import { getFullImageUrl } from "../utils/imageUtils";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faTimes,
  faCheck,
} from "@fortawesome/free-solid-svg-icons";

interface CommentItemProps {
  comment: Comment;
  onUpdate: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

const CommentItem = ({ comment, onUpdate, onDelete }: CommentItemProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if the current user is the author of the comment
  const isAuthor =
    user && (user.id === comment.author.id || user.id === comment.author);
  // Check if user is admin
  const isAdmin = user && user.role === "admin";

  // Format the date
  const formattedDate =
    comment.createdAt instanceof Date
      ? formatDistanceToNow(comment.createdAt, { addSuffix: true })
      : formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  // Handle edit mode toggle
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setEditedContent(comment.content);
  };

  // Handle comment update
  const handleUpdate = async () => {
    if (editedContent.trim() === "") return;

    setIsSubmitting(true);
    try {
      await onUpdate(comment.id, editedContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle comment deletion
  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      setIsSubmitting(true);
      try {
        await onDelete(comment.id);
      } catch (error) {
        console.error("Error deleting comment:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="flex space-x-4 py-4 border-b border-gray-200">
      {/* Author avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          {comment.author.profilePicture ? (
            <img
              src={getFullImageUrl(comment.author.profilePicture)}
              alt={`${comment.author.name}'s avatar`}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <span className="text-gray-500 text-sm">
              {comment.author.name
                ? comment.author.name.charAt(0).toUpperCase()
                : "?"}
            </span>
          )}
        </div>
      </div>

      {/* Comment content */}
      <div className="flex-grow">
        <div className="flex justify-between items-start">
          <div>
            <span className="font-medium text-gray-900">
              {comment.author.name}
            </span>
            <span className="ml-2 text-sm text-gray-500">{formattedDate}</span>
          </div>

          {/* Edit/Delete buttons */}
          {(isAuthor || isAdmin) && !isEditing && (
            <div className="flex space-x-2">
              <button
                onClick={handleEditToggle}
                className="text-gray-500 hover:text-gray-700"
                disabled={isSubmitting}
                aria-label="Edit comment"
              >
                <FontAwesomeIcon icon={faEdit} />
              </button>
              <button
                onClick={handleDelete}
                className="text-gray-500 hover:text-red-500"
                disabled={isSubmitting}
                aria-label="Delete comment"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2">
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              rows={3}
              disabled={isSubmitting}
            />
            <div className="mt-2 flex justify-end space-x-2">
              <button
                onClick={handleEditToggle}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                disabled={isSubmitting}
              >
                <FontAwesomeIcon icon={faTimes} className="mr-1" />
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                className="px-3 py-1 text-sm bg-rose-500 text-white rounded-md hover:bg-rose-600"
                disabled={isSubmitting || editedContent.trim() === ""}
              >
                <FontAwesomeIcon icon={faCheck} className="mr-1" />
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-1 text-gray-700 whitespace-pre-line">
            {comment.content}
          </p>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
