import { Request, Response } from "express";
import axios from "axios";

/**
 * Enhance project details using LLM (Groq)
 * @route POST /api/ai/enhance-project
 * @access Private (Companies only)
 */
export const enhanceProject = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Enhance project API called");
    console.log("Request user:", req.user);
    console.log("Request body:", req.body);

    const { title, description } = req.body;

    if (!title || !description) {
      res.status(400).json({
        success: false,
        error: "Title and description are required",
      });
      return;
    }

    // Only companies should be able to use this feature
    if (!req.user || req.user.role !== "company") {
      res.status(403).json({
        success: false,
        error: "Only companies can use this feature",
      });
      return;
    }

    // Prepare prompt for the LLM
    const prompt = `
      You are a skilled professional helping companies create better project descriptions.
      Enhance the following project information and return structured metadata in JSON format:
      
      Title: ${title}
      Description: ${description}
      
      Return detailed JSON with these keys:
      - enhancedDescription: A detailed, well-structured and professional project description
      - tags: An array of relevant tags for the project (3-5 tags)
      - requiredSkills: An array of technical skills required for the project (3-7 skills)
      - requirements: An array of specific project requirements (3-5 requirements)
      - experienceLevel: Suggested experience level (Beginner, Intermediate, or Advanced)
      
      Ensure your response is only valid JSON with no additional text.
    `;

    // Get configuration from environment variables
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const GROQ_MODEL = process.env.GROQ_MODEL || "mixtral-8x7b-32768";
    const GROQ_TEMPERATURE = parseFloat(process.env.GROQ_TEMPERATURE || "0.7");
    const GROQ_MAX_TOKENS = parseInt(process.env.GROQ_MAX_TOKENS || "1000");

    console.log("GROQ configuration:", {
      model: GROQ_MODEL,
      temperature: GROQ_TEMPERATURE,
      maxTokens: GROQ_MAX_TOKENS,
      keyDefined: !!GROQ_API_KEY,
    });

    if (!GROQ_API_KEY) {
      res.status(500).json({
        success: false,
        error: "GROQ_API_KEY not configured",
      });
      return;
    }

    console.log("Making API request to Groq");
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that responds only with valid JSON.",
          },
          { role: "user", content: prompt },
        ],
        temperature: GROQ_TEMPERATURE,
        max_tokens: GROQ_MAX_TOKENS,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Groq API response received");

    // Extract and parse the JSON response
    const assistantMessage = response.data.choices[0].message.content;
    console.log("Raw LLM response:", assistantMessage);

    let enhancedData;

    try {
      // Parse the response, handling potential JSON within a code block
      let jsonString = assistantMessage.trim();

      // Handle <think> section if present
      if (jsonString.includes("<think>") && jsonString.includes("</think>")) {
        console.log("Detected <think> section, removing it...");
        jsonString = jsonString.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
      }

      // If the response is in a markdown code block, extract just the JSON
      if (jsonString.startsWith("```json")) {
        jsonString = jsonString
          .substring(7, jsonString.lastIndexOf("```"))
          .trim();
      } else if (jsonString.startsWith("```")) {
        jsonString = jsonString
          .substring(3, jsonString.lastIndexOf("```"))
          .trim();
      }

      console.log("Parsed JSON string:", jsonString);
      enhancedData = JSON.parse(jsonString);
      console.log("Parsed data:", enhancedData);
    } catch (parseError) {
      console.error("Error parsing LLM response:", parseError);
      console.log("Raw response:", assistantMessage);

      res.status(500).json({
        success: false,
        error: "Failed to parse AI response",
        rawResponse: assistantMessage,
      });
      return;
    }

    // Return the enhanced project data
    console.log("Sending successful response");
    res.status(200).json({
      success: true,
      data: enhancedData,
    });
  } catch (error) {
    console.error("AI enhance project error:", error);

    // Handle Groq API specific errors
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", error.response?.data);

      res.status(500).json({
        success: false,
        error: error.response?.data?.error?.message || "Error calling Groq API",
      });
    } else {
      res.status(500).json({
        success: false,
        error: "Server error",
      });
    }
  }
};
