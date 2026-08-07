import api from "@/lib/api/client";

function downloadBlob(data: BlobPart, filename: string) {
  const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function exportTourExcel(tourId: number, filenameHint?: string) {
  const response = await api.get(`/tours/${tourId}/export`, { responseType: "blob" });
  downloadBlob(response.data as BlobPart, `${filenameHint || `tour-${tourId}`}.xlsx`);
}

export async function downloadTourImportTemplate() {
  const response = await api.get("/tours/import-template", { responseType: "blob" });
  downloadBlob(response.data as BlobPart, "tour-import-template.xlsx");
}

export type TourImportRowResult = {
  row: number;
  status: "created" | "error";
  tour_id?: number;
  title?: string;
  message?: string;
};

export type TourImportResponse = {
  created: number;
  failed: number;
  results: TourImportRowResult[];
};

export async function importToursExcel(file: File): Promise<TourImportResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/tours/import", formData, { headers: { "Content-Type": "multipart/form-data" } });
  return response.data?.data as TourImportResponse;
}
