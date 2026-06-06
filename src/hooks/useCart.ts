"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

import { eden } from "@/lib/eden";
import { useAuth } from "./useAuth";

const LOCAL_CART_KEY = "makmur_farma_cart";

export type LocalCartItem = {
  medicineId: string;
  name: string;
  price: number;
  quantity: number;
  prescriptionRequired: boolean;
  unit: string;
};

export function getLocalCart(): LocalCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(LOCAL_CART_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

const CART_UPDATE_EVENT = "makmur:cart-update";

export function saveLocalCart(items: LocalCartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(CART_UPDATE_EVENT));
}

export function clearLocalCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LOCAL_CART_KEY);
  window.dispatchEvent(new CustomEvent(CART_UPDATE_EVENT));
}

/**
 * Universal cart hook that handles both Guest (Local Storage) and Authenticated (API) states.
 */
export function useCart() {
  const { data: auth, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [localItems, setLocalItems] = useState<LocalCartItem[]>(getLocalCart);

  const isAuthenticated = !!auth?.user;

  // Keep guest cart in sync across all useCart instances on the same page.
  useEffect(() => {
    if (isAuthenticated) return;

    const sync = () => setLocalItems(getLocalCart());
    window.addEventListener(CART_UPDATE_EVENT, sync);
    return () => window.removeEventListener(CART_UPDATE_EVENT, sync);
  }, [isAuthenticated]);

  // Server cart query
  const serverCartQuery = useQuery({
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await eden.api.v1.cart.get();
      if (response.error) throw response.error;
      return response.data;
    },
    queryKey: ["cart"],
  });

  const addItemMutation = useMutation({
    mutationFn: async (item: { medicineId: string; quantity: number; name: string; price: number; prescriptionRequired: boolean; unit: string }) => {
      if (isAuthenticated) {
        const response = await eden.api.v1.cart.items.post({
          medicineId: item.medicineId,
          quantity: item.quantity,
        });
        if (response.error) throw response.error;
        return response.data;
      } else {
        const current = getLocalCart();
        const existing = current.find((i) => i.medicineId === item.medicineId);
        let updated;
        if (existing) {
          updated = current.map((i) =>
            i.medicineId === item.medicineId
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          );
        } else {
          updated = [...current, { ...item }];
        }
        saveLocalCart(updated);
        setLocalItems(updated);
        return updated;
      }
    },
    onSuccess: () => {
      if (isAuthenticated) queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ medicineId, quantity, itemId }: { medicineId: string; quantity: number; itemId?: string }) => {
      if (isAuthenticated && itemId) {
        const response = await eden.api.v1.cart.items({ itemId }).put({ quantity });
        if (response.error) throw response.error;
        return response.data;
      } else {
        const current = getLocalCart();
        const updated = current.map((i) =>
          i.medicineId === medicineId ? { ...i, quantity } : i
        );
        saveLocalCart(updated);
        setLocalItems(updated);
        return updated;
      }
    },
    onSuccess: () => {
      if (isAuthenticated) queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: async ({ medicineId, itemId }: { medicineId: string; itemId?: string }) => {
      if (isAuthenticated && itemId) {
        const response = await eden.api.v1.cart.items({ itemId }).delete();
        if (response.error) throw response.error;
        return response.data;
      } else {
        const current = getLocalCart();
        const updated = current.filter((i) => i.medicineId !== medicineId);
        saveLocalCart(updated);
        setLocalItems(updated);
        return updated;
      }
    },
    onSuccess: () => {
      if (isAuthenticated) queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        const response = await eden.api.v1.cart.delete();
        if (response.error) throw response.error;
        return response.data;
      } else {
        clearLocalCart();
        setLocalItems([]);
        return [];
      }
    },
    onSuccess: () => {
      if (isAuthenticated) queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const mergeMutation = useMutation({
    mutationFn: async () => {
      const items = getLocalCart();
      if (items.length === 0 || !isAuthenticated) return;

      const response = await eden.api.v1.cart.merge.post({
        items: items.map((i) => ({
          medicineId: i.medicineId,
          quantity: i.quantity,
        })),
      });

      if (response.error) throw response.error;

      clearLocalCart();
      setLocalItems([]);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  return {
    addItem: addItemMutation.mutateAsync,
    clearCart: clearCartMutation.mutateAsync,
    isAuthenticated,
    isLoading: authLoading || (isAuthenticated && serverCartQuery.isLoading),
    items: isAuthenticated 
      ? (serverCartQuery.data?.items ?? []).map((i: any) => ({
          itemId: i.id,
          medicineId: i.medicine.id,
          name: i.medicine.name,
          prescriptionRequired: i.medicine.prescriptionRequired,
          price: Number(i.medicine.sellingPrice),
          quantity: i.quantity,
          unit: i.medicine.unit,
        }))
      : localItems,
    mergeCart: mergeMutation.mutateAsync,
    removeItem: removeItemMutation.mutateAsync,
    updateQuantity: updateQuantityMutation.mutateAsync,
  };
}

/**
 * Hook to automatically merge local cart into server cart upon login.
 */
export function useCartSync() {
  const { isAuthenticated, mergeCart } = useCart();
  const syncedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated && !syncedRef.current) {
      const local = getLocalCart();
      if (local.length > 0) {
        mergeCart().then(() => {
          syncedRef.current = true;
        }).catch(console.error);
      } else {
        syncedRef.current = true;
      }
    }
    if (!isAuthenticated) {
      syncedRef.current = false;
    }
  }, [isAuthenticated, mergeCart]);
}
