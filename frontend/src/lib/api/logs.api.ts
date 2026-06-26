import { apiClient } from "./client";
import { mapLogsListResponse } from "./mappers";
import type { ApiLogsListResponse } from "./types";

export type ListLogsParams = {
  tenant?: string;
  level?: string;
  source?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export const logsApi = {
  list(params?: ListLogsParams) {
    return apiClient.get<ApiLogsListResponse>("/logs", { params });
  },
};

export async function fetchLogEvents(params?: ListLogsParams) {
  const { data } = await logsApi.list(params);
  return mapLogsListResponse(data);
}

export async function fetchLogEventPage(params: ListLogsParams & { page: number; pageSize: number }) {
  const { page, pageSize, ...filters } = params;
  const { data } = await logsApi.list({
    ...filters,
    limit: pageSize,
    offset: page * pageSize,
  });
  return mapLogsListResponse(data);
}
