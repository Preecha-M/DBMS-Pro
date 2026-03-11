import { createContext, useContext, useState, useCallback } from 'react';

const STORAGE_KEY = 'store_config';

const DEFAULT_CONFIG = {
  name: 'ชื่อร้านค้า / บริษัท ของคุณ',
  address: 'ที่อยู่ร้าน เลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์',
  taxId: '',
  phone: '',
  branch: 'สาขาสำนักงานใหญ่',
};

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

const StoreConfigContext = createContext(null);

export function StoreConfigProvider({ children }) {
  const [config, setConfigState] = useState(loadFromStorage);

  const setConfig = useCallback((updates) => {
    setConfigState(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <StoreConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreConfig() {
  const ctx = useContext(StoreConfigContext);
  if (!ctx) throw new Error('useStoreConfig must be used inside StoreConfigProvider');
  return ctx;
}
