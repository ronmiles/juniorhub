import React, { useState, useRef, useCallback } from "react";

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  onImageRemove: (index: number) => void;
  images: File[];
  previews: string[];
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  error?: string | null;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImagesSelected,
  onImageRemove,
  images,
  previews,
  maxFiles = 10,
  maxSizeMB = 5,
  acceptedFileTypes = ["image/jpeg", "image/png", "image/webp"],
  error,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Convert MB to bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Process files
  const processFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      // Convert FileList to array
      const fileArray = Array.from(files);

      // Filter for valid files
      const validFiles = fileArray.filter((file) => {
        // Check file type
        if (!acceptedFileTypes.includes(file.type)) {
          return false;
        }

        // Check file size
        if (file.size > maxSizeBytes) {
          return false;
        }

        return true;
      });

      // Check if adding these files would exceed max files
      if (images.length + validFiles.length > maxFiles) {
        alert(`You can only upload a maximum of ${maxFiles} images.`);
        return;
      }

      // Send valid files to the parent component
      if (validFiles.length > 0) {
        onImagesSelected(validFiles);
      }
    },
    [images.length, maxFiles, maxSizeBytes, acceptedFileTypes, onImagesSelected]
  );

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const { files } = e.dataTransfer;
      processFiles(files);
    },
    [processFiles]
  );

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(e.target.files);
      // Reset the input value so the same file can be selected again if removed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [processFiles]
  );

  // Trigger file input click
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full mb-6">
      <div
        className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-blue-400"
        }`}
        onClick={triggerFileInput}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes.join(",")}
          onChange={handleFileChange}
          className="hidden"
          multiple
        />
        <div className="py-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M36 12h-6v6h6v-6zm-12 24h-6v6h6v-6zm12 0h-6v6h6v-6zM12 12h6v6h-6v-6zm0 12h6v6h-6v-6zm0 12h6v6h-6v-6zm12-24h6v6h-6v-6zm0 12h6v6h-6v-6z"
            />
          </svg>
          <p className="mt-1 text-sm text-gray-600">
            Drag and drop images here, or click to select
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Supported formats: JPEG, PNG, WebP. Max size: {maxSizeMB}MB.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {images.length} of {maxFiles} images selected
          </p>
        </div>
      </div>

      {error && <div className="mt-2 text-sm text-red-500">{error}</div>}

      {/* Preview gallery */}
      {previews.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative group">
                <div className="aspect-video overflow-hidden rounded-md border border-gray-200">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent triggering the parent onClick
                    onImageRemove(index);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove image"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
