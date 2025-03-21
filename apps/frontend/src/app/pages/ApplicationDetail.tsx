import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const ApplicationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<{
    type: "success" | "error" | null;
    message: string | null;
  }>({ type: null, message: null });

  // Fetch application data
  useEffect(() => {
    const fetchApplicationData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${API_URL}/applications/${id}`);

        if (response.data.success) {
          const applicationData = response.data.data.application;
          setApplication(applicationData);

          // Fetch project details
          if (applicationData.project) {
            const projectId =
              applicationData.project.id || applicationData.project._id;
            try {
              const projectResponse = await axios.get(
                `${API_URL}/projects/${projectId}`
              );
              if (projectResponse.data.success) {
                setProject(projectResponse.data.data.project);
              }
            } catch (err) {
              console.error("Error fetching project details:", err);
            }
          }

          // Verify permission - only company owner or applicant can see details
          const isCompanyOwner =
            user?.role === "company" &&
            applicationData.project?.company &&
            (user.id === applicationData.project.company.id ||
              user.id === applicationData.project.company._id);

          const isApplicant =
            user?.role === "junior" &&
            (user.id === applicationData.applicant?.id ||
              user.id === applicationData.applicant?._id);

          if (!isCompanyOwner && !isApplicant && user?.role !== "admin") {
            setError("You do not have permission to view this application");
          }
        } else {
          setError(response.data.error || "Failed to fetch application");
        }
      } catch (err: any) {
        console.error("Error fetching application:", err);
        setError(err.response?.data?.error || "Failed to fetch application");
      } finally {
        setIsLoading(false);
      }
    };

    if (id && user) {
      fetchApplicationData();
    }
  }, [id, user]);

  // Handle application status update
  const handleUpdateStatus = async (status: "approved" | "rejected") => {
    try {
      const response = await axios.patch(`${API_URL}/applications/${id}`, {
        status,
      });

      if (response.data.success) {
        // Update the application status locally
        setApplication({ ...application, status });

        // Show success message
        setActionStatus({
          type: "success",
          message: `Application ${
            status === "approved" ? "approved" : "rejected"
          } successfully!`,
        });

        // Hide the message after 3 seconds
        setTimeout(() => {
          setActionStatus({ type: null, message: null });
        }, 3000);
      } else {
        setActionStatus({
          type: "error",
          message: response.data.error || `Failed to ${status} application`,
        });
      }
    } catch (err: any) {
      console.error(`Error ${status} application:`, err);
      setActionStatus({
        type: "error",
        message: err.response?.data?.error || `Failed to ${status} application`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="p-6 bg-red-100 text-red-700 rounded-md">
        {error || "Application not found"}
      </div>
    );
  }

  // Check if the current user is the company owner of the project
  const isCompanyOwner =
    user?.role === "company" &&
    application.project?.company &&
    (user.id === application.project.company.id ||
      user.id === application.project.company._id);

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Breadcrumb navigation */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link to="/projects" className="hover:text-rose-500">
          Projects
        </Link>
        <span className="mx-2">/</span>
        {project && (
          <>
            <Link
              to={`/projects/${project.id || project._id}`}
              className="hover:text-rose-500"
            >
              {project.title}
            </Link>
            <span className="mx-2">/</span>
            <Link
              to={`/projects/${project.id || project._id}/applications`}
              className="hover:text-rose-500"
            >
              Applications
            </Link>
            <span className="mx-2">/</span>
          </>
        )}
        <span className="text-gray-700">Application Details</span>
      </div>

      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Application Details</h1>
        {project && (
          <Link
            to={`/projects/${project.id || project._id}/applications`}
            className="px-4 py-2 border border-rose-500 text-rose-500 rounded-md hover:bg-rose-50 transition"
          >
            Back to Applications
          </Link>
        )}
      </div>

      {/* Action status message */}
      {actionStatus.type && (
        <div
          className={`mb-6 p-4 rounded-md ${
            actionStatus.type === "success"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {actionStatus.message}
        </div>
      )}

      {/* Application information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Application status */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Application Status</h2>
              <span
                className={`px-3 py-1 text-sm rounded-full ${
                  application.status === "pending"
                    ? "bg-yellow-100 text-yellow-800"
                    : application.status === "approved"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {application.status.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-500 text-sm">
              Applied on {new Date(application.createdAt).toLocaleDateString()}
            </p>

            {/* Action buttons for company */}
            {isCompanyOwner && application.status === "pending" && (
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => handleUpdateStatus("approved")}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
                >
                  Approve Application
                </button>
                <button
                  onClick={() => handleUpdateStatus("rejected")}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                >
                  Reject Application
                </button>
              </div>
            )}
          </div>

          {/* Cover Letter */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Cover Letter</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-gray-700 whitespace-pre-line">
                {application.coverLetter}
              </p>
            </div>
          </div>

          {/* Submission work */}
          {application.submissionLink && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Submitted Work</h2>
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-rose-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  ></path>
                </svg>
                <a
                  href={application.submissionLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-500 hover:text-rose-700 font-medium"
                >
                  {application.submissionLink}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Applicant Info */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">
              Applicant Information
            </h2>

            <div className="flex items-center mb-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                {application.applicant?.profilePicture ? (
                  <img
                    src={application.applicant.profilePicture}
                    alt={application.applicant.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-gray-500 text-xl">
                    {application.applicant?.name?.charAt(0) || "?"}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-medium">
                  {application.applicant?.name || "Unknown Applicant"}
                </h3>
                <p className="text-sm text-gray-500">
                  {application.applicant?.email || ""}
                </p>
              </div>
            </div>

            {/* Experience Level */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Experience Level
              </h3>
              <p>{application.applicant?.experienceLevel || "Not specified"}</p>
            </div>

            {/* Skills */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {application.applicant?.skills?.map(
                  (skill: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-rose-50 text-rose-700 text-xs rounded-md"
                    >
                      {skill}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Portfolio */}
            {application.applicant?.portfolioUrl && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Portfolio
                </h3>
                <a
                  href={application.applicant.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rose-500 hover:text-rose-700 text-sm"
                >
                  View Portfolio
                </a>
              </div>
            )}

            {/* Bio */}
            {application.applicant?.bio && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  About
                </h3>
                <p className="text-gray-700 text-sm">
                  {application.applicant.bio}
                </p>
              </div>
            )}
          </div>

          {/* Project Info */}
          {project && (
            <div className="bg-white p-6 rounded-lg shadow-md mt-6">
              <h2 className="text-lg font-semibold mb-4">
                Project Information
              </h2>
              <h3 className="font-medium">{project.title}</h3>
              <p className="text-sm text-gray-500 mb-2">
                Status: {project.status.toUpperCase()}
              </p>
              <Link
                to={`/projects/${project.id || project._id}`}
                className="text-rose-500 hover:text-rose-700 text-sm"
              >
                View Project Details
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetail;
