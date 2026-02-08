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

// Default Data
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
  // --- STATE UTAMA ---
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

  // --- 1. FIREBASE REAL-TIME LISTENER ---
  useEffect(() => {
    const dbRef = ref(db);
    
    // Listener: Berjalan otomatis setiap ada perubahan di database
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        // Helper untuk mengubah Object Firebase menjadi Array
        const toArray = (obj: any) => obj ? Object.values(obj) : [];

        // Mapping Data dari Firebase
        // Node 'transactions' di Firebase -> State 'active' di App
        const activeArr = toArray(data.transactions) as Transaction[];
        activeArr.sort((a, b) => b.timestamp - a.timestamp); // Urutkan terbaru

        const historyArr = toArray(data.history) as Transaction[];
        historyArr.sort((a, b) => b.timestamp - a.timestamp);

        const lossesArr = toArray(data.losses) as LossRecord[];
        lossesArr.sort((a, b) => b.timestamp - a.timestamp);
        
        // Produk: Handle jika data dari Firebase berupa Object Map atau Array
        let productsArr: Product[] = PRODUCTS;
        if (data.products) {
             productsArr = Array.isArray(data.products) 
                ? data.products 
                : Object.values(data.products);
        }

        const settingsObj = data.settings || DEFAULT_SETTINGS;
        const contentObj = data.content || DEFAULT_CONTENT;

        // Notifikasi Suara (Hanya jika pesanan AKTIF bertambah & bukan load pertama)
        if (!isFirstLoad.current && activeArr.length > prevTxCountRef.current) {
             notificationSound.currentTime = 0;
             notificationSound.play().catch((e) => console.log("Audio play failed:", e));
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
      }
    });

    return () => unsubscribe();
  }, []);

  // --- 2. FUNGSI CRUD LOGIC ---

  // User: Kirim Pesanan Baru (Masuk ke node 'transactions')
  const addTransaction = (tx: Transaction) => {
      set(ref(db, `transactions/${tx.id}`), tx);
  };

  // Admin/User: Update Status (Pindah dari 'transactions' ke 'history')
  const updateTransactionStatus = (id: string, status: 'confirmed' | 'rejected' | 'cancelled') => {
      // Cari data transaksi di active
      const tx = storeData.active.find(t => t.id === id);
      
      if (tx) {
          const updatedTx = { ...tx, status };
          
          // Atomic Update: Hapus dari 'transactions', simpan ke 'history' secara bersamaan
          const updates: any = {};
          updates[`transactions/${id}`] = null; // Hapus dari active
          updates[`history/${id}`] = updatedTx; // Tambah ke history
          
          update(ref(db), updates).catch(err => console.error("Update failed", err));
      } else {
          // Fallback: Jika admin mengedit status barang yang SUDAH di history
          const hTx = storeData.history.find(t => t.id === id);
          if (hTx) {
              update(ref(db, `history/${id}`), { status });
          }
      }
  };

  // User: Batalkan Pesanan
  const cancelTransaction = (id: string) => {
      updateTransactionStatus(id, 'cancelled');
  };

  // User: Upload Bukti Bayar
  const setProof = (id: string, proofUrl: string) => {
      const isActive = storeData.active.find(t => t.id === id);
      // Update field 'proof' dan ubah status jadi 'paid' (opsional)
      const path = isActive ? `transactions/${id}` : `history/${id}`;
      update(ref(db, path), { proof: proofUrl, status: 'paid' });
  };
  
  // Admin: Tambah Rugi
  const addLoss = (loss: LossRecord) => {
      set(ref(db, `losses/${loss.id}`), loss);
  };
  
  // Admin: Simpan Produk (Simpan sebagai Object Map agar ID aman)
  const saveProductsFn = (newProducts: Product[]) => {
      const productsMap: Record<string, Product> = {};
      newProducts.forEach(p => {
          productsMap[`p_${p.id}`] = p; // Gunakan prefix p_ agar key valid
      });
      set(ref(db, 'products'), productsMap);
  };
  
  // Admin: Simpan Settings
  const saveSettingsFn = (newSettings: StoreSettings) => {
      set(ref(db, 'settings'), newSettings);
  };

  // Admin: Simpan Konten (Testimoni, FAQ, dll)
  const saveContentFn = (newContent: StoreContent) => {
      set(ref(db, 'content'), newContent);
  }

  // User: Kirim Testimoni Baru
  const handleAddTestimonial = (testi: Testimonial) => {
      const currentTestimonials = [...storeData.content.testimonials, testi];
      
      // Hitung ulang rating toko
      const totalRating = currentTestimonials.reduce((sum, item) => sum + item.rating, 0);
      const newAverage = currentTestimonials.length > 0 
        ? parseFloat((totalRating / currentTestimonials.length).toFixed(1)) 
        : 5;

      const newContent: StoreContent = {
          ...storeData.content,
          testimonials: currentTestimonials,
          shopRating: newAverage
      };
      
      saveContentFn(newContent);
  };
  
  // Admin: Hapus Data
  const clearAllData = () => {
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
