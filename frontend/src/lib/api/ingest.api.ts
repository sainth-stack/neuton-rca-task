import { apiClient } from "./client";
import { mapDeleteSourceResponse, mapIngestResponse, mapLogSource, mapUploadResponse } from "./mappers";
import type { ApiDeleteSourceResponse, ApiIngestRequest, ApiIngestResponse, ApiLogSource, ApiUploadResponse, ListSourcesParams } from "./types";

/** Ingest endpoints — see Swagger tag `ingest`. */
export const ingestApi = {
  /** GET /api/ingest/sources */
  listSources(params?: ListSourcesParams) {
    return apiClient.get<ApiLogSource[]>("/ingest/sources", { params });
  },

  /** POST /api/ingest/upload — multipart field name: `files` */
  upload(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return apiClient.post<ApiUploadResponse>("/ingest/upload", formData);
  },

  /** POST /api/ingest */
  run(payload: ApiIngestRequest = {}) {
    return apiClient.post<ApiIngestResponse>("/ingest", payload);
  },

  /** DELETE /api/ingest/sources?filename=... */
  deleteSource(filename: string) {
    return apiClient.delete<ApiDeleteSourceResponse>("/ingest/sources", { params: { filename } });
  },
};

/** Convenience helpers used by pages (camelCase app models). */
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
