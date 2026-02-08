
export const PROJECT_FILES: Record<string, string> = {
  "metadata.json": `{
  "name": "Yakult Shop Pro & Admin",
  "description": "Premium Yakult Ordering Platform with Dynamic QRIS and Pro Admin Panel",
  "requestFramePermissions": [
    "camera",
    "geolocation"
  ]
}`,
  "package.json": `{
  "name": "yakult-shop-pro",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.344.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.3",
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2",
    "jszip": "^3.10.1",
    "firebase": "^10.8.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.66",
    "@types/react-dom": "^18.2.22",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.2.0"
  }
}`,
  "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,
  "vite.config.ts": `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
  "index.html": `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Yakult Shop Pro</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js"></script>
    <style>
        body { font-family: 'Plus Jakarta Sans', sans-serif; }
        .glass { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); }
        .yakult-gradient { background: linear-gradient(135deg, #e11d48 0%, #be123c 100%); }
        .yakult-text { color: #e11d48; }
        .yakult-bg { background-color: #e11d48; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
        .float-animation { animation: float 3s ease-in-out infinite; }
        @keyframes check-bounce { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .animate-check { animation: check-bounce 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes pop-success { 0% { transform: scale(0.8); opacity: 0; } 40% { transform: scale(1.1); opacity: 1; } 70% { transform: scale(0.95); } 100% { transform: scale(1); } }
        .animate-pop { animation: pop-success 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        @keyframes shake-error { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); } 20%, 40%, 60%, 80% { transform: translateX(5px); } }
        .animate-shake { animation: shake-error 0.5s ease-in-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    </style>
</head>
<body class="bg-slate-50 text-slate-900">
    <div id="root"></div>
    <script type="module" src="/src/index.tsx"></script>
</body>
</html>`,
  "src/index.tsx": `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
  "src/types.ts": `export type PaymentType = 'cash' | 'qris';
export type OrderStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled';
export interface OrderItem { id: number; name: string; qty: number; price: number; }
export interface Customer { name: string; wa: string; address: string; lat?: number; lng?: number; }
export interface Transaction { id: string; type: PaymentType; customer: Customer; items: OrderItem[]; total: number; fee: number; status: OrderStatus; timestamp: number; proofUrl?: string; }
export interface LossRecord { id: string; amount: number; description: string; timestamp: number; }
export interface Product { id: number; name: string; desc: string; price: number; img: string; qrisUrl?: string; }
export interface Testimonial { id: string; name: string; email?: string; phone?: string; text: string; rating: number; img?: string; role?: string; timestamp?: number; }
export interface GalleryItem { id: string; title: string; img: string; }
export interface FaqItem { id: string; question: string; answer: string; }
export interface InfoSection { id: string; title: string; content: string; icon: 'truck' | 'star' | 'info' | 'clock' | 'shield'; isActive: boolean; }
export interface StoreContent { testimonials: Testimonial[]; gallery: GalleryItem[]; faqs: FaqItem[]; infos: InfoSection[]; shopRating: number; }
export interface StoreSettings { storeName: string; whatsapp: string; qrisImageUrl: string; qrisTimerMinutes: number; }`,
  "src/constants.ts": `import { Product } from './types';
export const RAW_QRIS_BASE = "00020101021126570011ID.DANA.WWW011893600915380003780002098000378000303UMI51440014ID.CO.QRIS.WWW0215ID10243620012490303UMI5204549953033605802ID5910Warr2 Shop6015Kab. Bandung Ba6105402936304BF4C";
export const PRODUCTS: Product[] = [
  { id: 1, name: "Yakult Original", desc: "Minuman probiotik asli.", price: 10500, img: "https://images.unsplash.com/photo-1621236300238-293838275919?auto=format&fit=crop&q=80&w=300", qrisUrl: "" },
  { id: 2, name: "Yakult Mangga", desc: "Rasa mangga segar.", price: 12000, img: "https://images.unsplash.com/photo-1553106972-386156327574?auto=format&fit=crop&q=80&w=300", qrisUrl: "" },
  { id: 3, name: "Yakult Light", desc: "Rendah gula & kalori (Total Bayar 13.200).", price: 13000, img: "https://6981e829011752fb6df26a63.imgix.net/1001323287.jpg?w=447&h=447", qrisUrl: "https://6981e829011752fb6df26a63.imgix.net/1001323460.jpg?w=345&h=346&ar=345%3A346" },
  { id: 4, name: "Test Produk", desc: "Produk uji coba sistem (Total Bayar 300).", price: 100, img: "https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=300", qrisUrl: "https://6981e829011752fb6df26a63.imgix.net/1001323452.jpg?w=367&h=364" }
];
export const ADMIN_CREDENTIALS = { user: "arya1212", pass: "ab87bCBG$@y5542hhKLnb" };
export const COUNTRY_CODES = [
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' }
];`,
  "src/utils.ts": `import { Product } from './types';
export function formatCurrency(value: number): string { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value); }
export const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image(); img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas'); const maxWidth = 500;
        if (img.width <= maxWidth) { resolve(reader.result as string); return; }
        const scaleFactor = maxWidth / img.width; elem.width = maxWidth; elem.height = img.height * scaleFactor;
        const ctx = elem.getContext('2d'); ctx?.drawImage(img, 0, 0, elem.width, elem.height);
        resolve(elem.toDataURL('image/jpeg', 0.7));
      }; img.onerror = (error) => reject(error);
    }; reader.onerror = (error) => reject(error);
  });
};`,
  "src/firebase.ts": `import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
const firebaseConfig = { apiKey: "AIzaSyDMwxKKdttuFXp9Hat8veUDJ2N-HuKqDLk", authDomain: "fir-9de8f.firebaseapp.com", databaseURL: "https://fir-9de8f-default-rtdb.asia-southeast1.firebasedatabase.app", projectId: "fir-9de8f", storageBucket: "fir-9de8f.firebasestorage.app", messagingSenderId: "549663941166", appId: "1:549663941166:android:8737a643adbfebe61cf5bf" };
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);`,
  "src/App.tsx": `import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import ShopPage from './pages/ShopPage';
import AdminDashboard from './pages/AdminDashboard';
import { Transaction, LossRecord, Product, StoreSettings, StoreContent, Testimonial } from './types';
import { PRODUCTS } from './constants';
import { db } from './firebase';
import { ref, onValue, set, update, remove } from 'firebase/database';

const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
const DEFAULT_SETTINGS: StoreSettings = { storeName: 'TOKOTOPARYA', whatsapp: '628123456789', qrisImageUrl: '', qrisTimerMinutes: 10 };
const DEFAULT_CONTENT: StoreContent = { testimonials: [], gallery: [], faqs: [], infos: [], shopRating: 5 };

const App: React.FC = () => {
  const [storeData, setStoreData] = useState<{ active: Transaction[]; history: Transaction[]; losses: LossRecord[]; products: Product[]; settings: StoreSettings; content: StoreContent; }>({ active: [], history: [], losses: [], products: PRODUCTS, settings: DEFAULT_SETTINGS, content: DEFAULT_CONTENT });
  const prevTxCountRef = useRef(0);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    const dbRef = ref(db);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const activeArr = data.transactions ? Object.values(data.transactions) as Transaction[] : [];
        activeArr.sort((a, b) => b.timestamp - a.timestamp);
        const historyArr = data.history ? Object.values(data.history) as Transaction[] : [];
        historyArr.sort((a, b) => b.timestamp - a.timestamp);
        const lossesArr = data.losses ? Object.values(data.losses) as LossRecord[] : [];
        lossesArr.sort((a, b) => b.timestamp - a.timestamp);
        const productsArr = data.products ? Object.values(data.products) as Product[] : PRODUCTS;
        const settingsObj = data.settings || DEFAULT_SETTINGS;
        const contentObj = data.content || DEFAULT_CONTENT;

        if (!isFirstLoad.current && activeArr.length > prevTxCountRef.current) { notificationSound.currentTime = 0; notificationSound.play().catch(() => {}); }
        prevTxCountRef.current = activeArr.length;
        isFirstLoad.current = false;
        setStoreData({ active: activeArr, history: historyArr, losses: lossesArr, products: productsArr, settings: settingsObj, content: contentObj });
      }
    });
    return () => unsubscribe();
  }, []);

  const addTransaction = (tx: Transaction) => { set(ref(db, \`transactions/\${tx.id}\`), tx); };
  const updateTransactionStatus = (id: string, status: 'confirmed' | 'rejected' | 'cancelled') => {
      const tx = storeData.active.find(t => t.id === id);
      if (tx) {
          const updatedTx = { ...tx, status };
          const updates: any = {};
          updates[\`transactions/\${id}\`] = null;
          updates[\`history/\${id}\`] = updatedTx;
          update(ref(db), updates);
      } else {
          const hTx = storeData.history.find(t => t.id === id);
          if (hTx) update(ref(db, \`history/\${id}\`), { status });
      }
  };
  const cancelTransaction = (id: string) => { updateTransactionStatus(id, 'cancelled'); };
  const setProof = (id: string, proofUrl: string) => {
      const isActive = storeData.active.find(t => t.id === id);
      if (isActive) update(ref(db, \`transactions/\${id}\`), { proofUrl });
      else update(ref(db, \`history/\${id}\`), { proofUrl });
  };
  const addLoss = (loss: LossRecord) => { set(ref(db, \`losses/\${loss.id}\`), loss); };
  const saveProductsFn = (newProducts: Product[]) => { const productsMap: Record<string, Product> = {}; newProducts.forEach(p => { productsMap[p.id] = p; }); set(ref(db, 'products'), productsMap); };
  const saveSettingsFn = (newSettings: StoreSettings) => { set(ref(db, 'settings'), newSettings); };
  const saveContentFn = (newContent: StoreContent) => { set(ref(db, 'content'), newContent); };
  const handleAddTestimonial = (testi: Testimonial) => {
      const currentTestimonials = [...storeData.content.testimonials, testi];
      const totalRating = currentTestimonials.reduce((sum, item) => sum + item.rating, 0);
      const newAverage = parseFloat((totalRating / currentTestimonials.length).toFixed(1));
      const newContent: StoreContent = { ...storeData.content, testimonials: currentTestimonials, shopRating: newAverage };
      saveContentFn(newContent);
  };
  const clearAllData = () => { remove(ref(db, 'transactions')); remove(ref(db, 'history')); remove(ref(db, 'losses')); };

  if (!storeData.settings.storeName) return null; 

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<ShopPage addTransaction={addTransaction} cancelTransaction={cancelTransaction} allTransactions={[...storeData.active, ...storeData.history]} updateProof={setProof} products={storeData.products} settings={storeData.settings} content={storeData.content} onAddTestimonial={handleAddTestimonial} />} />
        <Route path="/admin" element={<AdminDashboard activeTransactions={storeData.active} historyTransactions={storeData.history} losses={storeData.losses} products={storeData.products} settings={storeData.settings} content={storeData.content} updateStatus={updateTransactionStatus} addLoss={addLoss} saveProducts={saveProductsFn} saveSettings={saveSettingsFn} saveContent={saveContentFn} clearData={clearAllData} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
};
export default App;`,
  "src/pages/AdminDashboard.tsx": "// Will be filled by the actual file content on runtime",
  "src/source_code_data.ts": "export const PROJECT_FILES = {};" 
};
