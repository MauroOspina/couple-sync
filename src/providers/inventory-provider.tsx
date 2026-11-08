import { createContext, useContext, useMemo, type PropsWithChildren } from 'react';

import {
  finishShopping,
  findProduct,
  guessCategory,
  isNeeded,
  NEXT_STATUS,
  type Product,
  type StockStatus,
} from '@/domain/inventory';
import { capitalize, cleanIngredientName, matchKey } from '@/domain/text';
import { useSyncedCollection } from '@/hooks/use-synced-collection';
import { createId } from '@/lib/id';
import { useSession } from '@/providers/session-provider';
import { productsAdapter } from '@/services/products';

interface InventoryContextValue {
  products: Product[];
  ready: boolean;
  pendingCount: number;
  /** Productos en "Queda poco" o "Falta" (la lista del mercado). */
  neededCount: number;
  /** Si ya existe un producto con ese nombre, lo devuelve en vez de duplicarlo. */
  addProduct: (name: string, category?: string, status?: StockStatus) => Product | null;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  cycleStatus: (id: string) => void;
  setStatus: (id: string, status: StockStatus) => void;
  toggleCart: (id: string) => void;
  /** Lo del carrito pasa a "Hay". Devuelve cuántos productos se compraron. */
  finishShopping: () => number;
  /** Crea en "Falta" los ingredientes que no están en la despensa. Devuelve cuántos agregó. */
  addMissingToMarket: (ingredients: string[]) => number;
  refresh: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: PropsWithChildren) {
  const { household } = useSession();
  const { items: products, ready, pendingCount, save, remove, refresh } = useSyncedCollection(
    productsAdapter,
    household?.id ?? null,
  );

  const value = useMemo<InventoryContextValue>(() => {
    const byId = (id: string) => products.find(product => product.id === id);

    const createProduct = (name: string, category: string | undefined, status: StockStatus): Product => ({
      id: createId(),
      name,
      category: category ?? guessCategory(name),
      status,
      inCart: false,
    });

    return {
      products,
      ready,
      pendingCount,
      neededCount: products.filter(isNeeded).length,
      addProduct: (rawName, category, status = 'ok') => {
        const name = capitalize(rawName);
        if (!name) return null;
        const duplicate = products.find(product => matchKey(product.name) === matchKey(name));
        if (duplicate) {
          if (status !== 'ok' && duplicate.status !== status) save({ ...duplicate, status });
          return duplicate;
        }
        const product = createProduct(name, category, status);
        save(product);
        return product;
      },
      updateProduct: product => save(product),
      deleteProduct: id => remove(id),
      cycleStatus: id => {
        const product = byId(id);
        if (!product) return;
        const status = NEXT_STATUS[product.status];
        save({ ...product, status, inCart: status === 'ok' ? false : product.inCart });
      },
      setStatus: (id, status) => {
        const product = byId(id);
        if (product && product.status !== status) save({ ...product, status, inCart: status === 'ok' ? false : product.inCart });
      },
      toggleCart: id => {
        const product = byId(id);
        if (product) save({ ...product, inCart: !product.inCart });
      },
      finishShopping: () => {
        const bought = finishShopping(products);
        save(bought);
        return bought.length;
      },
      addMissingToMarket: ingredients => {
        const created: Product[] = [];
        for (const ingredient of ingredients) {
          const name = cleanIngredientName(ingredient);
          if (!name || findProduct([...products, ...created], name)) continue;
          created.push(createProduct(name, undefined, 'out'));
        }
        save(created);
        return created.length;
      },
      refresh,
    };
  }, [products, ready, pendingCount, save, remove, refresh]);

  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory(): InventoryContextValue {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory debe usarse dentro de <InventoryProvider>');
  return context;
}
