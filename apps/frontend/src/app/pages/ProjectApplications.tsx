import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const ProjectApplications = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<{
    type: "success" | "error" | null;
    message: string | null;
  }>({ type: null, message: null });

  // Fetch project and applications data
  useEffect(() => {
    const fetchProjectAndApplications = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // First fetch project details to verify ownership
        const projectResponse = await axios.get(`${API_URL}/projects/${id}`);

        if (!projectResponse.data.success) {
          setError(
            projectResponse.data.error || "Failed to fetch project details"
          );
          setIsLoading(false);
          return;
        }

        const projectData = projectResponse.data.data;
        setProject(projectData);

        // Verify that the current user is the project owner
        if (
          user?.role !== "company" ||
          !projectData.company ||
          (projectData.company &&
            projectData.company.id !== user?.id &&
            projectData.company._id !== user?.id)
        ) {
          setError("You do not have permission to view these applications");
          setIsLoading(false);
          return;
        }

        // Then fetch applications
        const applicationsResponse = await axios.get(
          `${API_URL}/projects/${id}/applications`
        );

        if (applicationsResponse.data.success) {
          setApplications(applicationsResponse.data.data.applications || []);
        } else {
          setError(
            applicationsResponse.data.error || "Failed to fetch applications"
          );
        }
      } catch (err: any) {
        console.error("Error fetching project applications:", err);
        setError(
          err.response?.data?.error || "Failed to fetch project applications"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (id && user) {
      fetchProjectAndApplications();
    }
  }, [id, user]);

  // Handle application status update
  const handleUpdateStatus = async (
    applicationId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      const response = await axios.patch(
        `${API_URL}/applications/${applicationId}`,
        { status }
      );

      if (response.data.success) {
        // Update the applications list
        setApplications(
          applications.map((app) =>
            app.id === applicationId || app._id === applicationId
              ? { ...app, status: status }
              : app
          )
        );

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

  if (error) {
    return (
      <div className="p-6 bg-red-100 text-red-700 rounded-md">{error}</div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      {/* Breadcrumb navigation */}
      <div className="flex items-center text-sm text-gray-500 mb-6">
        <Link to="/projects" className="hover:text-rose-500">
          Projects
        </Link>
        <span className="mx-2">/</span>
        <Link to={`/projects/${id}`} className="hover:text-rose-500">
          {project?.title || "Project"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Applications</span>
      </div>

      {/* Page header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Applications for {project?.title}
        </h1>
        <Link
          to={`/projects/${id}`}
          className="px-4 py-2 border border-rose-500 text-rose-500 rounded-md hover:bg-rose-50 transition"
        >
          Back to Project
        </Link>
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

      {/* Applications list */}
      {applications.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-500">
            No applications have been submitted for this project yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Applicant
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Skills
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Experience
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Submitted
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {applications.map((application) => (
                  <tr
                    key={application.id || application._id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 relative">
                          {application.applicant?.profilePicture ? (
                            <img
                              src={application.applicant.profilePicture}
                              alt={application.applicant.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500">
                                {application.applicant?.name?.charAt(0) || "?"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {application.applicant?.name || "Unknown Applicant"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.applicant?.email || ""}
                          </div>
                          {application.applicant?.portfolioUrl && (
                            <a
                              href={application.applicant.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-rose-500 hover:text-rose-700"
                            >
                              Portfolio
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {application.applicant?.skills
                          ?.slice(0, 3)
                          .map((skill: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-rose-50 text-rose-700 text-xs rounded-md"
                            >
                              {skill}
                            </span>
                          ))}
                        {application.applicant?.skills?.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md">
                            +{application.applicant.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {application.applicant?.experienceLevel ||
                          "Not specified"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(application.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          application.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : application.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {application.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {application.status === "pending" && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  application.id || application._id,
                                  "approved"
                                )
                              }
                              className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateStatus(
                                  application.id || application._id,
                                  "rejected"
                                )
                              }
                              className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded transition"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={() =>
                            navigate(
                              `/applications/${
                                application.id || application._id
                              }`
                            )
                          }
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded transition"
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Application Details Modal - For a future enhancement */}
    </div>
  );
};

export default ProjectApplications;
