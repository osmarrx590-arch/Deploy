import { STORAGE_KEYS } from '@/services/storageService';

/**
 * Remove todas as chaves definidas em STORAGE_KEYS do localStorage.
 * Pode ser usado no código (import) ou invocado no console do browser:
 *   import('@/utils/clearLocalStorage').then(m => m.clearAllStorageKeys());
 */
export function clearAllStorageKeys(): void {
  if (typeof window === 'undefined') {
    // Node/SSR environment
    // Nothing to do here; caller pode implementar alternativa para limpeza de teste
    // (ex: limpar um arquivo JSON usado como mock)
    return;
  }

  try {
    const keys = Object.values(STORAGE_KEYS) as string[];
    keys.forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch (e) {
        // ignore
      }
    });
    console.log('✅ Todas as chaves do STORAGE_KEYS removidas do localStorage');
  } catch (err) {
    console.error('Erro ao limpar as chaves do localStorage', err);
  }
}

// Export default para uso rápido no console: window.clearLocalStorage()
// (injeção no window feita apenas quando rodado no browser durante dev)
if (typeof window !== 'undefined') {
    // adicionar helper na window apenas no desenvolvimento
    (window as Window & { clearLocalStorage?: () => void }).clearLocalStorage = clearAllStorageKeys;
}
