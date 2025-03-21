import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import axios from "axios";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const Dashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if (user?.role === "company") {
          // Fetch company projects
          const projectsResponse = await axios.get(
            `${API_URL}/users/${user.id}/projects`
          );
          if (projectsResponse.data.success) {
            setProjects(projectsResponse.data.data.projects || []);
          }
        } else if (user?.role === "junior") {
          // Fetch junior's applications
          const applicationsResponse = await axios.get(
            `${API_URL}/users/${user.id}/applications`
          );
          if (applicationsResponse.data.success) {
            setApplications(applicationsResponse.data.data.applications || []);
          }
        }
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError(err.response?.data?.error || "Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded-md mb-6">{error}</div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {user?.role === "company" && (
          <Link
            to="/create-project"
            className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition"
          >
            Create New Project
          </Link>
        )}
      </div>

      {/* Welcome section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-2">Welcome, {user?.name}</h2>
        <p className="text-gray-600">
          {user?.role === "company"
            ? "Manage your projects and find talented junior developers to help you."
            : "Discover projects and build your portfolio by helping companies with their needs."}
        </p>
      </div>

      {/* Stats section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-1">
            {user?.role === "company"
              ? "Active Projects"
              : "Active Applications"}
          </h3>
          <p className="text-3xl font-bold text-rose-500">
            {user?.role === "company"
              ? projects.filter(
                  (p: any) => p.status === "open" || p.status === "in-progress"
                ).length
              : applications.filter((a: any) => a.status === "pending").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-1">
            {user?.role === "company"
              ? "Completed Projects"
              : "Accepted Applications"}
          </h3>
          <p className="text-3xl font-bold text-green-600">
            {user?.role === "company"
              ? projects.filter((p: any) => p.status === "completed").length
              : applications.filter((a: any) => a.status === "accepted").length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-1">
            {user?.role === "company" ? "Applicants" : "Rejected Applications"}
          </h3>
          <p className="text-3xl font-bold text-gray-600">
            {user?.role === "company"
              ? projects.reduce(
                  (sum: number, p: any) => sum + (p.applicants?.length || 0),
                  0
                )
              : applications.filter((a: any) => a.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* Company dashboard content */}
      {user?.role === "company" && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Projects</h2>

          {projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                You haven't created any projects yet.
              </p>
              <Link
                to="/create-project"
                className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition"
              >
                Create Your First Project
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {projects.map((project: any) => (
                <div key={project.id} className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link
                        to={`/projects/${project.id}`}
                        className="text-lg font-medium text-rose-500 hover:text-rose-700"
                      >
                        {project.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        Created on{" "}
                        {new Date(project.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          project.status === "open"
                            ? "bg-green-100 text-green-800"
                            : project.status === "in-progress"
                            ? "bg-rose-100 text-rose-600"
                            : project.status === "completed"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {project.status.replace("-", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-600 line-clamp-2">
                    {project.description}
                  </p>
                  <div className="mt-2 flex items-center">
                    <span className="text-sm text-gray-500">
                      {project.applicants?.length || 0} applicants
                    </span>
                    <Link
                      to={`/projects/${project.id}`}
                      className="ml-auto text-sm text-rose-500 hover:text-rose-700"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Junior dashboard content */}
      {user?.role === "junior" && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Applications</h2>

          {applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">
                You haven't applied to any projects yet.
              </p>
              <Link
                to="/projects"
                className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition"
              >
                Browse Projects
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {applications.map((application: any) => (
                <div key={application.id} className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link
                        to={`/projects/${application.project.id}`}
                        className="text-lg font-medium text-rose-500 hover:text-rose-700"
                      >
                        {application.project.title}
                      </Link>
                      <p className="text-sm text-gray-500 mt-1">
                        Applied on{" "}
                        {new Date(application.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center">
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
                  </div>
                  {application.status === "accepted" && (
                    <p className="mt-2 text-green-600">
                      Congratulations! Your application was accepted.
                    </p>
                  )}
                  {application.status === "rejected" &&
                    application.feedback && (
                      <div className="mt-2">
                        <p className="text-gray-700 font-medium">Feedback:</p>
                        <p className="text-gray-600">{application.feedback}</p>
                      </div>
                    )}
                  <div className="mt-2 flex items-center">
                    <Link
                      to={`/projects/${application.project.id}`}
                      className="ml-auto text-sm text-rose-500 hover:text-rose-700"
                    >
                      View Project →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recommendations section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          {user?.role === "company"
            ? "Find Talented Developers"
            : "Recommended Projects"}
        </h2>
        <p className="text-gray-600 mb-4">
          {user?.role === "company"
            ? "Browse our community of motivated junior developers ready to help with your projects."
            : "Discover projects that match your skills and interests."}
        </p>
        <Link
          to={user?.role === "company" ? "/developers" : "/projects"}
          className="text-rose-500 hover:text-rose-700 font-medium"
        >
          {user?.role === "company"
            ? "Browse Developers →"
            : "Browse Projects →"}
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
