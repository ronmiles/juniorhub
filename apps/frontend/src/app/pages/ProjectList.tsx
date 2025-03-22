import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";
import { getFullImageUrl } from "../utils/imageUtils";
import LikeButton from "../components/LikeButton";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Status options for filtering
const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "canceled", label: "Canceled" },
];

const ProjectList = () => {
  const { user, getAuthHeaders } = useAuth();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [skills, setSkills] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch projects on mount and when filters change
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (status) params.append("status", status);
        if (skills) params.append("skills", skills);
        params.append("page", page.toString());
        params.append("limit", limit.toString());
        params.append("sort", sortBy);
        params.append("order", sortOrder);

        // Get auth headers
        const headers = getAuthHeaders();
        
        // Fetch projects
        const response = await axios.get(
          `${API_URL}/projects?${params.toString()}`,
          {
            headers,
          }
        );

        if (response.data.success) {
          console.log("Projects data:", response.data.data.projects);
          setProjects(response.data.data.projects);
          setTotal(response.data.data.pagination.total);
          setTotalPages(response.data.data.pagination.pages);
        } else {
          setError(response.data.error || "Failed to fetch projects");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch projects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, [search, status, skills, page, limit, sortBy, sortOrder]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  // Handle status filter change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1); // Reset to first page on filter change
  };

  // Handle skills filter change
  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkills(e.target.value);
    setPage(1); // Reset to first page on filter change
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split(":");
    setSortBy(field);
    setSortOrder(order);
    setPage(1); // Reset to first page on sort change
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        {user?.role === "company" && (
          <Link
            to="/create-project"
            className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition"
          >
            Create New Project
          </Link>
        )}
      </div>

      {/* Filters section */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search input */}
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Projects
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by title or description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={search}
              onChange={handleSearchChange}
            />
          </div>

          {/* Status filter */}
          <div>
            <label
              htmlFor="status"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Status
            </label>
            <select
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={status}
              onChange={handleStatusChange}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Skills filter */}
          <div>
            <label
              htmlFor="skills"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Skills (comma-separated)
            </label>
            <input
              type="text"
              id="skills"
              placeholder="e.g. React, Node.js, TypeScript"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={skills}
              onChange={handleSkillsChange}
            />
          </div>

          {/* Sort options */}
          <div>
            <label
              htmlFor="sort"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Sort By
            </label>
            <select
              id="sort"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
              value={`${sortBy}:${sortOrder}`}
              onChange={handleSortChange}
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="likes:desc">Most Popular</option>
              <option value="title:asc">Title (A-Z)</option>
              <option value="title:desc">Title (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
        </div>
      ) : (
        <>
          {/* Project list */}
          {projects.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <h2 className="text-xl font-semibold mb-2">No projects found</h2>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters or search criteria.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setStatus("");
                  setSkills("");
                  setSortBy("createdAt");
                  setSortOrder("desc");
                }}
                className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {projects.map((project: any) => (
                <div
                  key={project.id || `project-${Math.random()}`}
                  className="bg-white p-6 rounded-lg shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <Link
                      to={`/projects/${project._id}`}
                      className="text-xl font-semibold text-rose-500 hover:text-rose-700"
                    >
                      {project.title}
                    </Link>
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

                  <p className="mt-2 text-gray-600">
                    {project.description.length > 200
                      ? `${project.description.slice(0, 200)}...`
                      : project.description}
                  </p>

                  {/* Company info */}
                  <div className="mt-4 flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                      {project.company ? (
                        project.company.profilePicture ? (
                          <img
                            src={getFullImageUrl(
                              project.company.profilePicture
                            )}
                            alt={project.company.name}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <span className="text-gray-500 text-sm">
                            {project.company.name.charAt(0)}
                          </span>
                        )
                      ) : (
                        <span className="text-gray-500 text-sm">?</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      {project.company
                        ? project.company.name
                        : "Unknown Company"}
                    </span>
                  </div>

                  {/* Skills and timeline */}
                  <div className="mt-4 flex flex-wrap gap-2">
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

                  <div className="mt-4 text-sm text-gray-500">
                    <span>
                      Timeline:{" "}
                      {new Date(
                        project.timeframe.startDate
                      ).toLocaleDateString()}{" "}
                      -{" "}
                      {new Date(project.timeframe.endDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Project stats and action button */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        <i className="far fa-user"></i>{" "}
                        {project.applicants?.length || 0} applicants
                      </span>
                      <LikeButton
                        projectId={project._id}
                        initialLikes={project.likes || 0}
                        initialUserHasLiked={project.hasLiked || false}
                      />
                    </div>
                    {project._id ? (
                      <Link
                        to={`/projects/${project._id}`}
                        className="px-4 py-2 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition text-sm"
                      >
                        {user?.role === "junior" && project.status === "open"
                          ? "Apply Now"
                          : "View Details"}
                      </Link>
                    ) : (
                      <span className="px-4 py-2 bg-gray-300 text-gray-600 rounded-md text-sm">
                        Missing Project ID
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav
                className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                aria-label="Pagination"
              >
                <button
                  onClick={() => setPage(page > 1 ? page - 1 : 1)}
                  disabled={page === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    page === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Previous</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>

                {/* Page numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border ${
                        page === pageNum
                          ? "z-10 bg-rose-50 border-rose-500 text-rose-600"
                          : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                      } text-sm font-medium`}
                    >
                      {pageNum}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setPage(page < totalPages ? page + 1 : totalPages)
                  }
                  disabled={page === totalPages}
                  className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                    page === totalPages
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="sr-only">Next</span>
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </nav>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectList;
