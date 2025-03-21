import { useState } from "react";
import axios from "axios";
import { useAuth } from "./useAuth";

// API base URL
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

interface EnhancedProjectData {
  enhancedDescription: string;
  tags: string[];
  requiredSkills: string[];
  requirements: string[];
  experienceLevel: string;
}

// Maximum number of retries
const MAX_RETRIES = 2;
// Delay between retries in milliseconds
const RETRY_DELAY = 1000;

export const useAiEnhancement = () => {
  const { user, getAuthHeaders } = useAuth();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to delay execution
  const delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const enhanceProject = async (
    title: string,
    description: string
  ): Promise<EnhancedProjectData | null> => {
    try {
      // Clear any previous errors
      setError(null);

      console.log("enhanceProject called with:", { title, description });
      console.log("Current user:", user);
      console.log(
        "Auth headers:",
        getAuthHeaders ? getAuthHeaders() : "getAuthHeaders is undefined"
      );

      // Check if user is logged in and is a company
      if (!user || user.role !== "company") {
        const errorMsg = "Only companies can use the AI enhancement feature";
        console.error(errorMsg, { user });
        setError(errorMsg);
        return null;
      }

      // Check if title and description are provided
      if (!title.trim() || !description.trim()) {
        const errorMsg = "Title and description are required";
        console.error(errorMsg);
        setError(errorMsg);
        return null;
      }

      setIsEnhancing(true);

      let retries = 0;
      let lastError = null;

      while (retries <= MAX_RETRIES) {
        try {
          console.log(
            `Making API request to: ${API_URL}/ai/enhance-project (attempt ${
              retries + 1
            })`
          );
          console.log("Request body:", { title, description });
          console.log("Headers:", getAuthHeaders());

          const response = await axios.post(
            `${API_URL}/ai/enhance-project`,
            { title, description },
            { headers: getAuthHeaders() }
          );

          console.log("API response:", response.data);

          if (response.data.success) {
            return response.data.data as EnhancedProjectData;
          } else {
            const errorMsg = response.data.error || "Failed to enhance project";
            console.error("API error:", errorMsg);
            lastError = errorMsg;

            // If this is not a server error, don't retry
            if (!errorMsg.includes("Server error")) {
              setError(errorMsg);
              return null;
            }
          }
        } catch (err: any) {
          console.error(
            `Exception in enhanceProject (attempt ${retries + 1}):`,
            err
          );
          console.error("Error response:", err.response?.data);

          lastError =
            err.response?.data?.error ||
            "An error occurred while enhancing the project";
        }

        // If this is not the last retry, wait before trying again
        if (retries < MAX_RETRIES) {
          console.log(
            `Retrying in ${RETRY_DELAY}ms... (${retries + 1}/${MAX_RETRIES})`
          );
          await delay(RETRY_DELAY * (retries + 1)); // Increase delay with each retry
          retries++;
        } else {
          break;
        }
      }

      // If we've exhausted all retries, set the last error
      if (lastError) {
        setError(lastError);
      } else {
        setError("Failed to enhance project after multiple attempts");
      }

      return null;
    } finally {
      // Always ensure we reset the loading state
      setIsEnhancing(false);
    }
  };

  return {
    enhanceProject,
    isEnhancing,
    error,
  };
};
