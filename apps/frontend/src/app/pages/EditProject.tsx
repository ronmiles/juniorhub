import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAiEnhancement } from "../hooks/useAiEnhancement";
import { useFormik, FieldArray, FormikProvider } from "formik";
import * as Yup from "yup";
import axios from "axios";
import ImageUpload from "../components/ImageUpload";
import { getFullImageUrl } from "../utils/imageUtils";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// AI Sparkle Icon Component
const AISparkleIcon = () => (
  <svg
    className="w-4 h-4 inline-block ml-1 text-purple-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
    />
  </svg>
);

const EditProject = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { enhanceProject, isEnhancing, error: aiError } = useAiEnhancement();

  // State for image management
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  // Track which fields have been enhanced by AI
  const [enhancedFields, setEnhancedFields] = useState<{
    description: boolean;
    requirements: boolean;
    skillsRequired: boolean;
    tags: boolean;
  }>({
    description: false,
    requirements: false,
    skillsRequired: false,
    tags: false,
  });

  // Validation schema for project edit
  const validationSchema = Yup.object({
    title: Yup.string()
      .required("Title is required")
      .min(5, "Title must be at least 5 characters")
      .max(100, "Title must be at most 100 characters"),
    description: Yup.string()
      .required("Description is required")
      .min(50, "Description must be at least 50 characters"),
    requirements: Yup.array()
      .of(Yup.string().required("Requirement cannot be empty"))
      .min(1, "At least one requirement is required"),
    timeframe: Yup.object({
      startDate: Yup.date().required("Start date is required"),
      endDate: Yup.date()
        .required("End date is required")
        .min(Yup.ref("startDate"), "End date must be after start date"),
    }),
    skillsRequired: Yup.array()
      .of(Yup.string().required("Skill cannot be empty"))
      .min(1, "At least one skill is required"),
    tags: Yup.array().of(Yup.string()),
    status: Yup.string()
      .required("Status is required")
      .oneOf(["open", "in_progress", "completed"], "Invalid status"),
  });

  // Initialize formik
  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      requirements: [""],
      timeframe: {
        startDate: "",
        endDate: "",
      },
      skillsRequired: [""],
      tags: [""],
      status: "open",
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!user || user.role !== "company") {
        navigate("/login");
        return;
      }

      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      try {
        // Create a FormData object to handle file uploads
        const formData = new FormData();

        // Add all form values to the FormData
        formData.append("title", values.title);
        formData.append("description", values.description);

        // Add arrays with indexed keys
        values.requirements.forEach((req, index) => {
          formData.append(`requirements[${index}]`, req);
        });

        // Add timeframe as separate fields
        formData.append("timeframe[startDate]", values.timeframe.startDate);
        formData.append("timeframe[endDate]", values.timeframe.endDate);

        // Add skills and tags
        values.skillsRequired.forEach((skill, index) => {
          formData.append(`skillsRequired[${index}]`, skill);
        });

        values.tags.forEach((tag, index) => {
          formData.append(`tags[${index}]`, tag);
        });

        // Add status
        formData.append("status", values.status);

        // Add images to keep (those not in imagesToRemove)
        const imagesToKeep = existingImages.filter(
          (img) => !imagesToRemove.includes(img)
        );

        // Add existing images to keep
        imagesToKeep.forEach((image, index) => {
          formData.append(`existingImages[${index}]`, image);
        });

        // Add new images
        selectedImages.forEach((image) => {
          formData.append("projectImages", image);
        });

        // Add images to remove
        imagesToRemove.forEach((image, index) => {
          formData.append(`imagesToRemove[${index}]`, image);
        });

        const response = await axios.put(
          `${API_URL}/projects/${id}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          setSuccess("Project updated successfully");
          setTimeout(() => {
            navigate(`/projects/${id}`);
          }, 2000);
        } else {
          setError(response.data.error || "Failed to update project");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to update project");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Load existing project data
  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/projects/${id}`);

        if (response.data.success) {
          const project = response.data.data.project;

          // Format dates to YYYY-MM-DD for input type="date"
          const formatDate = (dateString: string) => {
            const date = new Date(dateString);
            return date.toISOString().split("T")[0];
          };

          // Set form values from project data
          formik.setValues({
            title: project.title || "",
            description: project.description || "",
            requirements:
              project.requirements?.length > 0 ? project.requirements : [""],
            timeframe: {
              startDate: project.timeframe?.startDate
                ? formatDate(project.timeframe.startDate)
                : "",
              endDate: project.timeframe?.endDate
                ? formatDate(project.timeframe.endDate)
                : "",
            },
            skillsRequired:
              project.skillsRequired?.length > 0
                ? project.skillsRequired
                : [""],
            tags: project.tags?.length > 0 ? project.tags : [""],
            status: project.status || "open",
          });

          // Set existing images if available
          if (
            project.images &&
            Array.isArray(project.images) &&
            project.images.length > 0
          ) {
            setExistingImages(project.images);
          }
        } else {
          setError("Failed to load project data");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to load project data");
        console.error("Error loading project:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  // Handle AI enhancement
  const handleEnhanceWithAI = async () => {
    const { title, description } = formik.values;

    // Check if title and description are filled out
    if (!title.trim() || !description.trim()) {
      const errorMsg = "Title and description are required for AI enhancement";
      setError(errorMsg);
      return;
    }

    try {
      // Call the AI enhancement API
      const enhancedData = await enhanceProject(title, description);

      // Update form values if we got valid data back
      if (enhancedData) {
        // Track which fields are being enhanced
        const fieldsEnhanced = { ...enhancedFields };

        // Update description
        formik.setFieldValue("description", enhancedData.enhancedDescription);
        fieldsEnhanced.description = true;

        // Update tags
        if (enhancedData.tags && enhancedData.tags.length > 0) {
          // Replace tags with the new ones from AI
          formik.setFieldValue("tags", enhancedData.tags);
          fieldsEnhanced.tags = true;
        }

        // Update skills
        if (
          enhancedData.requiredSkills &&
          enhancedData.requiredSkills.length > 0
        ) {
          // Replace skills with the new ones from AI
          formik.setFieldValue("skillsRequired", enhancedData.requiredSkills);
          fieldsEnhanced.skillsRequired = true;
        }

        // Update requirements
        if (enhancedData.requirements && enhancedData.requirements.length > 0) {
          // Replace requirements with the new ones from AI
          formik.setFieldValue("requirements", enhancedData.requirements);
          fieldsEnhanced.requirements = true;
        }

        // Update enhanced fields state
        setEnhancedFields(fieldsEnhanced);

        // Display success message
        setError(null);
      } else if (aiError) {
        // If there was an error in the AI enhancement, display it
        setError(aiError);
      }
    } catch (error) {
      console.error("Error in handleEnhanceWithAI:", error);
      setError("An unexpected error occurred");
    }
  };

  // Handle image selection for new uploads
  const handleImagesSelected = (files: File[]) => {
    setImageUploadError(null);

    // Create previews for the newly selected images
    const newPreviews = files.map((file) => URL.createObjectURL(file));

    // Update state with new files and previews
    setSelectedImages((prevImages) => [...prevImages, ...files]);
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
  };

  // Handle removing a new image
  const handleNewImageRemove = (index: number) => {
    // Remove the image and its preview at the given index
    setSelectedImages((prevImages) => {
      const updatedImages = [...prevImages];
      updatedImages.splice(index, 1);
      return updatedImages;
    });

    setImagePreviews((prevPreviews) => {
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(prevPreviews[index]);

      const updatedPreviews = [...prevPreviews];
      updatedPreviews.splice(index, 1);
      return updatedPreviews;
    });
  };

  // Handle removing an existing image
  const handleExistingImageRemove = (imageUrl: string) => {
    setImagesToRemove((prev) => [...prev, imageUrl]);
  };

  // Filter out existing images that are marked for removal
  const displayedExistingImages = existingImages.filter(
    (img) => !imagesToRemove.includes(img)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Edit Project</h1>

      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 mb-6 bg-green-100 text-green-700 rounded-md">
          {success}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <FormikProvider value={formik}>
          <form onSubmit={formik.handleSubmit}>
            {/* Title field */}
            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                className={`w-full px-3 py-2 border ${
                  formik.touched.title && formik.errors.title
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.title}
              />
              {formik.touched.title && formik.errors.title && (
                <div className="mt-1 text-sm text-red-500">
                  {formik.errors.title}
                </div>
              )}
            </div>

            {/* Description field */}
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project Description *{" "}
                {enhancedFields.description && <AISparkleIcon />}
              </label>
              <textarea
                id="description"
                name="description"
                rows={6}
                className={`w-full px-3 py-2 border ${
                  formik.touched.description && formik.errors.description
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.description}
              ></textarea>
              {formik.touched.description && formik.errors.description && (
                <div className="mt-1 text-sm text-red-500">
                  {formik.errors.description}
                </div>
              )}

              {/* AI Enhancement Button */}
              <button
                type="button"
                onClick={handleEnhanceWithAI}
                disabled={isEnhancing}
                className="mt-2 px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 focus:outline-none flex items-center"
              >
                {isEnhancing ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Enhancing...
                  </span>
                ) : (
                  <>
                    <AISparkleIcon /> Enhance with AI
                  </>
                )}
              </button>
            </div>

            {/* Existing Project Images */}
            {displayedExistingImages.length > 0 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Project Images
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {displayedExistingImages.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-video overflow-hidden rounded-md border border-gray-200">
                        <img
                          src={getFullImageUrl(imageUrl)}
                          alt={`Project image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleExistingImageRemove(imageUrl)}
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

            {/* Upload New Images */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Add New Images
              </label>
              <ImageUpload
                images={selectedImages}
                previews={imagePreviews}
                onImagesSelected={handleImagesSelected}
                onImageRemove={handleNewImageRemove}
                error={imageUploadError}
              />
            </div>

            {/* Requirements field array */}
            <div className="mb-4">
              <label
                htmlFor="requirements"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project Requirements *{" "}
                {enhancedFields.requirements && <AISparkleIcon />}
              </label>
              <FieldArray name="requirements">
                {({ remove, push }) => (
                  <div>
                    {formik.values.requirements.map((requirement, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <input
                          id={`requirements.${index}`}
                          name={`requirements.${index}`}
                          type="text"
                          className={`w-full px-3 py-2 border ${
                            Array.isArray(formik.touched.requirements) &&
                            formik.touched.requirements[index] &&
                            Array.isArray(formik.errors.requirements) &&
                            formik.errors.requirements[index]
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          value={requirement}
                        />
                        {formik.values.requirements.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="ml-2 p-2 text-red-500 hover:text-red-700"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => push("")}
                      className="mt-2 text-sm text-blue-500 hover:text-blue-700 flex items-center"
                    >
                      <svg
                        className="h-4 w-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Add Requirement
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

            {/* Timeframe fields */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="timeframe.startDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Start Date *
                </label>
                <input
                  id="timeframe.startDate"
                  name="timeframe.startDate"
                  type="date"
                  className={`w-full px-3 py-2 border ${
                    formik.touched.timeframe?.startDate &&
                    formik.errors.timeframe?.startDate
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.timeframe.startDate}
                />
                {formik.touched.timeframe?.startDate &&
                  formik.errors.timeframe?.startDate && (
                    <div className="mt-1 text-sm text-red-500">
                      {formik.errors.timeframe.startDate}
                    </div>
                  )}
              </div>

              <div>
                <label
                  htmlFor="timeframe.endDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  End Date *
                </label>
                <input
                  id="timeframe.endDate"
                  name="timeframe.endDate"
                  type="date"
                  className={`w-full px-3 py-2 border ${
                    formik.touched.timeframe?.endDate &&
                    formik.errors.timeframe?.endDate
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  value={formik.values.timeframe.endDate}
                />
                {formik.touched.timeframe?.endDate &&
                  formik.errors.timeframe?.endDate && (
                    <div className="mt-1 text-sm text-red-500">
                      {formik.errors.timeframe.endDate}
                    </div>
                  )}
              </div>
            </div>

            {/* Status field */}
            <div className="mb-4">
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Project Status *
              </label>
              <select
                id="status"
                name="status"
                className={`w-full px-3 py-2 border ${
                  formik.touched.status && formik.errors.status
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                value={formik.values.status}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              {formik.touched.status && formik.errors.status && (
                <div className="mt-1 text-sm text-red-500">
                  {formik.errors.status}
                </div>
              )}
            </div>

            {/* Skills field array */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills Required *{" "}
                {enhancedFields.skillsRequired && <AISparkleIcon />}
              </label>
              <FieldArray
                name="skillsRequired"
                render={(arrayHelpers) => (
                  <div className="space-y-2">
                    {formik.values.skillsRequired.map((_, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          name={`skillsRequired.${index}`}
                          type="text"
                          placeholder="e.g. React, JavaScript, TypeScript"
                          className={`flex-grow px-3 py-2 border ${
                            formik.touched.skillsRequired &&
                            (formik.touched.skillsRequired as any)[index] &&
                            Array.isArray(formik.errors.skillsRequired) &&
                            formik.errors.skillsRequired[index]
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          value={formik.values.skillsRequired[index]}
                        />
                        <button
                          type="button"
                          onClick={() => arrayHelpers.remove(index)}
                          className="p-2 text-red-500 hover:text-red-700"
                          disabled={formik.values.skillsRequired.length <= 1}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => arrayHelpers.push("")}
                      className="mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                    >
                      + Add Skill
                    </button>
                  </div>
                )}
              />
            </div>

            {/* Tags field array */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (Optional) {enhancedFields.tags && <AISparkleIcon />}
              </label>
              <FieldArray
                name="tags"
                render={(arrayHelpers) => (
                  <div className="space-y-2">
                    {formik.values.tags.map((_, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          name={`tags.${index}`}
                          type="text"
                          placeholder="e.g. frontend, beginner-friendly, urgent"
                          className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          value={formik.values.tags[index]}
                        />
                        <button
                          type="button"
                          onClick={() => arrayHelpers.remove(index)}
                          className="p-2 text-red-500 hover:text-red-700"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => arrayHelpers.push("")}
                      className="mt-2 px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm"
                    >
                      + Add Tag
                    </button>
                  </div>
                )}
              />
            </div>

            {/* Submit buttons */}
            <div className="flex justify-end mt-6 gap-2">
              <button
                type="button"
                onClick={() => navigate(`/projects/${id}`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </FormikProvider>
      </div>
    </div>
  );
};

export default EditProject;
