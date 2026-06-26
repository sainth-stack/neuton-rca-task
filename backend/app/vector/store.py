from __future__ import annotations

from pathlib import Path

import chromadb

from app.config import get_settings
from app.ingest.parser import LogEntry
from app.llm.client import embed_texts


def _collection_text(entry: LogEntry) -> str:
    stack = "\n".join(entry.stack_trace) if entry.stack_trace else ""
    return (
        f"{entry.timestamp} [{entry.tenant_id}] {entry.level} [{entry.logger}] "
        f"{entry.message}\n{stack}".strip()
    )


class VectorStore:
    def __init__(self) -> None:
        settings = get_settings()
        path = Path(settings.chroma_path)
        if not path.is_absolute():
            path = Path.cwd() / path
        path.mkdir(parents=True, exist_ok=True)

        self._client = chromadb.PersistentClient(path=str(path.resolve()))
        self._collection = self._client.get_or_create_collection(
            name="log_events",
            metadata={"hnsw:space": "cosine"},
        )

    def delete_source(self, filename: str) -> int:
        existing = self._collection.get(where={"source_file": filename})
        ids = existing["ids"] or []
        if ids:
            self._collection.delete(ids=ids)
        return len(ids)

    def count_source(self, filename: str) -> int:
        existing = self._collection.get(where={"source_file": filename})
        return len(existing["ids"] or [])

    def index_entries(self, filename: str, entries: list[LogEntry]) -> int:
        """Embed ERROR/WARN lines for semantic retrieval during investigations."""
        self.delete_source(filename)

        candidates = [entry for entry in entries if entry.level in {"ERROR", "WARN"}]
        if not candidates:
            return 0

        batch_size = 100
        indexed = 0

        for start in range(0, len(candidates), batch_size):
            batch = candidates[start : start + batch_size]
            documents = [_collection_text(entry) for entry in batch]
            embeddings = embed_texts(documents)
            if not embeddings:
                continue

            self._collection.add(
                ids=[entry.log_id for entry in batch],
                documents=documents,
                embeddings=embeddings,
                metadatas=[
                    {
                        "log_id": entry.log_id,
                        "source_file": filename,
                        "tenant_id": entry.tenant_id,
                        "level": entry.level,
                        "timestamp": entry.timestamp,
                    }
                    for entry in batch
                ],
            )
            indexed += len(batch)

        return indexed

    def semantic_search(
        self,
        query: str,
        *,
        tenant_id: str | None = None,
        top_k: int = 15,
    ) -> list[str]:
        query_embedding = embed_texts([query])
        if not query_embedding:
            return []

        where = {"tenant_id": tenant_id} if tenant_id else None
        results = self._collection.query(
            query_embeddings=query_embedding,
            n_results=top_k,
            where=where,
            include=["metadatas"],
        )

        ids: list[str] = []
        for batch in results.get("ids", []) or []:
            ids.extend(batch)
        return ids


    def count(self) -> int:
        return int(self._collection.count())


_vector_store: VectorStore | None = None


def get_vector_store() -> VectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = VectorStore()
    return _vector_store
