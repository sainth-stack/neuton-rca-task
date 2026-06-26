import { apiClient } from "./client";
import type { ApiHealthResponse } from "./types";

export const healthApi = {
  check() {
    return apiClient.get<ApiHealthResponse>("/health");
  },
};

export async function checkHealth() {
  const { data } = await healthApi.check();
  return data;
}
