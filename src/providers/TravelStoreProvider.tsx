"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "@/lib/api/client";
import { useAuthContext } from "@/providers/AuthProvider";

export type TravelItem = {
  id: number;
  title: string;
  place: string;
  image: string;
  price: number | null;
  currency: string;
  duration: string;
  href?: string;
};

export const MAX_COMPARE_ITEMS = 4;
const COMPARE_STORAGE_KEY = "tourvaa_compare";
const WISHLIST_STORAGE_KEY = "tourvaa_wishlist";

function readLocalWishlist(): TravelItem[] {
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLocalWishlist(items: TravelItem[]) {
  try {
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore write failures (private browsing, quota, etc.)
  }
}

type TravelStore = {
  hydrated: boolean;
  wishlist: TravelItem[];
  wishlistCount: number;
  isWishlisted: (id: number) => boolean;
  toggleWishlist: (item: TravelItem) => void;
  compareList: TravelItem[];
  compareCount: number;
  isCompared: (id: number) => boolean;
  toggleCompare: (item: TravelItem) => { added: boolean; limitReached: boolean };
  clearCompare: () => void;
};

type WishlistResponse = {
  items?: TravelItem[];
  data?: TravelItem[];
};

const TravelStoreContext = createContext<TravelStore | null>(null);

export function TravelStoreProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, loading: authLoading, user } = useAuthContext();
  const [hydrated, setHydrated] = useState(false);
  const [wishlist, setWishlist] = useState<TravelItem[]>([]);
  const [compareList, setCompareList] = useState<TravelItem[]>([]);
  const roleSlug = user?.role?.slug ?? "";
  const canUseRemoteWishlist = isLoggedIn && ["customer", "agent", "agent-reseller"].includes(roleSlug);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
      if (raw) setCompareList(JSON.parse(raw));
    } catch {
      // ignore malformed/inaccessible storage
    }
  }, []);

  const toggleCompare = useCallback((item: TravelItem) => {
    const exists = compareList.some((saved) => saved.id === item.id);
    if (!exists && compareList.length >= MAX_COMPARE_ITEMS) {
      return { added: false, limitReached: true };
    }
    const next = exists ? compareList.filter((saved) => saved.id !== item.id) : [...compareList, item];
    setCompareList(next);
    try {
      window.localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore write failures (private browsing, quota, etc.)
    }
    return { added: !exists, limitReached: false };
  }, [compareList]);

  const clearCompare = useCallback(() => {
    setCompareList([]);
    try {
      window.localStorage.removeItem(COMPARE_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!canUseRemoteWishlist) {
      setWishlist(readLocalWishlist());
      setHydrated(true);
      return;
    }

    let active = true;
    setHydrated(false);

    // A guest wishlist may have been built up before logging in - merge it
    // into the account once, then it's the server copy from here on.
    const local = readLocalWishlist();
    // Keep any item whose individual merge request failed.  Clearing the
    // guest store after Promise.all previously made a transient failure lose
    // that item permanently when the following GET succeeded.
    const merge = local.length
      ? Promise.allSettled(local.map((item) => api.post(`/wishlist/${item.id}`)))
      : Promise.resolve([]);

    merge
      .then((results) => api.get<WishlistResponse>("/wishlist").then((response) => ({ response, results })))
      .then(({ response, results }) => {
        if (!active) return;
        setWishlist(response.data.items ?? response.data.data ?? []);
        const failedIds = new Set(
          results.flatMap((result, index) => result.status === "rejected" && local[index]
            ? [local[index].id]
            : []),
        );
        writeLocalWishlist(local.filter((item) => failedIds.has(item.id)));
      })
      .catch(() => {
        // The remote list was unavailable; preserve the guest copy in both
        // storage and UI so a later authenticated render can retry the merge.
        if (active) setWishlist(local);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [authLoading, canUseRemoteWishlist, user?.id]);

  const toggleWishlist = useCallback((item: TravelItem) => {
    if (!canUseRemoteWishlist) {
      const wasSaved = wishlist.some((saved) => saved.id === item.id);
      const next = wasSaved
        ? wishlist.filter((saved) => saved.id !== item.id)
        : [item, ...wishlist.filter((saved) => saved.id !== item.id)];
      setWishlist(next);
      writeLocalWishlist(next);
      return;
    }

    const wasSaved = wishlist.some((saved) => saved.id === item.id);
    setWishlist((current) => (
      wasSaved
        ? current.filter((saved) => saved.id !== item.id)
        : [item, ...current.filter((saved) => saved.id !== item.id)]
    ));

    const request = wasSaved
      ? api.delete(`/wishlist/${item.id}`)
      : api.post(`/wishlist/${item.id}`);

    void request.catch(() => {
      setWishlist((current) => (
        wasSaved
          ? current.some((saved) => saved.id === item.id) ? current : [item, ...current]
          : current.filter((saved) => saved.id !== item.id)
      ));
    });
  }, [canUseRemoteWishlist, wishlist]);

  const value = useMemo<TravelStore>(() => ({
    hydrated,
    wishlist,
    wishlistCount: wishlist.length,
    isWishlisted: (id) => wishlist.some((item) => item.id === id),
    toggleWishlist,
    compareList,
    compareCount: compareList.length,
    isCompared: (id) => compareList.some((item) => item.id === id),
    toggleCompare,
    clearCompare,
  }), [hydrated, wishlist, toggleWishlist, compareList, toggleCompare, clearCompare]);

  return <TravelStoreContext.Provider value={value}>{children}</TravelStoreContext.Provider>;
}

export function useTravelStore() {
  const store = useContext(TravelStoreContext);
  if (!store) throw new Error("useTravelStore must be used inside TravelStoreProvider");
  return store;
}
