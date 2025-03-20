import config from "../config/config";

export const FRONTEND_URL = config.clientUrl || "http://localhost:4200";
export const OAUTH_CALLBACK_PATH = "/oauth-callback";
export const LOGIN_PATH = "/login";
export const DASHBOARD_PATH = "/dashboard";
