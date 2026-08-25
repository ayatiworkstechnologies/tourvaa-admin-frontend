import api from "@/lib/api/client";

// Cloudinary-backed documents come back as {"url": <signed cloudinary URL>}
// instead of file bytes (see private_documents.py:_serve_document) - a
// server-side redirect there would have its final response read cross-origin
// from res.cloudinary.com, which Cloudinary's authenticated delivery doesn't
// grant CORS for. Disk-backed (legacy) documents still stream as a blob from
// this same-origin endpoint, so that path stays CORS-free.
export async function openPrivateDocument(ownerType: "supplier" | "agent" | "affiliate", documentId: number) {
  const response = await api.get(`/private-documents/${ownerType}/${documentId}`, { responseType: "blob" });
  const contentType = String(response.headers["content-type"] || "application/octet-stream");

  if (contentType.includes("application/json")) {
    const { url } = JSON.parse(await (response.data as Blob).text());
    if (!url) throw new Error("Document URL missing from response");
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

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
