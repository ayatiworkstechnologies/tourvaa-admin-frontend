/** Emitted after a successful API mutation so portal chrome and server data
 * can immediately reflect changes made from any screen. */
export const API_DATA_REFRESH_EVENT = "tourvaa:data:refresh";
/** Emitted after the shared portal chrome has handled a successful write.
 * Data-owning client screens may subscribe and refetch in place. */
export const API_DATA_UPDATED_EVENT = "tourvaa:data:updated";

export type ApiDataRefreshDetail = { method: string; path: string };

export function requestApiDataRefresh(detail: ApiDataRefreshDetail) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<ApiDataRefreshDetail>(API_DATA_REFRESH_EVENT, { detail }));
  }
}
