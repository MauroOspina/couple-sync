import type { User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

import { clearAppStorage, readJSON, removeKey, storageKey, writeJSON } from '@/lib/storage';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import * as authService from '@/services/auth';
import { LOCAL_SCOPE } from '@/services/collection';
import * as householdsService from '@/services/households';
import type { Household, HouseholdMember } from '@/services/households';
import { deleteLegacyProducts } from '@/services/products';

/** loading → splash · signedOut → login · needsHousehold → crear/unirse · ready → pestañas */
export type SessionStatus = 'loading' | 'signedOut' | 'needsHousehold' | 'ready';

interface SessionContextValue {
  status: SessionStatus;
  user: User | null;
  isGuest: boolean;
  displayName: string;
  household: Household | null;
  /** No se pudo consultar el hogar (sin conexión) y no había copia local. */
  householdError: boolean;
  members: HouseholdMember[];
  /** "Tú", el nombre de la pareja o "Cualquiera" si es `null`. */
  memberName: (userId: string | null) => string;
  signInWithGoogle: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  exitGuestMode: () => Promise<void>;
  signOut: () => Promise<void>;
  createHousehold: (name: string) => Promise<Household>;
  joinHousehold: (code: string) => Promise<Household>;
  leaveHousehold: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  retryHousehold: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

const GUEST_KEY = storageKey('guest');
const householdKey = (userId: string) => storageKey('household', userId);
const membersKey = (householdId: string) => storageKey('members', householdId);

interface HouseholdState {
  userId: string | null;
  household: Household | null;
  loaded: boolean;
  error: boolean;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [guest, setGuest] = useState({ loaded: !isSupabaseConfigured, value: !isSupabaseConfigured });
  const [householdState, setHouseholdState] = useState<HouseholdState>({
    userId: null,
    household: null,
    loaded: false,
    error: false,
  });
  const [membersState, setMembersState] = useState<{ householdId: string | null; members: HouseholdMember[] }>({
    householdId: null,
    members: [],
  });
  const [householdAttempt, setHouseholdAttempt] = useState(0);

  // Sesión guardada: Supabase emite INITIAL_SESSION desde el almacenamiento, sin esperar red.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    void readJSON<boolean>(GUEST_KEY).then(value => {
      if (!cancelled) setGuest({ loaded: true, value: value === true });
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthReady(true);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const userId = user?.id ?? null;

  // Hogar: primero la copia local (funciona sin señal), luego el servidor.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const load = async () => {
      const cached = await readJSON<Household>(householdKey(userId));
      if (cancelled) return;
      if (cached) setHouseholdState({ userId, household: cached, loaded: true, error: false });
      try {
        const fresh = await householdsService.fetchUserHousehold(userId);
        if (cancelled) return;
        setHouseholdState({ userId, household: fresh, loaded: true, error: false });
        if (fresh) await writeJSON(householdKey(userId), fresh);
        else await removeKey(householdKey(userId));
      } catch (error) {
        console.warn('[session] No se pudo consultar el hogar', error);
        if (!cancelled && !cached) setHouseholdState({ userId, household: null, loaded: true, error: true });
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [userId, householdAttempt]);

  const householdLoaded = userId !== null && householdState.userId === userId && householdState.loaded;
  const household = householdLoaded ? householdState.household : null;
  const householdId = household?.id ?? null;

  // Miembros: copia local primero, luego el servidor, y en vivo cuando alguien entra o sale.
  useEffect(() => {
    if (!householdId) return;
    let cancelled = false;
    const loadCached = async () => {
      const cached = await readJSON<HouseholdMember[]>(membersKey(householdId));
      if (cancelled || !cached) return;
      setMembersState(prev => (prev.householdId === householdId ? prev : { householdId, members: cached }));
    };
    const loadFresh = async () => {
      try {
        const list = await householdsService.fetchMembers(householdId);
        if (cancelled) return;
        setMembersState({ householdId, members: list });
        await writeJSON(membersKey(householdId), list);
      } catch (error) {
        console.warn('[session] No se pudieron cargar los miembros', error);
      }
    };
    void loadCached();
    void loadFresh();
    const unsubscribe = householdsService.subscribeToMembers(householdId, () => {
      void loadFresh();
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [householdId]);

  const members = useMemo(
    () => (membersState.householdId === householdId ? membersState.members : []),
    [membersState, householdId],
  );

  let status: SessionStatus;
  if (!authReady || !guest.loaded) status = 'loading';
  else if (user) status = !householdLoaded ? 'loading' : household ? 'ready' : 'needsHousehold';
  else status = guest.value ? 'ready' : 'signedOut';

  const setGuestMode = useCallback(async (value: boolean) => {
    setGuest({ loaded: true, value });
    if (value) await writeJSON(GUEST_KEY, true);
    else await removeKey(GUEST_KEY);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const signedIn = await authService.signInWithGoogle();
    if (!signedIn) return;
    setUser(signedIn);
    await setGuestMode(false);
  }, [setGuestMode]);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
    // Se conservan los datos del modo local; se borra lo del hogar.
    await clearAppStorage(key => key.endsWith(`:${LOCAL_SCOPE}`));
    await setGuestMode(false);
  }, [setGuestMode]);

  const saveHousehold = useCallback(async (owner: User, value: Household) => {
    setHouseholdState({ userId: owner.id, household: value, loaded: true, error: false });
    await writeJSON(householdKey(owner.id), value);
  }, []);

  const createHousehold = useCallback(
    async (name: string) => {
      if (!user) throw new Error('Inicia sesión para crear un hogar.');
      const created = await householdsService.createHousehold(name, user);
      await saveHousehold(user, created);
      return created;
    },
    [user, saveHousehold],
  );

  const joinHousehold = useCallback(
    async (code: string) => {
      if (!user) throw new Error('Inicia sesión para unirte a un hogar.');
      const joined = await householdsService.joinHousehold(code);
      await saveHousehold(user, joined);
      return joined;
    },
    [user, saveHousehold],
  );

  const leaveHousehold = useCallback(async () => {
    if (!user || !household) return;
    await householdsService.leaveHousehold(household.id, user.id);
    setHouseholdState({ userId: user.id, household: null, loaded: true, error: false });
    await clearAppStorage(key => !key.includes(household.id) && key !== householdKey(user.id));
  }, [user, household]);

  const deleteAccount = useCallback(async () => {
    await authService.deleteAccount();
    await authService.signOut();
    setUser(null);
    await clearAppStorage();
    await deleteLegacyProducts();
    setGuest({ loaded: true, value: false });
  }, []);

  const memberName = useCallback(
    (id: string | null) => {
      if (!id) return 'Cualquiera';
      if (id === userId) return 'Tú';
      const member = members.find(item => item.userId === id);
      return member ? member.name.split(/\s+/)[0] : 'Pareja';
    },
    [members, userId],
  );

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      user,
      isGuest: !user && guest.value,
      displayName: authService.getDisplayName(user),
      household,
      householdError: householdLoaded && householdState.error,
      members,
      memberName,
      signInWithGoogle,
      continueAsGuest: () => setGuestMode(true),
      exitGuestMode: () => setGuestMode(false),
      signOut,
      createHousehold,
      joinHousehold,
      leaveHousehold,
      deleteAccount,
      retryHousehold: () => setHouseholdAttempt(attempt => attempt + 1),
    }),
    [
      status,
      user,
      guest.value,
      household,
      householdLoaded,
      householdState.error,
      members,
      memberName,
      signInWithGoogle,
      setGuestMode,
      signOut,
      createHousehold,
      joinHousehold,
      leaveHousehold,
      deleteAccount,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession debe usarse dentro de <SessionProvider>');
  return context;
}
