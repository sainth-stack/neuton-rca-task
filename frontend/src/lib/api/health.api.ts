import { apiClient } from "./client";
import type { ApiHealthResponse } from "./types";

/** Health endpoints — see Swagger tag `health`. */
export const healthApi = {
  /** GET /api/health */
  check() {
    return apiClient.get<ApiHealthResponse>("/health");
  },
};

export async function checkHealth() {
  const { data } = await healthApi.check();
  return data;
}
