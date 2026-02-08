import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ShopPage from './pages/ShopPage';
import AdminDashboard from './pages/AdminDashboard';
import { Transaction, LossRecord, Product, StoreSettings, StoreContent, Testimonial } from './types';
import { PRODUCTS } from './constants';

// Firebase Imports
import { db } from './firebase';
import { ref, onValue, set, update, remove } from 'firebase/database';

const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

// Default Data untuk Inisialisasi State Awal
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
  // --- STATE UTAMA (Disinkronkan dengan Firebase) ---
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

  // --- FIREBASE REAL-TIME LISTENER ---
  useEffect(() => {
    const dbRef = ref(db);
    
    // Fungsi ini akan berjalan setiap kali ada perubahan data di Firebase (Real-time)
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        // Konversi Data Object dari Firebase ke Array untuk UI
        // Firebase menyimpan array sebagai object {key: val}, kita perlu Object.values
        
        const activeArr = data.transactions ? Object.values(data.transactions) as Transaction[] : [];
        activeArr.sort((a, b) => b.timestamp - a.timestamp); // Urutkan terbaru

        const historyArr = data.history ? Object.values(data.history) as Transaction[] : [];
        historyArr.sort((a, b) => b.timestamp - a.timestamp);

        const lossesArr = data.losses ? Object.values(data.losses) as LossRecord[] : [];
        lossesArr.sort((a, b) => b.timestamp - a.timestamp);
        
        // Produk bisa array atau object tergantung history save
        let productsArr: Product[] = PRODUCTS;
        if (data.products) {
            productsArr = Array.isArray(data.products) ? data.products : Object.values(data.products);
        }
        
        const settingsObj = data.settings || DEFAULT_SETTINGS;
        const contentObj = data.content || DEFAULT_CONTENT;

        // Notifikasi Suara jika ada order baru masuk (Real-time)
        if (!isFirstLoad.current && activeArr.length > prevTxCountRef.current) {
             notificationSound.currentTime = 0;
             notificationSound.play().catch(() => {});
        }
        
        prevTxCountRef.current = activeArr.length;
        isFirstLoad.current = false;

        // Update State Aplikasi
        setStoreData({
            active: activeArr,
            history: historyArr,
            losses: lossesArr,
            products: productsArr,
            settings: settingsObj,
            content: contentObj
        });
      }
    });

    return () => unsubscribe();
  }, []);


  // ============================================================
  // 🟢 FUNGSI CRUD KE FIREBASE
  // ============================================================

  const addTransaction = (tx: Transaction) => {
      // Simpan langsung ke path transactions/{id}
      set(ref(db, `transactions/${tx.id}`), tx);
  };

  const updateTransactionStatus = (id: string, status: 'confirmed' | 'rejected' | 'cancelled') => {
      const tx = storeData.active.find(t => t.id === id);
      
      if (tx) {
          const updatedTx = { ...tx, status };
          
          // Atomic Update: Hapus dari 'transactions', pindah ke 'history'
          const updates: any = {};
          updates[`transactions/${id}`] = null;
          updates[`history/${id}`] = updatedTx;
          
          update(ref(db), updates);
      } else {
          // Jika update status pada item yang sudah di history
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
      // Cek apakah ada di active atau history, lalu update url bukti
      const isActive = storeData.active.find(t => t.id === id);
      if (isActive) {
          update(ref(db, `transactions/${id}`), { proofUrl });
      } else {
          update(ref(db, `history/${id}`), { proofUrl });
      }
  };
  
  const addLoss = (loss: LossRecord) => {
      set(ref(db, `losses/${loss.id}`), loss);
  };
  
  const saveProductsFn = (newProducts: Product[]) => {
      // Simpan array produk sebagai object key-value untuk menghindari masalah index array di Firebase
      const productsMap: Record<string, Product> = {};
      newProducts.forEach(p => {
          // Pastikan ID valid
          productsMap[`p_${p.id}`] = p;
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
      const currentTestimonials = [...storeData.content.testimonials, testi];
      
      // Hitung rating rata-rata baru
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
      // Hapus semua data transaksi & laporan, sisakan produk & setting
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