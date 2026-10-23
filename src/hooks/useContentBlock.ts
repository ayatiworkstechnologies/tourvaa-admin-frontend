import { useEffect, useRef, useState } from "react";
import { fetchContentBlock } from "@/lib/api/publicClient";

/**
 * Fetches an admin-editable CMS content block (see CMS > Content & Pages in
 * the admin) and returns its data, falling back to `def` while loading or
 * whenever the block is empty - the public page renders exactly as before
 * until an admin actually edits that block.
 */
export function useContentBlock<T extends Record<string, unknown>>(key: string, def: T): T {
  const [data, setData] = useState<T>(def);
  // Callers commonly provide object literals as fallbacks. Keep the mount-time
  // fallback stable so loading does not re-run solely because its identity
  // changes on a render. CMS defaults are static module values by contract.
  const fallbackRef = useRef(def);

  useEffect(() => {
    let active = true;
    const fallback = fallbackRef.current;
    setData(fallback);
    fetchContentBlock<T>(key)
      .then((res) => {
        if (active && res?.data && Object.keys(res.data).length) setData({ ...fallback, ...res.data });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [key]);
  return data;
}
