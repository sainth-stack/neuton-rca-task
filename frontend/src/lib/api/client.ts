import axios, { isAxiosError } from "axios";

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 120_000,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (config.data instanceof FormData && config.headers) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  }
  return config;
});

function toErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.code === "ERR_CANCELED") {
      return "Upload was cancelled. Please try again.";
    }
    if (error.code === "ECONNABORTED") {
      return "Upload timed out. Large files may take longer — try again or upload one file at a time.";
    }
    if (!error.response) {
      return "Unable to reach the server. Start the backend on port 8000.";
    }

    const detail = error.response.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }

    return `Request failed (${error.response.status})`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(toErrorMessage(error))),
);
