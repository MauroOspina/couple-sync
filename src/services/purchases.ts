import type { Purchase } from '@/domain/purchases';
import { asyncStorageCache, type CollectionAdapter } from '@/services/collection';
import { asNullableString, asString, asStringArray } from '@/services/rows';

/** `numeric` puede llegar como número o como texto según el cliente. */
function asNullableAmount(value: unknown): number | null {
  const amount = typeof value === 'string' ? Number(value) : value;
  return typeof amount === 'number' && Number.isFinite(amount) ? amount : null;
}

export const purchasesAdapter: CollectionAdapter<Purchase> = {
  table: 'purchases',
  fromRow: row => ({
    id: asString(row.id),
    boughtAt: asString(row.bought_at),
    total: asNullableAmount(row.total),
    items: asStringArray(row.items),
    updatedAt: asNullableString(row.updated_at),
  }),
  toRow: (purchase, householdId) => ({
    id: purchase.id,
    household_id: householdId,
    bought_at: purchase.boughtAt,
    total: purchase.total,
    items: purchase.items,
    updated_at: purchase.updatedAt ?? new Date().toISOString(),
  }),
  ...asyncStorageCache<Purchase>('purchases'),
};
