import { apiClient } from "./client";
import { mapInvestigateResponse } from "./mappers";
import type { ApiInvestigateRequest, ApiInvestigateResponse } from "./types";

/** Investigate endpoints — see Swagger tag `investigate`. */
export const investigateApi = {
  /** POST /api/investigate */
  run(payload: ApiInvestigateRequest) {
    return apiClient.post<ApiInvestigateResponse>("/investigate", payload);
  },
};

export async function runInvestigation(query: string, sources: string[] = []) {
  const { data } = await investigateApi.run({ query, sources });
  return mapInvestigateResponse(data);
}
