import jwt from "jsonwebtoken";
import * as jwtUtils from "../../utils/jwt";
import config from "../../config/config";

// Mock jwt library
jest.mock("jsonwebtoken");

describe("JWT Utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateTokens", () => {
    it("should generate access and refresh tokens", () => {
      // Mock jwt.sign to return specific tokens
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce("mock-access-token") // First call for access token
        .mockReturnValueOnce("mock-refresh-token"); // Second call for refresh token

      const userId = "user123";
      const role = "junior";
      const tokens = jwtUtils.generateTokens(userId, role);

      // Verify first call to jwt.sign for access token
      expect(jwt.sign).toHaveBeenNthCalledWith(
        1,
        { userId, role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      // Verify second call to jwt.sign for refresh token
      expect(jwt.sign).toHaveBeenNthCalledWith(
        2,
        { userId },
        config.jwtRefreshSecret,
        { expiresIn: config.jwtRefreshExpiresIn }
      );

      // Verify returned tokens
      expect(tokens).toEqual({
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
      });
    });
  });

  describe("verifyAccessToken", () => {
    it("should verify and return decoded access token payload", () => {
      const mockPayload = { userId: "user123", role: "junior" };

      // Mock jwt.verify to return decoded payload
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = jwtUtils.verifyAccessToken("valid-token");

      // Verify jwt.verify was called with the correct parameters
      expect(jwt.verify).toHaveBeenCalledWith("valid-token", config.jwtSecret);

      // Verify the returned payload
      expect(result).toEqual(mockPayload);
    });

    it("should return null for invalid access token", () => {
      // Mock jwt.verify to throw an error (invalid token)
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = jwtUtils.verifyAccessToken("invalid-token");

      // Verify jwt.verify was called with the correct parameters
      expect(jwt.verify).toHaveBeenCalledWith(
        "invalid-token",
        config.jwtSecret
      );

      // Verify null is returned for invalid token
      expect(result).toBeNull();
    });
  });

  describe("verifyRefreshToken", () => {
    it("should verify and return decoded refresh token payload", () => {
      const mockPayload = { userId: "user123" };

      // Mock jwt.verify to return decoded payload
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = jwtUtils.verifyRefreshToken("valid-refresh-token");

      // Verify jwt.verify was called with the correct parameters
      expect(jwt.verify).toHaveBeenCalledWith(
        "valid-refresh-token",
        config.jwtRefreshSecret
      );

      // Verify the returned payload
      expect(result).toEqual(mockPayload);
    });

    it("should return null for invalid refresh token", () => {
      // Mock jwt.verify to throw an error (invalid token)
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error("Invalid token");
      });

      const result = jwtUtils.verifyRefreshToken("invalid-refresh-token");

      // Verify jwt.verify was called with the correct parameters
      expect(jwt.verify).toHaveBeenCalledWith(
        "invalid-refresh-token",
        config.jwtRefreshSecret
      );

      // Verify null is returned for invalid token
      expect(result).toBeNull();
    });
  });

  describe("refreshAccessToken", () => {
    it("should generate new access token from valid refresh token", () => {
      const userId = "user123";
      const role = "junior";

      // Mock verifyRefreshToken to return a valid userId
      jest.spyOn(jwtUtils, "verifyRefreshToken").mockReturnValue({ userId });

      // Mock jwt.sign to return a new access token
      (jwt.sign as jest.Mock).mockReturnValue("new-access-token");

      const result = jwtUtils.refreshAccessToken("valid-refresh-token", role);

      // Verify verifyRefreshToken was called with the correct refresh token
      expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith(
        "valid-refresh-token"
      );

      // Verify jwt.sign was called with the correct parameters
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId, role },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
      );

      // Verify the returned new access token
      expect(result).toBe("new-access-token");
    });

    it("should return null for invalid refresh token", () => {
      // Mock verifyRefreshToken to return null (invalid token)
      jest.spyOn(jwtUtils, "verifyRefreshToken").mockReturnValue(null);

      const result = jwtUtils.refreshAccessToken(
        "invalid-refresh-token",
        "junior"
      );

      // Verify verifyRefreshToken was called with the correct refresh token
      expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith(
        "invalid-refresh-token"
      );

      // Verify jwt.sign was not called
      expect(jwt.sign).not.toHaveBeenCalled();

      // Verify null is returned for invalid refresh token
      expect(result).toBeNull();
    });
  });
});
