import { apiClient } from "./client";
import { mapDeleteSourceResponse, mapIngestResponse, mapLogSource, mapUploadResponse } from "./mappers";
import type { ApiDeleteSourceResponse, ApiIngestRequest, ApiIngestResponse, ApiLogSource, ApiUploadResponse, ListSourcesParams } from "./types";

export const ingestApi = {
  listSources(params?: ListSourcesParams) {
    return apiClient.get<ApiLogSource[]>("/ingest/sources", { params });
  },

  upload(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return apiClient.post<ApiUploadResponse>("/ingest/upload", formData);
  },

  run(payload: ApiIngestRequest = {}) {
    return apiClient.post<ApiIngestResponse>("/ingest", payload);
  },

  deleteSource(filename: string) {
    return apiClient.delete<ApiDeleteSourceResponse>("/ingest/sources", { params: { filename } });
  },
};

export async function fetchLogSources(scope?: "uploaded") {
  const { data } = await ingestApi.listSources(scope ? { scope } : undefined);
  return data.map(mapLogSource);
}

export async function uploadLogFiles(files: File[]) {
  const { data } = await ingestApi.upload(files);
  return mapUploadResponse(data);
}

export async function ingestLogs(filenames: string[] = []) {
  const { data } = await ingestApi.run({ filenames });
  return mapIngestResponse(data);
}

export async function deleteLogSource(filename: string) {
  const { data } = await ingestApi.deleteSource(filename);
  return mapDeleteSourceResponse(data);
}
