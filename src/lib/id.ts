import * as Crypto from 'expo-crypto';

/** Id único para registros nuevos (se generan en el teléfono para poder trabajar sin conexión). */
export const createId = (): string => Crypto.randomUUID();
