import { useState, useEffect, useRef, useCallback } from "react";
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
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [skills, setSkills] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Infinite scrolling states
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Ref for the observer
  const observer = useRef<IntersectionObserver | null>(null);
  const lastProjectElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading || isLoadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isLoading, isLoadingMore, hasMore]
  );

  // Fetch projects on mount and when filters change
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true);
      setError(null);
      // Reset projects and pagination when filters change
      setProjects([]);
      setPage(1);
      setHasMore(true);

      try {
        // Build query parameters
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (status) params.append("status", status);
        if (skills) params.append("skills", skills);
        params.append("page", "1");
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
          setHasMore(
            response.data.data.pagination.page <
              response.data.data.pagination.pages
          );
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
  }, [search, status, skills, sortBy, sortOrder]);

  // Load more projects when page changes
  useEffect(() => {
    // Skip initial load (handled by the filter effect)
    if (page === 1) return;

    const loadMoreProjects = async () => {
      setIsLoadingMore(true);

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

        // Fetch more projects
        const response = await axios.get(
          `${API_URL}/projects?${params.toString()}`,
          {
            headers,
          }
        );

        if (response.data.success) {
          console.log("More projects data:", response.data.data.projects);
          setProjects((prevProjects) => [
            ...prevProjects,
            ...response.data.data.projects,
          ]);
          setHasMore(
            response.data.data.pagination.page <
              response.data.data.pagination.pages
          );
        } else {
          setError(response.data.error || "Failed to fetch more projects");
        }
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to fetch more projects");
      } finally {
        setIsLoadingMore(false);
      }
    };

    loadMoreProjects();
  }, [page]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    // No need to reset page to 1 as the filter effect will do it
  };

  // Handle status filter change
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    // No need to reset page to 1 as the filter effect will do it
  };

  // Handle skills filter change
  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkills(e.target.value);
    // No need to reset page to 1 as the filter effect will do it
  };

  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const [field, order] = e.target.value.split(":");
    setSortBy(field);
    setSortOrder(order);
    // No need to reset page to 1 as the filter effect will do it
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

      {/* Loading state - initial loading */}
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
              {projects.map((project: any, index: number) => {
                // Check if this is the last project to attach the ref for infinite scrolling
                const isLastProject = index === projects.length - 1;

                return (
                  <div
                    key={project._id || `project-${Math.random()}`}
                    ref={isLastProject ? lastProjectElementRef : null}
                    className="bg-white p-6 rounded-lg shadow-md"
                  >
                    {/* Project company info */}
                    <div className="flex items-center mb-4">
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-gray-200 mr-3">
                        {project.company?.profilePicture ? (
                          <img
                            src={getFullImageUrl(
                              project.company.profilePicture
                            )}
                            alt={project.company?.name || "Company"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-gray-300 text-gray-600">
                            <i className="fas fa-building"></i>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {project.company?.name || "Unknown Company"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            project.createdAt || Date.now()
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            project.status === "open"
                              ? "bg-green-100 text-green-800"
                              : project.status === "in-progress"
                              ? "bg-blue-100 text-blue-800"
                              : project.status === "completed"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {project.status
                            ?.split("-")
                            .map(
                              (word: string) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ") || "Unknown"}
                        </span>
                      </div>
                    </div>

                    {/* Project title and description */}
                    <h2 className="text-xl font-semibold mb-2">
                      {project.title}
                    </h2>
                    <p className="text-gray-600 mb-4">
                      {project.description?.substring(0, 150)}
                      {project.description?.length > 150 ? "..." : ""}
                    </p>

                    {/* Project skills */}
                    {project.skillsRequired &&
                      project.skillsRequired.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Skills Required
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {project.skillsRequired.map(
                              (skill: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}

                    <div className="mt-4 text-sm text-gray-500">
                      <span>
                        Timeline:{" "}
                        {new Date(
                          project.timeframe.startDate
                        ).toLocaleDateString()}{" "}
                        -{" "}
                        {new Date(
                          project.timeframe.endDate
                        ).toLocaleDateString()}
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
                );
              })}

              {/* Loading more indicator at the bottom */}
              {isLoadingMore && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-rose-500"></div>
                </div>
              )}

              {/* End of results message */}
              {!hasMore && projects.length > 0 && (
                <div className="text-center py-6 text-gray-500">
                  You've reached the end of the list
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProjectList;
