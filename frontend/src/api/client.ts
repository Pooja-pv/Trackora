import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:8000/api/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(async (config) => {
  const method = config.method?.toUpperCase();

  if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const response = await axios.get(
      "http://localhost:8000/api/auth/csrf/",
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
