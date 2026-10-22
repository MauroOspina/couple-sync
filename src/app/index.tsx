import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { User } from '@supabase/supabase-js';
import {
  Product,
  StockStatus,
  loadLocalProducts,
  saveLocalProducts,
  fetchRemoteProducts,
  upsertRemoteProduct,
  upsertBatchRemoteProducts,
  subscribeToHousehold
} from '../services/inventorySync';
import {
  signInWithGoogle,
  getCurrentUser,
  signOut,
  getUserHousehold,
  createHousehold,
  joinHouseholdByCode,
  getHouseholdMembers,
  Household,
  HouseholdMember
} from '../services/authService';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const statusConfig = {
  ok: { label: '✅ Hay', color: '#10B981', bgColor: '#D1FAE5' },
  low: { label: '⚠️ Queda', color: '#F59E0B', bgColor: '#FEF3C7' },
  out: { label: '❌ Falta', color: '#EF4444', bgColor: '#FEE2E2' },
};

const CATEGORIES: Record<string, string> = {
  'Aseo Hogar': '🧹',
  'Aseo Personal': '🧼',
  'Bebidas': '🍺',
  'Carnes y Embutidos': '🥩',
  'Congelados': '🧊',
  'Despensa y Salsas': '🥫',
  'Dulces y Desayuno': '🍪',
  'Farmacia': '💊',
  'Frutas': '🍎',
  'Lácteos y Huevos': '🧀',
  'Mascotas': '🐈',
  'Panadería y Arepas': '🍞',
  'Pastas': '🍝',
  'Snacks y Pasabocas': '🥜',
  'Verduras y Vegetales': '🥦',
  'Otros': '📦'
};

const rawData = [
  { c: 'Despensa y Salsas', items: ['Aceite oliva', 'Ajo Molido', 'Arroz premium', 'Atún', 'Atunes personal', 'Canela molida', 'Escencia de vainilla', 'Garbanzos', 'Mayonesa', 'Pesto', 'Pimienta Negra Granulada', 'Salero', 'Salsa Chipotle', 'Salsa Showy', 'Salsa Soya', 'Salsa ajo', 'Salsa negra', 'Stevia', 'Zumo limón'] },
  { c: 'Panadería y Arepas', items: ['Arepas', 'Arepas de yuca', 'Pan tajado Bimbo', 'Pan tajado mantequilla', 'Pancitos mantequilla', 'Tortillas', 'Tostadas'] },
  { c: 'Pastas', items: ['Pastas conchas', 'Spaguetti'] },
  { c: 'Verduras y Vegetales', items: ['Aceituna', 'Brocoli', 'Champiñones enteros', 'Champiñones tajados', 'Mix arverja y zanahoria', 'Zanahoria'] },
  { c: 'Frutas', items: ['Aguacate', 'Aguacate Haas', 'Banano', 'Limón Tahití', 'Limón mandarino', 'Mango', 'Pitaya'] },
  { c: 'Carnes y Embutidos', items: ['Alitas pollo', 'Carne molida', 'Chicharrones', 'Chorizos Santarrosanos', 'Jamón', 'Jamón Serrano', 'Lomo cerdo', 'Lomo res', 'Salchichas Rancheras', 'Tocineta'] },
  { c: 'Congelados', items: ['Papa congelada', 'Yucas congeladas'] },
  { c: 'Bebidas', items: ['Bretaña', 'Cerveza Stella', 'Club Trigo', 'Infusión frutos rojos', 'Jugo naranja', 'Soda', 'Soda Frescampo'] },
  { c: 'Lácteos y Huevos', items: ['Esparcible Rama', 'Huevos', 'La Fina', 'Leche en polvo', 'Leche entera', 'Mantequilla Colanta con sal', 'Queso campesino', 'Queso crema', 'Queso cuajada', 'Queso mozarellla', 'Queso siete cueros', 'Six pack yogurt'] },
  { c: 'Dulces y Desayuno', items: ['Brownies', 'Café liofilizado', 'Cocoa', 'Crema maní', 'Crispetas', 'Ducales', 'Galletas chip', 'Galletas mantequilla', 'Gansitos', 'Leche condensada', 'Mermelada', 'Mezcla pancakes', 'Miel', 'Panela', 'Panela en polvo'] },
  { c: 'Snacks y Pasabocas', items: ['Doritos', 'Mani salado', 'Maní uvas pasas', 'Marañones', 'Mix maní', 'Papas paquete', 'Papas receta clásica', 'Tostacos'] },
  { c: 'Mascotas', items: ['Arena gatos', 'Arena gatos Carbón', 'Don Kat', 'Whiskas'] },
  { c: 'Farmacia', items: ['Advil', 'Aspirina efervescente', 'Noravert'] },
  { c: 'Aseo Personal', items: ['Crema dental', 'Jabon lavamanos espumoso', 'Jabón Protex', 'Jabón antibacterial', 'Papel Familia deluxe', 'Papel extra suave', 'Pañitos', 'Protectores', 'Shampoo'] },
  { c: 'Aseo Hogar', items: ['Bolsas basura', 'Detergente líquido', 'Detergente polvo', 'Esponjas', 'Jabón Loza', 'Límpido', 'Papel aluminio', 'Servilletas', 'Toallas cocina', 'Trampa Raid'] }
];

