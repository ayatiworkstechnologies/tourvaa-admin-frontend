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

type TravelStore = {
  hydrated: boolean;
  wishlist: TravelItem[];
  wishlistCount: number;
  isWishlisted: (id: number) => boolean;
  toggleWishlist: (item: TravelItem) => void;
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
  const roleSlug = user?.role?.slug ?? "";
  const canUseWishlist = isLoggedIn && roleSlug === "customer";

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
  }), [hydrated, toggleWishlist, wishlist]);

  return <TravelStoreContext.Provider value={value}>{children}</TravelStoreContext.Provider>;
}

export function useTravelStore() {
  const store = useContext(TravelStoreContext);
  if (!store) throw new Error("useTravelStore must be used inside TravelStoreProvider");
  return store;
}
