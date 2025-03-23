// Define a type for Swagger paths
export type SwaggerPathsType = {
  [path: string]: {
    [method: string]: {
      summary: string;
      tags: string[];
      parameters?: any[];
      requestBody?: any;
      responses: {
        [statusCode: string]: {
          description: string;
          content?: any;
        };
      };
      [key: string]: any;
    };
  };
}; 