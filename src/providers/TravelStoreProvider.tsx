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
  const canUseWishlist = isLoggedIn && roleSlug === "customer";

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

    if (!canUseWishlist) {
      setWishlist([]);
      setHydrated(true);
      return;
    }

    let active = true;
    setHydrated(false);
    api.get<WishlistResponse>("/customer/wishlist")
      .then((response) => {
        if (!active) return;
        setWishlist(response.data.items ?? response.data.data ?? []);
      })
      .catch(() => {
        if (active) setWishlist([]);
      })
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [authLoading, canUseWishlist, user?.id]);

  const toggleWishlist = useCallback((item: TravelItem) => {
    if (!canUseWishlist) {
      const returnPath = `${window.location.pathname}${window.location.search}`;
      window.location.assign(`/login?role=traveller&redirect=${encodeURIComponent(returnPath)}`);
      return;
    }

    const wasSaved = wishlist.some((saved) => saved.id === item.id);
    setWishlist((current) => (
      wasSaved
        ? current.filter((saved) => saved.id !== item.id)
        : [item, ...current.filter((saved) => saved.id !== item.id)]
    ));

    const request = wasSaved
      ? api.delete(`/customer/wishlist/${item.id}`)
      : api.post(`/customer/wishlist/${item.id}`);

    void request.catch(() => {
      setWishlist((current) => (
        wasSaved
          ? current.some((saved) => saved.id === item.id) ? current : [item, ...current]
          : current.filter((saved) => saved.id !== item.id)
      ));
    });
  }, [canUseWishlist, wishlist]);

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