let globalId = 1;
const initialProducts: Product[] = [];
rawData.forEach(categoryGroup => {
  const sortedItems = [...categoryGroup.items].sort();
  sortedItems.forEach(name => {
    initialProducts.push({
      id: (globalId++).toString(),
      name,
      category: categoryGroup.c,
      status: 'ok',
      inCart: false
    });
  });
});

const createProductId = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export default function AppMainScreen() {
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [household, setHousehold] = useState<Household | null>(null);

  // Estados para creación / unión de hogar
  const [newHouseholdName, setNewHouseholdName] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [householdActionLoading, setHouseholdActionLoading] = useState(false);

  // Estados del inventario
  const [products, setProducts] = useState<Product[]>([]);
  const [isInventoryLoaded, setIsInventoryLoaded] = useState(false);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [isMarketMode, setIsMarketMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Modal de detalles del Hogar
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [members, setMembers] = useState<HouseholdMember[]>([]);

  // 1. Verificar sesión activa
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (!isSupabaseConfigured) {
          setIsGuest(true);
          setAuthLoading(false);
          return;
        }

        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
          const userHousehold = await getUserHousehold(user.id);
          setHousehold(userHousehold);
        }
      } catch (e) {
        console.warn('⚠️ Error al verificar sesión:', e);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setCurrentUser(session.user);
          const userHousehold = await getUserHousehold(session.user.id);
          setHousehold(userHousehold);
        } else {
          setCurrentUser(null);
          setHousehold(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  // 2. Cargar inventario y sincronizar en tiempo real cuando hay hogar activo o modo local
  useEffect(() => {
    if (authLoading) return;
    if (!currentUser && !isGuest) return;
    if (currentUser && !household) return;

    let unsubscribe: (() => void) | undefined;

    const setupInventory = async () => {
      setIsInventoryLoaded(false);
      const localData = await loadLocalProducts(initialProducts);
      setProducts(localData);
      setIsInventoryLoaded(true);

      if (isSupabaseConfigured && household) {
        const remoteData = await fetchRemoteProducts(household.id);
        if (remoteData && remoteData.length > 0) {
          setProducts(remoteData);
          await saveLocalProducts(remoteData);
        } else if (remoteData && remoteData.length === 0) {
          await upsertBatchRemoteProducts(localData, household.id);
        }

        unsubscribe = subscribeToHousehold(household.id, remoteProduct => {
          setProducts(prev => {
            const exists = prev.some(p => p.id === remoteProduct.id);
            let updated: Product[];
            if (exists) {
              updated = prev.map(p => (p.id === remoteProduct.id ? remoteProduct : p));
            } else {
              updated = [remoteProduct, ...prev];
            }
            saveLocalProducts(updated);
            return updated;
          });
        });
      }
    };

    setupInventory();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [authLoading, currentUser, isGuest, household]);

  // Cargar lista de miembros cuando se abre el modal
  const openHouseholdModal = useCallback(async () => {
    setShowHouseholdModal(true);
    if (household?.id) {
      const list = await getHouseholdMembers(household.id);
      setMembers(list);
    }
  }, [household]);

  // Iniciar sesión con Google
  const handleGoogleLogin = async () => {
    try {
      setAuthLoading(true);
      const user = await signInWithGoogle();
      if (user) {
        setCurrentUser(user);
        const house = await getUserHousehold(user.id);
        setHousehold(house);
      }
    } catch (e: any) {
      Alert.alert('Inicio de sesión', e.message || 'No se pudo iniciar sesión con Google.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Crear un nuevo hogar
  const handleCreateHousehold = async () => {
    if (!currentUser) return;
    if (!newHouseholdName.trim()) {
      Alert.alert('Nombre requerido', 'Ingresa un nombre para tu nuevo hogar.');
      return;
    }

    try {
      setHouseholdActionLoading(true);
      const created = await createHousehold(newHouseholdName, currentUser);
      setHousehold(created);
      Alert.alert(
        '¡Hogar Creado con Éxito! 🎉',
        `Comparte este código con tu pareja para sincronizarse:\n\n${created.invite_code}`
      );
    } catch (e: any) {
      Alert.alert('Error al crear hogar', e.message || 'Ocurrió un error al crear el hogar.');
    } finally {
      setHouseholdActionLoading(false);
    }
  };

  // Unirse a un hogar con código
  const handleJoinHousehold = async () => {
    if (!currentUser) return;
    if (!joinInviteCode.trim()) {
      Alert.alert('Código requerido', 'Ingresa el código que te compartió tu pareja.');
      return;
    }

    try {
      setHouseholdActionLoading(true);
      const joined = await joinHouseholdByCode(joinInviteCode, currentUser);
      setHousehold(joined);
      Alert.alert('¡Te uniste con éxito! 💑', `Ahora compartes "${joined.name}" con tu pareja.`);
    } catch (e: any) {
      Alert.alert('No se pudo unir', e.message || 'Verifica el código e inténtalo de nuevo.');
    } finally {
      setHouseholdActionLoading(false);
    }
  };

  // Cerrar sesión
  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
    setHousehold(null);
    setIsGuest(false);
    setShowHouseholdModal(false);
  };

  // Acciones sobre el inventario
  const saveAndSync = (newProducts: Product[], updatedSingle?: Product) => {
    setProducts(newProducts);
    saveLocalProducts(newProducts);

    if (isSupabaseConfigured && household) {
      if (updatedSingle) {
        upsertRemoteProduct(updatedSingle, household.id);
      } else {
        upsertBatchRemoteProducts(newProducts, household.id);
      }
    }
  };

  const addProduct = () => {
    if (text.trim().length > 0) {
      const newProduct: Product = {
        id: createProductId(),
        name: text.trim(),
        category: selectedCategory || 'Otros',
        status: 'ok',
        inCart: false
      };
      saveAndSync([newProduct, ...products], newProduct);
      setText('');
    }
  };

  const cycleStatus = (id: string, currentStatus: StockStatus) => {
    const nextStatus: Record<StockStatus, StockStatus> = {
      ok: 'low',
      low: 'out',
      out: 'ok'
    };
    const target = products.find(p => p.id === id);
    if (!target) return;

    const updatedTarget: Product = { ...target, status: nextStatus[currentStatus] };
    const nextList = products.map(p => (p.id === id ? updatedTarget : p));
    saveAndSync(nextList, updatedTarget);
  };

  const toggleCart = (id: string) => {
    const target = products.find(p => p.id === id);
    if (!target) return;

    const updatedTarget: Product = { ...target, inCart: !target.inCart };
    const nextList = products.map(p => (p.id === id ? updatedTarget : p));
    saveAndSync(nextList, updatedTarget);
  };

  const finishMarket = () => {
    const cleared = products.map(p => (p.inCart ? { ...p, status: 'ok' as StockStatus, inCart: false } : p));
    saveAndSync(cleared);
    setIsMarketMode(false);
  };

  const categoriesStats = useMemo(() => {
    const stats: Record<string, { total: number; needed: number }> = {};
    Object.keys(CATEGORIES).forEach(c => (stats[c] = { total: 0, needed: 0 }));
    products.forEach(p => {
      const cat = p.category || 'Otros';
      if (!stats[cat]) stats[cat] = { total: 0, needed: 0 };
      stats[cat].total++;
      if (p.status === 'low' || p.status === 'out') stats[cat].needed++;
    });
    return Object.keys(stats)
      .filter(cat => stats[cat].total > 0)
      .sort()
      .map(cat => ({
        title: cat,
        icon: CATEGORIES[cat] || '📦',
        total: stats[cat].total,
        needed: stats[cat].needed
      }));
  }, [products]);

  const displayedProducts = useMemo(() => {
    let filtered = products;
    if (isMarketMode) {
      filtered = filtered.filter(p => p.status === 'low' || p.status === 'out');
      if (selectedCategory) filtered = filtered.filter(p => p.category === selectedCategory);
    } else if (selectedCategory) {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (search.trim().length > 0) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [products, search, isMarketMode, selectedCategory]);

  // Pantalla de carga inicial
  if (authLoading) {
    return (
      <View style={[styles.container, styles.centeredContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Conectando Couple Sync...</Text>
      </View>
    );
  }

  // PANTALLA 1: Inicio de sesión (si no está autenticado ni en modo invitado)
  if (!currentUser && !isGuest) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authEmoji}>💑</Text>
          <Text style={styles.authTitle}>Couple Sync</Text>
          <Text style={styles.authSubtitle}>
            La alacena y lista de compras siempre en sintonía con tu pareja.
          </Text>

          <View style={styles.featureList}>
            <Text style={styles.featureItem}>⚡ Sincronización en vivo entre celulares</Text>
            <Text style={styles.featureItem}>🛒 Modo Mercado para tachar en el súper</Text>
            <Text style={styles.featureItem}>🔒 Espacio privado para ambos con Google</Text>
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Text style={styles.googleButtonIcon}>🌐</Text>
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.guestButton} onPress={() => setIsGuest(true)}>
            <Text style={styles.guestButtonText}>Continuar sin cuenta (Modo Local)</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // PANTALLA 2: Crear o Unirse a un Hogar (si tiene cuenta pero aún no pertenece a un hogar)
  if (currentUser && !household) {
    const userName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Pareja';
    return (
      <ScrollView contentContainerStyle={styles.householdSetupContainer}>
        <View style={styles.setupCard}>
          <Text style={styles.setupGreeting}>¡Hola, {userName}! 👋</Text>
          <Text style={styles.setupSubtitle}>
            Para sincronizar la lista de mercado en tiempo real, crea un hogar o únete al que tu pareja ya creó.
          </Text>

          {/* Opción 1: Crear nuevo Hogar */}
          <View style={styles.optionBox}>
            <Text style={styles.optionTitle}>🏠 Opción 1: Crear nuevo Hogar</Text>
            <Text style={styles.optionDesc}>Tú inicias el espacio y obtendrás un código para tu pareja.</Text>
            <TextInput
              style={styles.setupInput}
              placeholder="Nombre del hogar (ej: Nuestro Nido)"
              value={newHouseholdName}
              onChangeText={setNewHouseholdName}
            />
            <TouchableOpacity
              style={styles.primaryActionButton}
              disabled={householdActionLoading}
              onPress={handleCreateHousehold}
            >
              {householdActionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryActionText}>Crear Hogar</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Opción 2: Unirme con código */}
          <View style={styles.optionBox}>
            <Text style={styles.optionTitle}>🔗 Opción 2: Unirme con Código</Text>
            <Text style={styles.optionDesc}>Si tu pareja ya lo creó, ingresa el código que te compartió.</Text>
            <TextInput
              style={styles.setupInput}
              placeholder="Código (ej: HOGAR-1234)"
              value={joinInviteCode}
              onChangeText={setJoinInviteCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.secondaryActionButton}
              disabled={householdActionLoading}
              onPress={handleJoinHousehold}
            >
              {householdActionLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.secondaryActionText}>Unirme al Hogar</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.signOutLink} onPress={handleSignOut}>
            <Text style={styles.signOutLinkText}>Cerrar sesión de Google</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // PANTALLA 3: Inventario y Mercado (Hogar conectado o modo local)
  if (!isInventoryLoaded) {
    return (
      <View style={[styles.container, styles.centeredContainer]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{isMarketMode ? '🛒 De Compras' : '📦 Inventario'}</Text>
            <Text style={styles.subtitle}>
              {isMarketMode ? 'Selecciona lo que vas echando al carrito' : 'Control de la alacena y hogar'}
            </Text>
          </View>

          {/* Badge del Hogar / Estado de Conexión */}
          <TouchableOpacity
            style={[styles.syncBadge, household ? styles.syncBadgeOnline : styles.syncBadgeOffline]}
            onPress={openHouseholdModal}
          >
            <Text style={[styles.syncBadgeText, household ? styles.syncTextOnline : styles.syncTextOffline]}>
              {household ? `🏠 ${household.name} • ${household.invite_code}` : '🟡 Modo Local'}
            </Text>
          </TouchableOpacity>
        </View>

        {!isMarketMode && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar producto..."
              value={search}
              onChangeText={setSearch}
            />
            <TouchableOpacity
              style={styles.marketButton}
              onPress={() => {
                setIsMarketMode(true);
                setSelectedCategory(null);
              }}
            >
              <Text style={styles.marketButtonText}>🛒 Ir al Mercado</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {search.trim().length > 0 ? (
          <View style={styles.listContainer}>
            {displayedProducts.length === 0 && <Text style={styles.emptyText}>No hay resultados</Text>}
            {displayedProducts.map(item => {
              const cfg = statusConfig[item.status];
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.productListItem, { borderLeftColor: cfg.color }]}
                  onPress={() => (isMarketMode ? toggleCart(item.id) : cycleStatus(item.id, item.status))}
                >
                  <Text style={styles.productIconSmall}>{CATEGORIES[item.category] || '📦'}</Text>
                  <Text style={styles.productNameList} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={[styles.statusPillList, { backgroundColor: cfg.bgColor }]}>
                    <Text style={[styles.statusPillTextList, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : selectedCategory === null && !isMarketMode ? (
          <View style={styles.categoriesGrid}>
            {categoriesStats.map(cat => (
              <TouchableOpacity key={cat.title} style={styles.categoryCard} onPress={() => setSelectedCategory(cat.title)}>
                {cat.needed > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>{cat.needed}</Text>
                  </View>
                )}
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={styles.categoryTitle} numberOfLines={2}>
                  {cat.title}
                </Text>
                <Text style={styles.categorySubtitle}>{cat.total} items</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View>
            {(selectedCategory || isMarketMode) && search.trim().length === 0 && (
              <TouchableOpacity style={styles.backButton} onPress={() => (isMarketMode ? setIsMarketMode(false) : setSelectedCategory(null))}>
                <Text style={styles.backButtonText}>⬅️ Volver {selectedCategory && !isMarketMode ? 'al Menú Principal' : ''}</Text>
              </TouchableOpacity>
            )}

            {selectedCategory && !isMarketMode && (
              <Text style={styles.categoryHeaderTitle}>
                {CATEGORIES[selectedCategory]} {selectedCategory}
              </Text>
            )}

            <View style={styles.listContainer}>
              {displayedProducts.length === 0 && (
                <Text style={styles.emptyText}>
                  {isMarketMode ? '¡No hay nada pendiente por comprar!' : 'Esta categoría está vacía.'}
                </Text>
              )}
              {displayedProducts.map(item => {
                const cfg = statusConfig[item.status];
                if (isMarketMode) {
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.productListItem, item.inCart && styles.productListItemInCart]}
                      onPress={() => toggleCart(item.id)}
                    >
                      <View style={[styles.checkbox, item.inCart && styles.checkboxChecked]} />
                      <Text style={styles.productIconSmall}>{CATEGORIES[item.category] || '📦'}</Text>
                      <Text style={[styles.productNameList, item.inCart && styles.productNameCompleted]}>{item.name}</Text>
                      <View style={[styles.statusPillList, { backgroundColor: cfg.bgColor }]}>
                        <Text style={[styles.statusPillTextList, { color: cfg.color }]}>{cfg.label}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.productListItem, { borderLeftColor: cfg.color }]}
                    onPress={() => cycleStatus(item.id, item.status)}
                  >
                    <Text style={styles.productIconSmall}>{CATEGORIES[item.category] || '📦'}</Text>
                    <Text style={styles.productNameList}>{item.name}</Text>
                    <View style={[styles.statusPillList, { backgroundColor: cfg.bgColor }]}>
                      <Text style={[styles.statusPillTextList, { color: cfg.color }]}>{cfg.label}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Modal de Información del Hogar y Miembros */}
      <Modal visible={showHouseholdModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💑 Nuestro Hogar</Text>
            {household ? (
              <>
                <Text style={styles.modalSubtitleName}>{household.name}</Text>
                <View style={styles.codeShareBox}>
                  <Text style={styles.codeShareLabel}>Código de Invitación para tu Pareja:</Text>
                  <Text style={styles.codeShareValue}>{household.invite_code}</Text>
                  <Text style={styles.codeShareHelp}>Ella solo debe iniciar sesión con su Google y escribir este código.</Text>
                </View>

                {members.length > 0 && (
                  <View style={styles.membersBox}>
                    <Text style={styles.membersHeader}>Miembros conectados:</Text>
                    {members.map(m => (
                      <Text key={m.user_id} style={styles.memberItem}>
                        👤 {m.user_name || m.user_email} {m.role === 'owner' ? '👑' : '❤️'}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View>
                <Text style={styles.modalDescription}>
                  Estás navegando en modo local. Inicia sesión con Google para sincronizar en tiempo real con tu pareja.
                </Text>
                <TouchableOpacity
                  style={styles.loginModalBtn}
                  onPress={() => {
                    setShowHouseholdModal(false);
                    if (isSupabaseConfigured) {
                      setIsGuest(false);
                    } else {
                      Alert.alert(
                        'Conexión a la Nube',
                        'Para iniciar sesión con Google y sincronizar con tu pareja, necesitas agregar tus 2 claves de Supabase en el archivo .env del proyecto.'
                      );
                    }
                  }}
                >
                  <Text style={styles.loginModalBtnText}>🔐 Iniciar Sesión con Google</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.modalActions}>
              {currentUser && (
                <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                  <Text style={styles.signOutBtnText}>Cerrar sesión</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.closeBtn} onPress={() => setShowHouseholdModal(false)}>
                <Text style={styles.closeBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {isMarketMode ? (
        <View style={styles.finishContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setIsMarketMode(false)}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.finishButton} onPress={finishMarket}>
            <Text style={styles.finishButtonText}>Terminar Mercado</Text>
          </TouchableOpacity>
        </View>
      ) : selectedCategory !== null && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.inputContainer}
        >
          <TextInput
            style={styles.input}
            placeholder={`Añadir a ${selectedCategory}...`}
            value={text}
            onChangeText={setText}
            onSubmitEditing={addProduct}
          />
          <TouchableOpacity style={styles.addButton} onPress={addProduct}>
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  centeredContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748B', fontSize: 16, fontWeight: '500' },

  // Auth Screen styles
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 24 },
  authCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  authEmoji: { fontSize: 60, marginBottom: 12 },
  authTitle: { fontSize: 30, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  authSubtitle: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  featureList: { width: '100%', backgroundColor: '#F1F5F9', borderRadius: 16, padding: 18, marginBottom: 28 },
  featureItem: { fontSize: 14, color: '#334155', fontWeight: '500', marginVertical: 4 },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    backgroundColor: '#4285F4',
    borderRadius: 14,
    marginBottom: 12,
  },
  googleButtonIcon: { fontSize: 18, marginRight: 10 },
  googleButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  guestButton: { paddingVertical: 12 },
  guestButtonText: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  // Setup Household Screen styles
  householdSetupContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#F8FAFC' },
  setupCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  setupGreeting: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  setupSubtitle: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 20 },
  optionBox: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  optionTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  optionDesc: { fontSize: 13, color: '#64748B', marginBottom: 12 },
  setupInput: {
    height: 46,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontSize: 15,
    marginBottom: 12,
  },
  primaryActionButton: { backgroundColor: '#3B82F6', height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  primaryActionText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryActionButton: { backgroundColor: '#10B981', height: 46, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  secondaryActionText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { marginHorizontal: 12, color: '#94A3B8', fontWeight: '700', fontSize: 13 },
  signOutLink: { marginTop: 20, alignItems: 'center' },
  signOutLinkText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },

  // Main Header styles
  header: {
    paddingTop: 55,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleContainer: { flex: 1, marginRight: 10 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#0F172A' },
  subtitle: { fontSize: 14, color: '#64748B', marginTop: 2 },
  syncBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start', maxWidth: 170 },
  syncBadgeOnline: { backgroundColor: '#DCFCE7' },
  syncBadgeOffline: { backgroundColor: '#FEF3C7' },
  syncBadgeText: { fontSize: 11, fontWeight: '700' },
  syncTextOnline: { color: '#15803D' },
  syncTextOffline: { color: '#B45309' },
  searchContainer: { flexDirection: 'row', marginTop: 15, alignItems: 'center' },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  marketButton: { backgroundColor: '#10B981', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 10 },
  marketButtonText: { color: '#fff', fontWeight: 'bold' },

  // List & Category styles
  scrollContent: { padding: 15, paddingBottom: 100 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  categoryIcon: { fontSize: 40, marginBottom: 10 },
  categoryTitle: { fontSize: 15, fontWeight: 'bold', color: '#1E293B', textAlign: 'center' },
  categorySubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 5 },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  notificationText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, padding: 10, backgroundColor: '#fff', borderRadius: 8, alignSelf: 'flex-start' },
  backButtonText: { fontSize: 16, fontWeight: 'bold', color: '#3B82F6' },
  categoryHeaderTitle: { fontSize: 22, fontWeight: 'bold', color: '#1E293B', marginBottom: 15 },
  listContainer: { flexDirection: 'column' },
  productListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  productListItemInCart: { backgroundColor: '#F0FDF4', borderLeftColor: '#10B981' },
  productIconSmall: { fontSize: 24, marginRight: 12 },
  productNameList: { fontSize: 16, color: '#334155', fontWeight: '600', flex: 1 },
  productNameCompleted: { textDecorationLine: 'line-through', color: '#94A3B8' },
  statusPillList: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginLeft: 10 },
  statusPillTextList: { fontSize: 12, fontWeight: 'bold' },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#10B981', marginRight: 12 },
  checkboxChecked: { backgroundColor: '#10B981' },
  emptyText: { textAlign: 'center', color: '#94A3B8', marginTop: 40, fontSize: 16, width: '100%' },

  // Inputs and Finish buttons
  inputContainer: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  input: { flex: 1, height: 50, backgroundColor: '#F8FAFC', borderRadius: 25, paddingHorizontal: 20, fontSize: 16, marginRight: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  addButton: { width: 50, height: 50, backgroundColor: '#3B82F6', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  addButtonText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  finishContainer: { flexDirection: 'row', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0', justifyContent: 'space-between' },
  cancelButton: { flex: 1, backgroundColor: '#F1F5F9', padding: 15, borderRadius: 12, marginRight: 10, alignItems: 'center' },
  cancelButtonText: { color: '#64748B', fontWeight: 'bold', fontSize: 16 },
  finishButton: { flex: 2, backgroundColor: '#3B82F6', padding: 15, borderRadius: 12, alignItems: 'center' },
  finishButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  modalSubtitleName: { fontSize: 16, color: '#3B82F6', fontWeight: '700', marginBottom: 14 },
  modalDescription: { fontSize: 14, color: '#64748B', lineHeight: 20, marginBottom: 16 },
  codeShareBox: { backgroundColor: '#F0FDF4', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#BBF7D0', marginBottom: 16 },
  codeShareLabel: { fontSize: 12, fontWeight: '600', color: '#166534', marginBottom: 4 },
  codeShareValue: { fontSize: 26, fontWeight: '900', color: '#15803D', letterSpacing: 2, textAlign: 'center', marginVertical: 6 },
  codeShareHelp: { fontSize: 12, color: '#166534', textAlign: 'center' },
  membersBox: { marginBottom: 16 },
  membersHeader: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 6 },
  memberItem: { fontSize: 14, color: '#1E293B', fontWeight: '500', marginVertical: 3 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  signOutBtn: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#FEE2E2' },
  signOutBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  closeBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#F1F5F9' },
  closeBtnText: { color: '#475569', fontWeight: '700', fontSize: 14 },
  loginModalBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  loginModalBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
