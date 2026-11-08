import { Product } from '../services/inventorySync';

export const statusConfig = {
  ok: { label: '✅ Hay', color: '#10B981', bgColor: '#D1FAE5' },
  low: { label: '⚠️ Queda', color: '#F59E0B', bgColor: '#FEF3C7' },
  out: { label: '❌ Falta', color: '#EF4444', bgColor: '#FEE2E2' },
};

export const CATEGORIES: Record<string, string> = {
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

export const rawData = [
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
export const initialProducts: Product[] = [];
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

export const createProductId = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;