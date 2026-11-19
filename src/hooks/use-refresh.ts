import { useCallback, useState } from 'react';

/** Estado para "jalar para recargar": muestra el indicador mientras corre `refresh`. */
export function useRefresh(refresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refresh()
      .catch(() => undefined) // Sin conexión: la lista sigue con lo guardado y se sincroniza después.
      .finally(() => setRefreshing(false));
  }, [refresh]);

  return { refreshing, onRefresh };
}
