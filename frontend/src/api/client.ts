
import axios from "axios";

const API_BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/")
  : "/api/";

const API_ROOT = API_BASE_URL.replace(/\/+$/, "");

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase();

  if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const response = await axios.get(
      `${API_ROOT.replace(/\/api$/, "")}/api/csrf/`,
      {
        withCredentials: true,
      },
    );

    const csrfToken = response.data.csrfToken;

    if (csrfToken) {
      config.headers.set("X-CSRFToken", csrfToken);
    }
  }

  return config;
});

export default apiClient;
