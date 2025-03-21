import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useAiEnhancement } from "../hooks/useAiEnhancement";
import { useFormik, FieldArray, FormikProvider } from "formik";
import * as Yup from "yup";
import axios from "axios";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const CreateProject = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { enhanceProject, isEnhancing, error: aiError } = useAiEnhancement();

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
        const response = await axios.post(`${API_URL}/projects`, values);

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
        formik.setFieldValue("description", enhancedData.enhancedDescription);

        // Update tags
        if (enhancedData.tags && enhancedData.tags.length > 0) {
          // Replace tags with the new ones from AI
          formik.setFieldValue("tags", enhancedData.tags);
        }

        // Update skills
        if (
          enhancedData.requiredSkills &&
          enhancedData.requiredSkills.length > 0
        ) {
          // Replace skills with the new ones from AI
          formik.setFieldValue("skillsRequired", enhancedData.requiredSkills);
        }

        // Update requirements
        if (enhancedData.requirements && enhancedData.requirements.length > 0) {
          // Replace requirements with the new ones from AI
          formik.setFieldValue("requirements", enhancedData.requirements);
        }

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
                Project Description *
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
                className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition flex items-center"
              >
                {isEnhancing ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Enhance with AI
                  </>
                )}
              </button>
            </div>

            {/* Requirements field array */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Requirements *
              </label>
              <FieldArray
                name="requirements"
                render={(arrayHelpers) => (
                  <div className="space-y-2">
                    {formik.values.requirements.map((_, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          name={`requirements.${index}`}
                          type="text"
                          placeholder="e.g. Must be responsive for all devices"
                          className={`flex-grow px-3 py-2 border ${
                            formik.touched.requirements &&
                            (formik.touched.requirements as any)[index] &&
                            Array.isArray(formik.errors.requirements) &&
                            formik.errors.requirements[index]
                              ? "border-red-500"
                              : "border-gray-300"
                          } rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          value={formik.values.requirements[index]}
                        />
                        <button
                          type="button"
                          onClick={() => arrayHelpers.remove(index)}
                          className="p-2 text-red-500 hover:text-red-700"
                          disabled={formik.values.requirements.length <= 1}
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
                      + Add Requirement
                    </button>
                  </div>
                )}
              />
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

            {/* Skills field array */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Skills Required *
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
                Tags (Optional)
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
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate("/projects")}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
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
