import { useCallback, useEffect, useRef, useState } from "react";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";

import { AppButton, AppCard, EmptyState, PageHeader, StatusChip, getSourceStatusLabel, getSourceStatusVariant } from "@/components/ui";
import { deleteLogSource, fetchLogSources, uploadLogFiles } from "@/lib/api";
import { formatLogTimestamp } from "@/lib/format";
import { colors } from "@/lib/theme";
import type { LogSource } from "@/types";

export default function IngestPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<LogSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingFilename, setDeletingFilename] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<LogSource | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const refreshDocuments = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoading(true);
    }
    try {
      const uploaded = await fetchLogSources("uploaded");
      setDocuments(uploaded);
      setError(null);
    } catch (err) {
      if (!options?.silent) {
        setError(err instanceof Error ? err.message : "Failed to load uploaded documents.");
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshDocuments();
  }, [refreshDocuments]);

  const hasProcessing = documents.some((doc) => doc.status === "processing");

  useEffect(() => {
    if (!hasProcessing) return undefined;
    const timer = window.setInterval(() => {
      void refreshDocuments({ silent: true });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hasProcessing, refreshDocuments]);

  const uploadFiles = async (files: FileList | File[]) => {
    const incoming = Array.from(files).filter((file) => file.name.toLowerCase().endsWith(".log"));
    if (incoming.length === 0) {
      setError("Only .log files are supported.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setUploading(true);
    try {
      const result = await uploadLogFiles(incoming);
      setSuccessMessage(result.message);
      setDocuments((current) => {
        const uploadedNames = new Set(result.uploaded.map((doc) => doc.filename));
        return [...result.uploaded, ...current.filter((doc) => !uploadedNames.has(doc.filename))];
      });
      void refreshDocuments({ silent: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;

    const filename = confirmDelete.filename;
    setDeletingFilename(filename);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await deleteLogSource(filename);
      setSuccessMessage(
        `${result.message} Removed ${result.eventsRemoved.toLocaleString()} log line(s)` +
          (result.vectorsRemoved > 0 ? ` and ${result.vectorsRemoved.toLocaleString()} embedding(s).` : "."),
      );
      setConfirmDelete(null);
      await refreshDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      await refreshDocuments();
    } finally {
      setDeletingFilename(null);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (event.dataTransfer.files.length > 0) {
      void uploadFiles(event.dataTransfer.files);
    }
  };

  return (
    <Box>
      <PageHeader title="Data Ingest" subtitle="Upload .log files to parse and index them." />

      {error ? (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {successMessage ? (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      ) : null}

      <AppCard title="Upload logs" padding="md">
        <Box
          onDragEnter={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setDragActive(false);
          }}
          onDrop={handleDrop}
          sx={{
            border: `2px dashed ${dragActive ? colors.primary : `${colors.primary}40`}`,
            borderRadius: 2,
            bgcolor: dragActive ? colors.primaryLight : colors.background,
            p: 4,
            textAlign: "center",
            transition: "border-color 0.15s ease, background-color 0.15s ease",
          }}
        >
          <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: colors.primary, mb: 1 }} />
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Drag and drop `.log` files here, or choose files from your computer.
          </Typography>
          <input
            ref={fileInputRef}
            type="file"
            accept=".log"
            multiple
            hidden
            onChange={(event) => {
              if (event.target.files) {
                void uploadFiles(event.target.files);
              }
              event.target.value = "";
            }}
          />
          <AppButton variant="secondary" loading={uploading} onClick={() => fileInputRef.current?.click()}>
            Choose files
          </AppButton>
        </Box>

        {uploading ? (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Saving file and parsing into SQLite…
            </Typography>
            <LinearProgress />
          </Box>
        ) : null}
      </AppCard>

      <Box sx={{ mt: 3 }}>
        <AppCard
          title="Uploaded documents"
          subtitle={documents.length > 0 ? `${documents.length} file${documents.length === 1 ? "" : "s"}` : undefined}
          padding="none"
        >
          {loading ? (
            <Box sx={{ p: 2 }}>
              <LinearProgress />
            </Box>
          ) : documents.length === 0 ? (
            <EmptyState
              title="No documents yet"
              description="Upload a .log file above and it will appear here."
              icon={<InsertDriveFileOutlinedIcon sx={{ fontSize: 24 }} />}
            />
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>File</TableCell>
                    <TableCell align="right">Lines</TableCell>
                    <TableCell>Tenants</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Uploaded</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.filename} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <InsertDriveFileOutlinedIcon sx={{ fontSize: 18, color: colors.textSecondary }} />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {doc.filename}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{doc.lines.toLocaleString()}</TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        >
                          {doc.tenants.join(", ")}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <StatusChip
                            label={getSourceStatusLabel(doc.status)}
                            variant={getSourceStatusVariant(doc.status)}
                          />
                          {doc.status === "processing" ? (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                              Embeddings in progress · {doc.lines.toLocaleString()} lines parsed into SQLite
                            </Typography>
                          ) : null}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {doc.lastIngested ? formatLogTimestamp(doc.lastIngested) : "—"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title={doc.status === "processing" ? "Wait until embeddings finish" : "Delete file and all indexed data"}>
                          <span>
                            <IconButton
                              size="small"
                              aria-label={`Delete ${doc.filename}`}
                              disabled={deletingFilename !== null || doc.status === "processing"}
                              onClick={() => setConfirmDelete(doc)}
                              sx={{ color: colors.textSecondary, "&:hover": { color: colors.error } }}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AppCard>
      </Box>

      <Dialog open={confirmDelete !== null} onClose={() => !deletingFilename && setConfirmDelete(null)}>
        <DialogTitle>Delete log file?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently remove <strong>{confirmDelete?.filename}</strong> from disk and delete all related
            data from SQLite and Chroma. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <AppButton variant="secondary" disabled={deletingFilename !== null} onClick={() => setConfirmDelete(null)}>
            Cancel
          </AppButton>
          <AppButton variant="danger" loading={deletingFilename !== null} onClick={() => void handleDelete()}>
            Delete
          </AppButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
