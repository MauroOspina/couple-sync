import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

import type { Purchase } from '@/domain/purchases';
import { useSyncedCollection } from '@/hooks/use-synced-collection';
import { createId } from '@/lib/id';
import { useSession } from '@/providers/session-provider';
import { purchasesAdapter } from '@/services/purchases';

interface PurchasesContextValue {
  /** Del más reciente al más viejo. */
  purchases: Purchase[];
  ready: boolean;
  addPurchase: (items: string[], total: number | null) => Purchase;
  deletePurchase: (id: string) => void;
}

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

/** Historial de compras: un registro por cada "Terminar mercado". */
export function PurchasesProvider({ children }: PropsWithChildren) {
  const { household } = useSession();
  const { items, ready, save, remove } = useSyncedCollection(purchasesAdapter, household?.id ?? null);

  const value = useMemo<PurchasesContextValue>(
    () => ({
      purchases: [...items].sort((a, b) => b.boughtAt.localeCompare(a.boughtAt)),
      ready,
      addPurchase: (purchaseItems, total) => {
        const purchase: Purchase = { id: createId(), boughtAt: new Date().toISOString(), total, items: purchaseItems };
        save(purchase);
        return purchase;
      },
      deletePurchase: id => remove(id),
    }),
    [items, ready, save, remove],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases(): PurchasesContextValue {
  const context = useContext(PurchasesContext);
  if (!context) throw new Error('usePurchases debe usarse dentro de <PurchasesProvider>');
  return context;
}
