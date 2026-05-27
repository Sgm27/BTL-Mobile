/**
 * Web shim for expo-secure-store — uses localStorage.
 * Aliased via metro.config.js for platform === 'web'.
 * Only intended for dev/screenshot bundling, NOT production web deploy.
 */
const prefix = 'btl_securestore_';

export async function setItemAsync(key, value, _options) {
  localStorage.setItem(prefix + key, value);
}

export async function getItemAsync(key, _options) {
  return localStorage.getItem(prefix + key);
}

export async function deleteItemAsync(key, _options) {
  localStorage.removeItem(prefix + key);
}

export async function isAvailableAsync() {
  return true;
}

export async function canUseBiometricAuthentication() {
  return false;
}

export const WHEN_UNLOCKED = 'WHEN_UNLOCKED';
export const AFTER_FIRST_UNLOCK = 'AFTER_FIRST_UNLOCK';
export const ALWAYS = 'ALWAYS';
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = 'WHEN_UNLOCKED_THIS_DEVICE_ONLY';
export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY = 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY';
export const ALWAYS_THIS_DEVICE_ONLY = 'ALWAYS_THIS_DEVICE_ONLY';

export default {
  setItemAsync,
  getItemAsync,
  deleteItemAsync,
  isAvailableAsync,
  canUseBiometricAuthentication,
};
