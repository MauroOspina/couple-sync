/** Categorías de la despensa, palabras clave para clasificar y catálogo inicial de productos. */

export const DEFAULT_CATEGORY = 'Otros';

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
  [DEFAULT_CATEGORY]: '📦',
};

export const STATUS_LABELS = {
  ok: 'Hay',
  low: 'Queda poco',
  out: 'Falta',
} as const;

/** Palabras (en singular, sin tildes) que delatan la categoría de un producto nuevo. */
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Lácteos y Huevos': ['queso', 'leche', 'yogur', 'yogurt', 'kumis', 'mantequilla', 'crema de leche', 'huevo', 'arequipe', 'margarina'],
  'Carnes y Embutidos': ['pollo', 'carne', 'cerdo', 'res', 'jamon', 'tocineta', 'salchicha', 'chorizo', 'pescado', 'tilapia', 'salmon', 'camaron', 'pechuga', 'costilla', 'lomo', 'molida', 'alita'],
  'Frutas': ['banano', 'manzana', 'mango', 'fresa', 'limon', 'aguacate', 'pina', 'naranja', 'mandarina', 'uva', 'pera', 'papaya', 'maracuya', 'guayaba', 'mora', 'pitaya', 'lulo', 'sandia', 'melon'],
  'Verduras y Vegetales': ['tomate', 'cebolla', 'zanahoria', 'brocoli', 'lechuga', 'pimenton', 'ajo', 'champinon', 'pepino', 'espinaca', 'cilantro', 'apio', 'calabacin', 'arveja', 'mazorca', 'maiz', 'aceituna', 'repollo', 'papa', 'yuca', 'platano'],
  'Panadería y Arepas': ['pan', 'arepa', 'tortilla', 'tostada', 'croissant', 'buñuelo', 'almojabana'],
  'Pastas': ['pasta', 'spaguetti', 'espagueti', 'macarron', 'fideo', 'lasaña', 'concha', 'tornillo'],
  'Bebidas': ['jugo', 'gaseosa', 'cerveza', 'agua', 'soda', 'vino', 'te', 'infusion', 'bretaña', 'refresco'],
  'Despensa y Salsas': ['arroz', 'aceite', 'sal', 'azucar', 'harina', 'salsa', 'pimienta', 'frijol', 'lenteja', 'garbanzo', 'atun', 'vinagre', 'mayonesa', 'mostaza', 'pesto', 'canela', 'comino', 'oregano', 'stevia', 'caldo'],
  'Dulces y Desayuno': ['cafe', 'chocolate', 'cocoa', 'galleta', 'mermelada', 'miel', 'panela', 'cereal', 'avena', 'pancake', 'brownie', 'dulce'],
  'Snacks y Pasabocas': ['papas de paquete', 'mani', 'dorito', 'chito', 'marañon', 'nachos', 'tostaco', 'crispeta'],
  'Congelados': ['congelado', 'congelada', 'helado', 'nugget'],
  'Aseo Hogar': ['detergente', 'jabon loza', 'cloro', 'limpido', 'bolsa', 'esponja', 'servilleta', 'toalla de cocina', 'papel aluminio', 'desinfectante', 'suavizante', 'trapero'],
  'Aseo Personal': ['shampoo', 'champu', 'crema dental', 'cepillo', 'desodorante', 'jabon', 'papel higienico', 'protector', 'pañito', 'toalla higienica', 'acondicionador'],
  'Mascotas': ['arena', 'whiskas', 'concentrado', 'don kat', 'dog chow', 'purina'],
  'Farmacia': ['pastilla', 'acetaminofen', 'ibuprofeno', 'advil', 'aspirina', 'vitamina', 'curita', 'alcohol'],
};

/** Productos con los que arranca una despensa nueva. */
export const STARTER_CATALOG: { category: string; items: string[] }[] = [
  { category: 'Despensa y Salsas', items: ['Aceite oliva', 'Ajo Molido', 'Arroz premium', 'Atún', 'Atunes personal', 'Canela molida', 'Escencia de vainilla', 'Garbanzos', 'Mayonesa', 'Pesto', 'Pimienta Negra Granulada', 'Salero', 'Salsa Chipotle', 'Salsa Showy', 'Salsa Soya', 'Salsa ajo', 'Salsa negra', 'Stevia', 'Zumo limón'] },
  { category: 'Panadería y Arepas', items: ['Arepas', 'Arepas de yuca', 'Pan tajado Bimbo', 'Pan tajado mantequilla', 'Pancitos mantequilla', 'Tortillas', 'Tostadas'] },
  { category: 'Pastas', items: ['Pastas conchas', 'Spaguetti'] },
  { category: 'Verduras y Vegetales', items: ['Aceituna', 'Brocoli', 'Champiñones enteros', 'Champiñones tajados', 'Mix arverja y zanahoria', 'Zanahoria'] },
  { category: 'Frutas', items: ['Aguacate', 'Aguacate Haas', 'Banano', 'Limón Tahití', 'Limón mandarino', 'Mango', 'Pitaya'] },
  { category: 'Carnes y Embutidos', items: ['Alitas pollo', 'Carne molida', 'Chicharrones', 'Chorizos Santarrosanos', 'Jamón', 'Jamón Serrano', 'Lomo cerdo', 'Lomo res', 'Salchichas Rancheras', 'Tocineta'] },
  { category: 'Congelados', items: ['Papa congelada', 'Yucas congeladas'] },
  { category: 'Bebidas', items: ['Bretaña', 'Cerveza Stella', 'Club Trigo', 'Infusión frutos rojos', 'Jugo naranja', 'Soda', 'Soda Frescampo'] },
  { category: 'Lácteos y Huevos', items: ['Esparcible Rama', 'Huevos', 'La Fina', 'Leche en polvo', 'Leche entera', 'Mantequilla Colanta con sal', 'Queso campesino', 'Queso crema', 'Queso cuajada', 'Queso mozarellla', 'Queso siete cueros', 'Six pack yogurt'] },
  { category: 'Dulces y Desayuno', items: ['Brownies', 'Café liofilizado', 'Cocoa', 'Crema maní', 'Crispetas', 'Ducales', 'Galletas chip', 'Galletas mantequilla', 'Gansitos', 'Leche condensada', 'Mermelada', 'Mezcla pancakes', 'Miel', 'Panela', 'Panela en polvo'] },
  { category: 'Snacks y Pasabocas', items: ['Doritos', 'Mani salado', 'Maní uvas pasas', 'Marañones', 'Mix maní', 'Papas paquete', 'Papas receta clásica', 'Tostacos'] },
  { category: 'Mascotas', items: ['Arena gatos', 'Arena gatos Carbón', 'Don Kat', 'Whiskas'] },
  { category: 'Farmacia', items: ['Advil', 'Aspirina efervescente', 'Noravert'] },
  { category: 'Aseo Personal', items: ['Crema dental', 'Jabon lavamanos espumoso', 'Jabón Protex', 'Jabón antibacterial', 'Papel Familia deluxe', 'Papel extra suave', 'Pañitos', 'Protectores', 'Shampoo'] },
  { category: 'Aseo Hogar', items: ['Bolsas basura', 'Detergente líquido', 'Detergente polvo', 'Esponjas', 'Jabón Loza', 'Límpido', 'Papel aluminio', 'Servilletas', 'Toallas cocina', 'Trampa Raid'] },
];
