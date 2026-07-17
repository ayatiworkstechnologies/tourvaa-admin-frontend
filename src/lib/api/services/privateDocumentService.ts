import api from "@/lib/api/client";

export async function openPrivateDocument(ownerType: "supplier" | "agent", documentId: number) {
  const response = await api.get(`/private-documents/${ownerType}/${documentId}`, { responseType: "blob" });
  const contentType = String(response.headers["content-type"] || "application/octet-stream");
  const url = window.URL.createObjectURL(new Blob([response.data as BlobPart], { type: contentType }));
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 30_000);
}
