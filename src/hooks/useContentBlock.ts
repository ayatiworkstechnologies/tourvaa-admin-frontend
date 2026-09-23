import { useEffect, useState } from "react";
import { fetchContentBlock } from "@/lib/api/publicClient";

/**
 * Fetches an admin-editable CMS content block (see CMS > Content & Pages in
 * the admin) and returns its data, falling back to `def` while loading or
 * whenever the block is empty - the public page renders exactly as before
 * until an admin actually edits that block.
 */
export function useContentBlock<T extends Record<string, unknown>>(key: string, def: T): T {
  const [data, setData] = useState<T>(def);
  useEffect(() => {
    let active = true;
    fetchContentBlock<T>(key)
      .then((res) => {
        if (active && res?.data && Object.keys(res.data).length) setData({ ...def, ...res.data });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return data;
}
