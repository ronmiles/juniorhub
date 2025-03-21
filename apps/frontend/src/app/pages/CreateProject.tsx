import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAiEnhancement } from "../hooks/useAiEnhancement";
import { useFormik, FieldArray, FormikProvider } from "formik";
import * as Yup from "yup";
import axios from "axios";
import ImageUpload from "../components/ImageUpload";

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

const CreateProject = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enhanceProject, isEnhancing, error: aiError } = useAiEnhancement();
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

  // Validation schema for project creation
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
      startDate: Yup.date()
        .required("Start date is required")
        .min(new Date(), "Start date must be in the future"),
      endDate: Yup.date()
        .required("End date is required")
        .min(Yup.ref("startDate"), "End date must be after start date"),
    }),
    skillsRequired: Yup.array()
      .of(Yup.string().required("Skill cannot be empty"))
      .min(1, "At least one skill is required"),
    tags: Yup.array().of(Yup.string()),
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
    },
    validationSchema,
    onSubmit: async (values) => {
      if (!user || user.role !== "company") {
        navigate("/login");
        return;
      }

      setIsSubmitting(true);
      setError(null);

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

        // Add images
        selectedImages.forEach((image) => {
          formData.append("projectImages", image);
        });

        // Send request with FormData
        const response = await axios.post(`${API_URL}/projects`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success) {
          // Navigate to the newly created project
          navigate(`/projects/${response.data.data.project._id}`);
        } else {
          setError(response.data.error || "Failed to create project");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to create project");
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  // Handle AI enhancement
  const handleEnhanceWithAI = async () => {
    const { title, description } = formik.values;

    console.log("Enhance with AI button clicked");
    console.log("User:", user);
    console.log("Title:", title);
    console.log("Description:", description);

    // Check if title and description are filled out
    if (!title.trim() || !description.trim()) {
      const errorMsg = "Title and description are required for AI enhancement";
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    try {
      // Call the AI enhancement API
      console.log("Calling enhanceProject...");
      const enhancedData = await enhanceProject(title, description);
      console.log("Received enhancedData:", enhancedData);

      // Update form values if we got valid data back
      if (enhancedData) {
        console.log("Updating form with enhanced data");

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
        console.error("AI enhancement error:", aiError);
        setError(aiError);
      }
    } catch (error) {
      console.error("Error in handleEnhanceWithAI:", error);
      setError("An unexpected error occurred");
    }
  };

  // Handle image selection
  const handleImagesSelected = (files: File[]) => {
    setImageUploadError(null);

    // Create previews for the newly selected images
    const newPreviews = files.map((file) => URL.createObjectURL(file));

    // Update state with new files and previews
    setSelectedImages((prevImages) => [...prevImages, ...files]);
    setImagePreviews((prevPreviews) => [...prevPreviews, ...newPreviews]);
  };

  // Handle image removal
  const handleImageRemove = (index: number) => {
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

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New Project</h1>

      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md">
          {error}
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
                placeholder="e.g. Build a Landing Page with React"
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
                placeholder="Describe your project in detail..."
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

            {/* Image Upload Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Images
              </label>
              <ImageUpload
                images={selectedImages}
                previews={imagePreviews}
                onImagesSelected={handleImagesSelected}
                onImageRemove={handleImageRemove}
                error={imageUploadError}
              />
            </div>

            {/* Requirements field array */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Requirements *{" "}
                {enhancedFields.requirements && <AISparkleIcon />}
              </label>
              <FieldArray name="requirements">
                {({ remove, push }) => (
                  <div>
                    {formik.values.requirements.map((req, index) => (
                      <div key={index} className="flex mb-2">
                        <input
                          name={`requirements.${index}`}
                          placeholder="E.g., Create a responsive layout"
                          className={`w-full px-3 py-2 border ${
                            Array.isArray(formik.touched.requirements) &&
                            formik.touched.requirements[index] &&
                            Array.isArray(formik.errors.requirements) &&
                            formik.errors.requirements[index]
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          value={req}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
                        {index > 0 && (
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

                    {formik.touched.requirements &&
                      formik.errors.requirements &&
                      typeof formik.errors.requirements === "string" && (
                        <div className="mt-1 text-sm text-red-500">
                          {formik.errors.requirements}
                        </div>
                      )}

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

            {/* Timeframe */}
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

            {/* Skills field array */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Required Skills *{" "}
                {enhancedFields.skillsRequired && <AISparkleIcon />}
              </label>
              <FieldArray name="skillsRequired">
                {({ remove, push }) => (
                  <div>
                    {formik.values.skillsRequired.map((skill, index) => (
                      <div key={index} className="flex mb-2">
                        <input
                          name={`skillsRequired.${index}`}
                          placeholder="E.g., React, JavaScript, CSS"
                          className={`w-full px-3 py-2 border ${
                            Array.isArray(formik.touched.skillsRequired) &&
                            formik.touched.skillsRequired[index] &&
                            Array.isArray(formik.errors.skillsRequired) &&
                            formik.errors.skillsRequired[index]
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          value={skill}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
                        {index > 0 && (
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

                    {formik.touched.skillsRequired &&
                      formik.errors.skillsRequired &&
                      typeof formik.errors.skillsRequired === "string" && (
                        <div className="mt-1 text-sm text-red-500">
                          {formik.errors.skillsRequired}
                        </div>
                      )}

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
                      Add Skill
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

            {/* Tags field array */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (Optional) {enhancedFields.tags && <AISparkleIcon />}
              </label>
              <FieldArray name="tags">
                {({ remove, push }) => (
                  <div>
                    {formik.values.tags.map((tag, index) => (
                      <div key={index} className="flex mb-2">
                        <input
                          name={`tags.${index}`}
                          placeholder="E.g., Frontend, Design, E-commerce"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={tag}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
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
                      Add Tag
                    </button>
                  </div>
                )}
              </FieldArray>
            </div>

            {/* Submit button */}
            <div className="mt-8">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    Creating...
                  </span>
                ) : (
                  "Create Project"
                )}
              </button>
            </div>
          </form>
        </FormikProvider>
      </div>
    </div>
  );
};

export default CreateProject;
