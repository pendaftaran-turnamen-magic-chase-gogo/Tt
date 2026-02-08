import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ShopPage from './pages/ShopPage';
import AdminDashboard from './pages/AdminDashboard';
import { Transaction, LossRecord, Product, StoreSettings, StoreContent } from './types';
import { PRODUCTS } from './constants';

// Firebase Imports
import { db } from './firebase';
import { ref, onValue, set, update, remove, push } from 'firebase/database';

const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'TOKOTOPARYA', 
  whatsapp: '628123456789', 
  qrisImageUrl: '', 
  qrisTimerMinutes: 10
};

const DEFAULT_CONTENT: StoreContent = {
  testimonials: [], gallery: [], faqs: [], infos: [], shopRating: 5
};

const App: React.FC = () => {
  const [storeData, setStoreData] = useState<{
      active: Transaction[];
      history: Transaction[];
      losses: LossRecord[];
      products: Product[];
      settings: StoreSettings;
      content: StoreContent;
  }>(({
      active: [],
      history: [],
      losses: [],
      products: PRODUCTS,
      settings: DEFAULT_SETTINGS,
      content: DEFAULT_CONTENT
  }));

  // --- SYNC REAL-TIME DENGAN FIREBASE ---
  useEffect(() => {
    const dbRef = ref(db);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setStoreData({
          active: data.active ? Object.values(data.active) : [],
          history: data.history ? Object.values(data.history) : [],
          losses: data.losses ? Object.values(data.losses) : [],
          products: data.products || PRODUCTS,
          settings: data.settings || DEFAULT_SETTINGS,
          content: data.content || DEFAULT_CONTENT
        });
        
        // Bunyi notifikasi jika ada pesanan baru di list active
        if (data.active && Object.keys(data.active).length > storeData.active.length) {
            notificationSound.play().catch(() => {});
        }
      }
    });

    return () => unsubscribe();
  }, [storeData.active.length]);

  // --- ACTIONS (Kirim ke Firebase) ---
  const addTransaction = (trx: Transaction) => {
    // Menggunakan set dengan ID spesifik dari trx.id agar real-time
    set(ref(db, `active/${trx.id}`), trx);
  };

  const updateTransactionStatus = (id: string, status: 'confirmed' | 'rejected') => {
    const trx = storeData.active.find(t => t.id === id);
    if (!trx) return;

    if (status === 'confirmed') {
      // Pindah ke history
      set(ref(db, `history/${id}`), { ...trx, status: 'completed' });
      remove(ref(db, `active/${id}`));
    } else {
      remove(ref(db, `active/${id}`));
    }
  };

  const setProof = (id: string, proofUrl: string) => {
    update(ref(db, `active/${id}`), { proof: proofUrl, status: 'paid' });
  };

  const saveProductsFn = (newProducts: Product[]) => set(ref(db, 'products'), newProducts);
  const saveSettingsFn = (s: StoreSettings) => set(ref(db, 'settings'), s);
  const saveContentFn = (c: StoreContent) => set(ref(db, 'content'), c);

  const clearAllData = () => {
      remove(ref(db, 'active'));
      remove(ref(db, 'history'));
      remove(ref(db, 'losses'));
  };

  if (!storeData.settings.storeName) return null; 

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={
          <ShopPage 
            addTransaction={addTransaction} 
            allTransactions={[...storeData.active, ...storeData.history]} 
            updateProof={setProof}
            products={storeData.products}
            settings={storeData.settings}
            content={storeData.content} 
            onAddTestimonial={(t) => {
                const newList = [...storeData.content.testimonials, t];
                saveContentFn({ ...storeData.content, testimonials: newList });
            }}
          />
        } />
        <Route path="/admin" element={
          <AdminDashboard 
            activeTransactions={storeData.active}
            historyTransactions={storeData.history}
            losses={storeData.losses}
            products={storeData.products}
            settings={storeData.settings}
            content={storeData.content}
            updateStatus={updateTransactionStatus}
            addLoss={(l) => push(ref(db, 'losses'), l)}
            saveProducts={saveProductsFn}
            saveSettings={saveSettingsFn}
            saveContent={saveContentFn}
            clearData={clearAllData}
          />
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
