import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored));
      }
    } catch {
      // no-op: localStorage may be unavailable (privacy mode, SSR mismatch, etc.)
    }
  }, [key]);

  const setStoredValue = (val: T) => {
    try {
      setValue(val);
      window.localStorage.setItem(key, JSON.stringify(val));
    } catch {
      // no-op: localStorage may be unavailable (privacy mode, SSR mismatch, etc.)
    }
  };

  return [value, setStoredValue] as const;
}
