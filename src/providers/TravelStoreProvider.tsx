"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

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

export type CartItem = TravelItem & { travellers: number };

type TravelStore = {
  hydrated: boolean;
  wishlist: TravelItem[];
  cart: CartItem[];
  wishlistCount: number;
  cartCount: number;
  isWishlisted: (id: number) => boolean;
  toggleWishlist: (item: TravelItem) => void;
  addToCart: (item: TravelItem, travellers?: number) => void;
  removeFromCart: (id: number) => void;
  updateTravellers: (id: number, travellers: number) => void;
  clearCart: () => void;
};

const WISHLIST_KEY = "tourvaa_public_wishlist";
const CART_KEY = "tourvaa_public_cart";
const TravelStoreContext = createContext<TravelStore | null>(null);

function readStored<T>(key: string): T[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function TravelStoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [wishlist, setWishlist] = useState<TravelItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setWishlist(readStored<TravelItem>(WISHLIST_KEY));
    setCart(readStored<CartItem>(CART_KEY));
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); }, [hydrated, wishlist]);
  useEffect(() => { if (hydrated) window.localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [hydrated, cart]);

  const value = useMemo<TravelStore>(() => ({
    hydrated,
    wishlist,
    cart,
    wishlistCount: wishlist.length,
    cartCount: cart.reduce((total, item) => total + item.travellers, 0),
    isWishlisted: (id) => wishlist.some((item) => item.id === id),
    toggleWishlist: (item) => setWishlist((current) => current.some((saved) => saved.id === item.id) ? current.filter((saved) => saved.id !== item.id) : [item, ...current]),
    addToCart: (item, travellers = 1) => setCart((current) => {
      const existing = current.find((saved) => saved.id === item.id);
      if (!existing) return [{ ...item, travellers: Math.max(1, travellers) }, ...current];
      return current.map((saved) => saved.id === item.id ? { ...saved, travellers: Math.min(20, saved.travellers + Math.max(1, travellers)) } : saved);
    }),
    removeFromCart: (id) => setCart((current) => current.filter((item) => item.id !== id)),
    updateTravellers: (id, travellers) => setCart((current) => current.map((item) => item.id === id ? { ...item, travellers: Math.max(1, Math.min(20, travellers)) } : item)),
    clearCart: () => setCart([]),
  }), [hydrated, wishlist, cart]);

  return <TravelStoreContext.Provider value={value}>{children}</TravelStoreContext.Provider>;
}

export function useTravelStore() {
  const store = useContext(TravelStoreContext);
  if (!store) throw new Error("useTravelStore must be used inside TravelStoreProvider");
  return store;
}
