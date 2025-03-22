import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useAuth } from "../hooks/useAuth";
import { getFullImageUrl } from "../utils/imageUtils";
import LikeButton from "../components/LikeButton";
import CommentsSection from "../components/CommentsSection";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const ProjectDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, getAuthHeaders } = useAuth();
  const applicationFormRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);

  // Fetch project details
  useEffect(() => {
    const fetchProjectDetails = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get auth headers
        const headers = getAuthHeaders();

        // Fetch project
        const projectResponse = await axios.get(`${API_URL}/projects/${id}`, {
          withCredentials: true,
          headers,
        });

        if (projectResponse.data.success) {
          // Use the direct data object, not the nested project object
          const projectData = projectResponse.data.data;
          setProject(projectData);

          // Check if user has already applied
          if (user && user.role === "junior" && projectData.applications) {
            const hasUserApplied = projectData.applications.some(
              (app: any) =>
                app.developer?.id === user.id || app.developer?._id === user.id
            );
            setHasApplied(hasUserApplied);
          }

          // If user is the company owner, fetch applications
          if (
            user &&
            (user.role === "company" || user.role === "admin") &&
            ((projectData.company &&
              (user.id === projectData.company.id ||
                user.id === projectData.company._id)) ||
              user.role === "admin")
          ) {
            try {
              const applicationsResponse = await axios.get(
                `${API_URL}/projects/${id}/applications`,
                {
                  withCredentials: true,
                  headers,
                }
              );
              if (applicationsResponse.data.success) {
                setApplications(applicationsResponse.data.data.applications);
              }
            } catch (err) {
              console.error("Failed to fetch applications:", err);
            }
          }
        } else {
          setError(
            projectResponse.data.error || "Failed to fetch project details"
          );
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error || "Failed to fetch project details"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchProjectDetails();
    }
  }, [id, user]);

  // Application form validation schema
  const applicationValidationSchema = Yup.object({
    coverLetter: Yup.string()
      .required("Cover letter is required")
      .min(50, "Cover letter must be at least 50 characters"),
    submissionLink: Yup.string()
      .nullable()
      .transform((value) => (value === "" ? null : value))
      .test("is-url-or-empty", "Please enter a valid URL", (value) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch (err) {
          return false;
        }
      }),
  });

  // Initialize formik for application form
  const formik = useFormik({
    initialValues: {
      coverLetter: "",
      submissionLink: "",
    },
    validationSchema: applicationValidationSchema,
    onSubmit: async (values) => {
      if (!user) {
        navigate("/login");
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      // Create a new object to avoid modifying the original values
      const submissionData = {
        ...values,
        submissionLink: values.submissionLink.trim() || null,
      };

      try {
        const response = await axios.post(
          `${API_URL}/projects/${id}/apply`,
          submissionData,
          { withCredentials: true }
        );

        if (response.data.success) {
          setHasApplied(true);
          setShowApplyForm(false);
        } else {
          setSubmitError(response.data.error || "Failed to submit application");
        }
      } catch (err: any) {
        console.error("Application error:", err.response?.data);
        setSubmitError(
          err.response?.data?.error || "Failed to submit application"
        );
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6 bg-red-100 text-red-700 rounded-md">
        {error || "Project not found"}
      </div>
    );
  }

  const isProjectOwner =
    user &&
    user.role === "company" &&
    project.company &&
    (user.id === project.company.id || user.id === project.company._id);
  const isProjectOpen = project.status === "open";

  return (
    <div>
      {/* Breadcrumb navigation */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link to="/projects" className="hover:text-rose-500">
          Projects
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{project.title}</span>
      </div>

      {/* Project header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">{project.title}</h1>
          <div className="flex items-center mt-2">
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                project.status === "open"
                  ? "bg-green-100 text-green-800"
                  : project.status === "in-progress"
                  ? "bg-rose-100 text-rose-600"
                  : project.status === "completed"
                  ? "bg-gray-100 text-gray-800"
                  : "bg-rose-100 text-rose-600"
              }`}
            >
              {project.status.replace("-", " ").toUpperCase()}
            </span>
            <span className="ml-4 text-sm text-gray-500">
              Posted on {new Date(project.createdAt).toLocaleDateString()}
            </span>
            <div className="ml-4">
              <LikeButton
                projectId={project.id || project._id}
                initialLikes={project.likes || 0}
                initialUserHasLiked={project.hasLiked || false}
                onLikeSuccess={(newLikes, hasLiked) => {
                  setProject({
                    ...project,
                    likes: newLikes,
                    hasLiked: hasLiked,
                  });
                }}
              />
            </div>
          </div>
        </div>
        <div>
          {isProjectOwner && (
            <div className="flex gap-2">
              <Link
                to={`/projects/${project.id || project._id}/edit`}
                className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition"
              >
                Edit Project
              </Link>
              {isProjectOpen && (
                <Link
                  to={`/projects/${project.id || project._id}/applications`}
                  className="px-4 py-2 border border-rose-500 text-rose-500 rounded-md hover:bg-rose-50 transition"
                >
                  View Applications ({project.applications?.length || 0})
                </Link>
              )}
            </div>
          )}
          {user && user.role === "junior" && isProjectOpen && !hasApplied && (
            <button
              onClick={() => {
                setShowApplyForm(true);
                // Wait for the form to render, then scroll to it
                setTimeout(() => {
                  applicationFormRef.current?.scrollIntoView({
                    behavior: "smooth",
                  });
                }, 100);
              }}
              className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition"
            >
              Apply for Project
            </button>
          )}
          {user && user.role === "junior" && isProjectOpen && hasApplied && (
            <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-md">
              Application Submitted
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Project details */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Project Description</h2>
            <p className="text-gray-700 whitespace-pre-line">
              {project.description}
            </p>
          </div>

          {/* Project Images */}
          {project.images && project.images.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4">Project Images</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {project.images.map((imageUrl: string, index: number) => (
                  <div key={index} className="relative">
                    <div className="aspect-video overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={getFullImageUrl(imageUrl)}
                        alt={`Project image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.requirements && project.requirements.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4">Requirements</h2>
              <ul className="list-disc pl-5 space-y-2">
                {project.requirements.map(
                  (requirement: string, index: number) => (
                    <li key={index} className="text-gray-700">
                      {requirement}
                    </li>
                  )
                )}
              </ul>
            </div>
          )}

          {/* Application form */}
          {showApplyForm && (
            <div
              ref={applicationFormRef}
              className="bg-white p-6 rounded-lg shadow-md mb-8"
            >
              <h2 className="text-xl font-semibold mb-4">
                Apply for this Project
              </h2>

              {submitError && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {submitError}
                </div>
              )}

              <form onSubmit={formik.handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="coverLetter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Cover Letter
                  </label>
                  <textarea
                    id="coverLetter"
                    name="coverLetter"
                    rows={6}
                    placeholder="Explain why you're interested in this project and why you're a good fit..."
                    className={`w-full px-3 py-2 border ${
                      formik.touched.coverLetter && formik.errors.coverLetter
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.coverLetter}
                  ></textarea>
                  {formik.touched.coverLetter && formik.errors.coverLetter && (
                    <div className="mt-1 text-sm text-red-500">
                      {formik.errors.coverLetter}
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label
                    htmlFor="submissionLink"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Submission Link (Optional)
                  </label>
                  <input
                    id="submissionLink"
                    name="submissionLink"
                    type="text"
                    placeholder="e.g. GitHub repository or portfolio link"
                    className={`w-full px-3 py-2 border ${
                      formik.touched.submissionLink &&
                      formik.errors.submissionLink
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500`}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.submissionLink}
                  />
                  {formik.touched.submissionLink &&
                    formik.errors.submissionLink && (
                      <div className="mt-1 text-sm text-red-500">
                        {formik.errors.submissionLink}
                      </div>
                    )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition ${
                      isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Applications list for project owner */}
          {isProjectOwner && applications.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-semibold mb-4">
                Applications ({applications.length})
              </h2>
              <div className="divide-y divide-gray-200">
                {applications.map((application) => (
                  <div key={application.id} className="py-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          {application.applicant.profilePicture ? (
                            <img
                              src={application.applicant.profilePicture}
                              alt={application.applicant.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <span className="text-gray-500">
                              {application.applicant.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {application.applicant.name}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Applied on{" "}
                            {new Date(
                              application.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          application.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : application.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {application.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-3">
                      <Link
                        to={`/applications/${application._id}`}
                        className="text-rose-500 hover:text-rose-700 text-sm font-medium"
                      >
                        View Application →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <CommentsSection projectId={project._id || project.id} />
          </div>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-1">
          {/* Company info */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4">About the Company</h2>
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                {project.company && project.company.profilePicture ? (
                  <img
                    src={getFullImageUrl(project.company.profilePicture)}
                    alt={project.company.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <span className="text-gray-500 text-lg">
                    {project.company ? project.company.name.charAt(0) : "?"}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-medium">
                  {project.company ? project.company.name : "Unknown Company"}
                </h3>
                <p className="text-sm text-gray-500">
                  {project.company ? "Member since " : ""}
                  {project.company && project.company.createdAt
                    ? new Date(project.company.createdAt).toLocaleDateString()
                    : project.company
                    ? "N/A"
                    : ""}
                </p>
              </div>
            </div>
            {project.company && project.company.bio && (
              <p className="text-gray-700 text-sm">{project.company.bio}</p>
            )}
          </div>

          {/* Project details sidebar */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold mb-4">Project Details</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Timeline</h3>
                <p className="mt-1">
                  {new Date(project.timeframe.startDate).toLocaleDateString()} -{" "}
                  {new Date(project.timeframe.endDate).toLocaleDateString()}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Skills Required
                </h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {project.skillsRequired &&
                    project.skillsRequired.map(
                      (skill: string, index: number) => (
                        <span
                          key={index}
                          className="bg-rose-50 text-rose-700 px-2 py-1 text-xs rounded-md"
                        >
                          {skill}
                        </span>
                      )
                    )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Tags</h3>
                <div className="mt-1 flex flex-wrap gap-2">
                  {project.tags &&
                    project.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">
                  Applications
                </h3>
                <p className="mt-1">
                  {project.applications?.length || 0} applicants
                </p>
              </div>
            </div>
          </div>

          {/* Similar projects */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Similar Projects</h2>
            <div className="text-center py-6 text-gray-500">
              <p>Similar projects will appear here.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
