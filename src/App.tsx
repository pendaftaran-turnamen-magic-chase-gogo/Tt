import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ShopPage from './pages/ShopPage';
import AdminDashboard from './pages/AdminDashboard';
import { Transaction, LossRecord, Product, StoreSettings, StoreContent, Testimonial } from './types';
import { PRODUCTS } from './constants';

// Firebase Imports
import { db } from './firebase';
import { ref, onValue, set, update, remove, push } from 'firebase/database';

const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// Default Data jika Firebase kosong
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
  // --- ATOMIC STATE (Disinkronkan dengan Firebase) ---
  const [storeData, setStoreData] = useState<{
      active: Transaction[];
      history: Transaction[];
      losses: LossRecord[];
      products: Product[];
      settings: StoreSettings;
      content: StoreContent;
  }>({
      active: [],
      history: [],
      losses: [],
      products: PRODUCTS,
      settings: DEFAULT_SETTINGS,
      content: DEFAULT_CONTENT
  });

  const prevTxCountRef = useRef(0);
  const isFirstLoad = useRef(true);

  // --- FIREBASE LISTENER (REAL-TIME) ---
  useEffect(() => {
    // Listen ke root database atau node spesifik
    const dbRef = ref(db);
    
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        // Konversi Object Firebase kembali ke Array untuk UI
        const activeArr = data.transactions ? Object.values(data.transactions) as Transaction[] : [];
        // Sort active transactions by timestamp desc (newest first)
        activeArr.sort((a, b) => b.timestamp - a.timestamp);

        const historyArr = data.history ? Object.values(data.history) as Transaction[] : [];
        historyArr.sort((a, b) => b.timestamp - a.timestamp);

        const lossesArr = data.losses ? Object.values(data.losses) as LossRecord[] : [];
        lossesArr.sort((a, b) => b.timestamp - a.timestamp);
        
        const productsArr = data.products ? Object.values(data.products) as Product[] : PRODUCTS;
        
        // Settings & Content
        const settingsObj = data.settings || DEFAULT_SETTINGS;
        const contentObj = data.content || DEFAULT_CONTENT;

        // Notifikasi Order Baru
        if (!isFirstLoad.current && activeArr.length > prevTxCountRef.current) {
             notificationSound.currentTime = 0;
             notificationSound.play().catch(() => {});
        }
        
        prevTxCountRef.current = activeArr.length;
        isFirstLoad.current = false;

        setStoreData({
            active: activeArr,
            history: historyArr,
            losses: lossesArr,
            products: productsArr,
            settings: settingsObj,
            content: contentObj
        });
      } else {
        // Jika DB kosong, inisialisasi default (opsional)
        // Kita biarkan state default awal
      }
    });

    return () => unsubscribe();
  }, []);


  // ============================================================
  // 🟢 LOGIKA PROSES DATA (WRITE TO FIREBASE)
  // ============================================================

  const addTransaction = (tx: Transaction) => {
      // Gunakan ID transaksi sebagai key di Firebase agar mudah diakses/update
      const txRef = ref(db, `transactions/${tx.id}`);
      set(txRef, tx);
  };

  const updateTransactionStatus = (id: string, status: 'confirmed' | 'rejected' | 'cancelled') => {
      // Cari di active
      const tx = storeData.active.find(t => t.id === id);
      
      if (tx) {
          // Pindahkan dari transactions -> history
          const updatedTx = { ...tx, status };
          
          // 1. Hapus dari active
          remove(ref(db, `transactions/${id}`));
          
          // 2. Tambahkan ke history
          set(ref(db, `history/${id}`), updatedTx);
      } else {
          // Jika update status item yang SUDAH di history (misal ralat status)
          const hTx = storeData.history.find(t => t.id === id);
          if (hTx) {
              update(ref(db, `history/${id}`), { status });
          }
      }
  };

  const cancelTransaction = (id: string) => {
      updateTransactionStatus(id, 'cancelled');
  };

  const setProof = (id: string, proofUrl: string) => {
      // Cek ada di active atau history
      const isActive = storeData.active.find(t => t.id === id);
      if (isActive) {
          update(ref(db, `transactions/${id}`), { proofUrl });
      } else {
          // Cek history (jarang terjadi tapi mungkin)
          update(ref(db, `history/${id}`), { proofUrl });
      }
  };
  
  const addLoss = (loss: LossRecord) => {
      // Gunakan ID loss sebagai key
      set(ref(db, `losses/${loss.id}`), loss);
  };
  
  const saveProductsFn = (newProducts: Product[]) => {
      // Replace seluruh node products
      // Kita ubah array ke object dengan index/ID sebagai key untuk keamanan Firebase
      const productsMap: Record<string, Product> = {};
      newProducts.forEach(p => {
          productsMap[p.id] = p;
      });
      set(ref(db, 'products'), productsMap);
  };
  
  const saveSettingsFn = (newSettings: StoreSettings) => {
      set(ref(db, 'settings'), newSettings);
  };

  const saveContentFn = (newContent: StoreContent) => {
      set(ref(db, 'content'), newContent);
  }

  const handleAddTestimonial = (testi: Testimonial) => {
      // Ambil data existing untuk hitung rating baru
      const currentTestimonials = [...storeData.content.testimonials, testi];
      
      // Hitung average baru
      const totalRating = currentTestimonials.reduce((sum, item) => sum + item.rating, 0);
      const newAverage = parseFloat((totalRating / currentTestimonials.length).toFixed(1));

      const newContent: StoreContent = {
          ...storeData.content,
          testimonials: currentTestimonials,
          shopRating: newAverage
      };
      
      saveContentFn(newContent);
  };
  
  const clearAllData = () => {
      // Hapus transaksi, history, losses (tapi sisakan produk & settings)
      remove(ref(db, 'transactions'));
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
            cancelTransaction={cancelTransaction}
            allTransactions={[...storeData.active, ...storeData.history]} 
            updateProof={setProof}
            products={storeData.products}
            settings={storeData.settings}
            content={storeData.content} 
            onAddTestimonial={handleAddTestimonial}
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
            addLoss={addLoss}
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