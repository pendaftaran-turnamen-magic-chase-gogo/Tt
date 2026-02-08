import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingBag, History, TrendingDown, 
  Wallet, Check, X, Eye, 
  MapPin, MessageCircle, Menu, Search, Download, Wifi, Package, Loader2,
  Settings, Save, PlusCircle, Edit, Database, Clock, Server, Copy, AlertCircle, UploadCloud, Image as ImageIcon, QrCode, ChevronDown, CheckCircle, XCircle,
  Store, Trash2, BookOpen, Star, HelpCircle, Info, Image as ImgIcon, Plus, ChevronUp, MoreHorizontal, FileCode2
} from 'lucide-react';
import { Transaction, LossRecord, Product, StoreSettings, StoreContent, Testimonial, GalleryItem, FaqItem, InfoSection } from '../types';
import { ADMIN_CREDENTIALS, COUNTRY_CODES } from '../constants';
import { formatCurrency, compressImage } from '../utils';
import JSZip from 'jszip';
import { PROJECT_FILES } from '../source_code_data';

declare global {
  interface Window {
    jspdf: any;
  }
}

interface AdminDashboardProps {
  activeTransactions: Transaction[];
  historyTransactions: Transaction[];
  losses: LossRecord[];
  products: Product[];
  settings: StoreSettings;
  content: StoreContent;
  updateStatus: (id: string, status: 'confirmed' | 'rejected') => void;
  addLoss: (loss: LossRecord) => void;
  saveProducts: (products: Product[]) => void;
  saveSettings: (settings: StoreSettings) => void;
  saveContent: (content: StoreContent) => void;
  clearData: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  activeTransactions, historyTransactions, losses, products, settings, content,
  updateStatus, addLoss, saveProducts, saveSettings, saveContent, clearData
}) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'dash' | 'active' | 'history' | 'losses' | 'products' | 'settings' | 'content'>('dash');
  const [contentSubTab, setContentSubTab] = useState<'testimoni' | 'gallery' | 'faq' | 'info'>('testimoni');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false); 
  const [isZipping, setIsZipping] = useState(false);
  
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const [showLossModal, setShowLossModal] = useState(false);
  const [lossForm, setLossForm] = useState({ amt: '', desc: '' });
  const [showProductModal, setShowProductModal] = useState(false);
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({ name: '', desc: '', price: '', img: '', qrisUrl: '' });
  const [isUploadingProductImg, setIsUploadingProductImg] = useState(false);

  const [settingsForm, setSettingsForm] = useState<StoreSettings>(settings);
  const [waCountry, setWaCountry] = useState(COUNTRY_CODES[0]);
  const [waNumber, setWaNumber] = useState('');
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [searchCountry, setSearchCountry] = useState('');

  const [testimonials, setTestimonials] = useState<Testimonial[]>(content.testimonials || []);
  const [gallery, setGallery] = useState<GalleryItem[]>(content.gallery || []);
  const [faqs, setFaqs] = useState<FaqItem[]>(content.faqs || []);
  const [infos, setInfos] = useState<InfoSection[]>(content.infos || []);

  const [showTestiModal, setShowTestiModal] = useState(false);
  const [testiForm, setTestiForm] = useState<Partial<Testimonial>>({ rating: 5 });
  
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryForm, setGalleryForm] = useState({ title: '', img: '' });

  const [showFaqModal, setShowFaqModal] = useState(false);
  const [faqForm, setFaqForm] = useState({ q: '', a: '' });

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoForm, setInfoForm] = useState<Partial<InfoSection>>({});

  const filteredCountries = COUNTRY_CODES.filter(c => 
    c.name.toLowerCase().includes(searchCountry.toLowerCase()) || 
    c.code.includes(searchCountry)
  );

  useEffect(() => {
    if (settings) {
        setSettingsForm(settings);
        if (settings.whatsapp) {
            const found = COUNTRY_CODES.find(c => settings.whatsapp.startsWith(c.code.replace('+','')));
            if (found) {
                setWaCountry(found);
                setWaNumber(settings.whatsapp.substring(found.code.replace('+','').length));
            } else if (settings.whatsapp.startsWith('62')) {
                setWaCountry(COUNTRY_CODES.find(c => c.code === '+62') || COUNTRY_CODES[0]);
                setWaNumber(settings.whatsapp.substring(2));
            } else {
                 setWaNumber(settings.whatsapp);
            }
        }
    }
    setTestimonials(content.testimonials || []);
    setGallery(content.gallery || []);
    setFaqs(content.faqs || []);
    setInfos(content.infos || []);
  }, [settings, content]);

  useEffect(() => {
    const checkAuth = () => {
       const savedAuth = localStorage.getItem('yakult_admin_auth');
       if (savedAuth) {
         try {
             const { user: u, expire } = JSON.parse(savedAuth);
             if (u === ADMIN_CREDENTIALS.user && new Date().getTime() < expire) {
               setIsAuthenticated(true);
             }
         } catch (e) {
             localStorage.removeItem('yakult_admin_auth');
         }
       }
    };
    checkAuth();
  }, []);

  const stats = useMemo(() => {
    // FIX: Pastikan status 'completed' ada di type atau gunakan yang valid
    const confirmed = historyTransactions.filter(t => t.status === 'completed' || t.status === 'confirmed' || t.status === 'paid');
    const revenue = confirmed.reduce((sum, t) => sum + (t.total), 0);
    const totalItems = confirmed.reduce((sum, t) => sum + t.items.reduce((s, i) => s + i.qty, 0), 0);
    const totalLoss = losses.reduce((sum, l) => sum + l.amount, 0);
    
    return {
      revenue, 
      totalItems, 
      loss: totalLoss,
      net: revenue - totalLoss,
      pending: activeTransactions.length
    };
  }, [activeTransactions, historyTransactions, losses]);

  const handleLogin = () => {
    if (!user || !pass) return setLoginError("Isi username dan password!");
    setLoginError('');
    setIsLoggingIn(true);

    setTimeout(() => {
        if (user === ADMIN_CREDENTIALS.user && pass === ADMIN_CREDENTIALS.pass) {
            setIsAuthenticated(true);
            const expire = new Date().getTime() + (rememberMe ? 24 * 60 * 60 * 1000 : 30 * 60 * 1000);
            localStorage.setItem('yakult_admin_auth', JSON.stringify({ user, expire }));
        } else {
            setLoginError("Username atau Password Salah!");
        }
        setIsLoggingIn(false);
    }, 800);
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('yakult_admin_auth');
      setUser('');
      setPass('');
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = (e: React.MouseEvent, id: string, status: 'confirmed' | 'rejected') => {
      e.preventDefault();
      e.stopPropagation();
      try {
          updateStatus(id, status);
          status === 'confirmed' ? showToast('Pesanan Diterima!', 'success') : showToast('Pesanan Ditolak.', 'error');
      } catch (err) {
          showToast('Gagal memproses.', 'error');
      }
  };

  const handleClearData = async () => {
      if(!window.confirm("Yakin ingin menghapus SEMUA data?")) return;
      setIsGlobalLoading(true);
      await new Promise(r => setTimeout(r, 1000));
      clearData();
      setIsGlobalLoading(false);
  }

  const openProductModal = (product: Product | null = null) => {
      setEditingProduct(product);
      if (product) {
          setProductForm({ name: product.name, desc: product.desc, price: product.price.toString(), img: product.img, qrisUrl: product.qrisUrl || '' });
      } else {
          setProductForm({ name: '', desc: '', price: '', img: '', qrisUrl: '' });
      }
      setShowProductModal(true);
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'img' | 'qrisUrl') => {
      const file = e.target.files?.[0];
      if (file) {
          setIsUploadingProductImg(true);
          try {
              const compressedBase64 = await compressImage(file);
              setProductForm(prev => ({ ...prev, [field]: compressedBase64 }));
          } catch (error) {
              alert("Gagal memproses gambar.");
          } finally {
              setIsUploadingProductImg(false);
          }
      }
  };

  const handleSaveProduct = async () => {
      if (!productForm.name || !productForm.price) return alert("Nama dan Harga wajib diisi!");
      setIsGlobalLoading(true);
      
      const price = Number(productForm.price);
      let newProducts = [...products];
      if (editingProduct) {
          newProducts = newProducts.map(p => p.id === editingProduct.id ? { ...p, ...productForm, price } : p);
      } else {
          const newId = Math.max(...products.map(p => p.id), 0) + 1;
          newProducts.push({ id: newId, ...productForm, price });
      }
      saveProducts(newProducts);
      
      setIsGlobalLoading(false);
      setShowProductModal(false);
  };

  const handleDeleteProduct = (id: number) => {
      if (confirm('Hapus produk ini?')) {
          saveProducts(products.filter(p => p.id !== id));
      }
  };

  const handleWaNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, ''); 
      if (val.startsWith('0')) val = val.substring(1); 
      setWaNumber(val);
      const cleanPrefix = waCountry.code.replace('+', '');
      setSettingsForm(prev => ({ ...prev, whatsapp: `${cleanPrefix}${val}` }));
  };

  const selectCountry = (c: typeof COUNTRY_CODES[0]) => {
      setWaCountry(c);
      setIsCountryPickerOpen(false);
      setSearchCountry('');
      const cleanPrefix = c.code.replace('+', '');
      setSettingsForm(prev => ({ ...prev, whatsapp: `${cleanPrefix}${waNumber}` }));
  };

  const handleSaveSettings = async () => {
      if (!settingsForm.storeName || !settingsForm.whatsapp) return alert("Nama Toko & WA Wajib diisi!");
      setIsGlobalLoading(true);
      saveSettings(settingsForm);
      setIsGlobalLoading(false);
      showToast('Pengaturan Berhasil Disimpan!', 'success');
  };

  const handleQrisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          try {
              const compressedBase64 = await compressImage(file);
              setSettingsForm({ ...settingsForm, qrisImageUrl: compressedBase64 });
          } catch (e) {
              alert("Gagal memproses gambar.");
          }
      }
  };

  const handleAddLoss = async () => {
      if(!lossForm.amt || !lossForm.desc) return alert('Data tidak lengkap!');
      setIsGlobalLoading(true);
      addLoss({ id: `LOSS-${Date.now()}`, amount: Number(lossForm.amt), description: lossForm.desc, timestamp: Date.now() });
      setIsGlobalLoading(false);
      setShowLossModal(false); 
      setLossForm({ amt: '', desc: '' });
  };

  const calculateRating = (items: Testimonial[]) => {
      if (items.length === 0) return 5.0;
      const sum = items.reduce((a, b) => a + b.rating, 0);
      const avg = sum / items.length;
      return avg < 5 ? parseFloat(avg.toFixed(1)) : 5.0;
  };

  const handleSaveTesti = () => {
      if (!testiForm.name || !testiForm.text) return alert("Nama dan Ulasan wajib diisi");
      const newTesti: Testimonial = {
          id: testiForm.id || `T-${Date.now()}`,
          name: testiForm.name || 'Anonim',
          text: testiForm.text || '',
          rating: testiForm.rating || 5,
          img: testiForm.img,
          role: testiForm.role || 'Pelanggan',
      };
      
      let newTestimonials = [...testimonials];
      if (testiForm.id) {
          newTestimonials = newTestimonials.map(t => t.id === testiForm.id ? newTesti : t);
      } else {
          newTestimonials.push(newTesti);
      }
      
      const newRating = calculateRating(newTestimonials);
      saveContent({ ...content, testimonials: newTestimonials, shopRating: newRating });
      setShowTestiModal(false);
      setTestiForm({ rating: 5 });
  };

  const handleDeleteTesti = (id: string) => {
      if (confirm('Hapus testimoni ini?')) {
          const newTestimonials = testimonials.filter(t => t.id !== id);
          const newRating = calculateRating(newTestimonials);
          saveContent({ ...content, testimonials: newTestimonials, shopRating: newRating });
      }
  };

  const handleTestiImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const base64 = await compressImage(file);
          setTestiForm(prev => ({ ...prev, img: base64 }));
      }
  };

  const handleSaveGallery = () => {
      if (!galleryForm.img) return alert("Gambar wajib upload");
      const newItem: GalleryItem = {
          id: `G-${Date.now()}`,
          title: galleryForm.title || 'Dokumentasi',
          img: galleryForm.img
      };
      const newGallery = [newItem, ...gallery];
      saveContent({ ...content, gallery: newGallery });
      setShowGalleryModal(false);
      setGalleryForm({ title: '', img: '' });
  };

  const handleDeleteGallery = (id: string) => {
      if(confirm('Hapus foto ini?')) {
          const newGallery = gallery.filter(g => g.id !== id);
          saveContent({ ...content, gallery: newGallery });
      }
  };

  const handleGalleryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const base64 = await compressImage(file);
          setGalleryForm(prev => ({ ...prev, img: base64 }));
      }
  };

  const handleSaveFaq = () => {
      if (!faqForm.q || !faqForm.a) return alert("Isi Pertanyaan & Jawaban");
      const newFaq: FaqItem = { id: `F-${Date.now()}`, question: faqForm.q, answer: faqForm.a };
      const newFaqs = [...faqs, newFaq];
      saveContent({ ...content, faqs: newFaqs });
      setShowFaqModal(false);
      setFaqForm({ q: '', a: '' });
  };

  const handleDeleteFaq = (id: string) => {
      saveContent({ ...content, faqs: faqs.filter(f => f.id !== id) });
  };

  const handleSaveInfo = () => {
      if (!infoForm.title || !infoForm.content) return alert("Lengkapi data info");
      const newInfo: InfoSection = {
          id: infoForm.id || `I-${Date.now()}`,
          title: infoForm.title || '',
          content: infoForm.content || '',
          icon: infoForm.icon || 'info',
          isActive: true
      };
      let newInfos = [...infos];
      if (infoForm.id) {
          newInfos = newInfos.map(i => i.id === infoForm.id ? newInfo : i);
      } else {
          newInfos.push(newInfo);
      }
      saveContent({ ...content, infos: newInfos });
      setShowInfoModal(false);
      setInfoForm({});
  };

  const handleDeleteInfo = (id: string) => {
      saveContent({ ...content, infos: infos.filter(i => i.id !== id) });
  };

  const handleDownloadSource = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      Object.entries(PROJECT_FILES).forEach(([filename, content]) => {
        zip.file(filename, content as string);
      });
      const blob = await zip.generateAsync({type:"blob"});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "yakult-shop-source-code.zip";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Source Code berhasil didownload!', 'success');
    } catch (error) {
      console.error(error);
      showToast('Gagal membuat ZIP (Pastikan file source tersedia).', 'error');
    } finally {
      setIsZipping(false);
    }
  };

  const generatePDF = () => {
    if (!window.jspdf) return alert('Library PDF belum dimuat. Refresh halaman.');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Laporan Keuangan', 14, 22);
    doc.setFontSize(11);
    doc.text(`Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 30);
    doc.text(`Pendapatan Bersih: ${formatCurrency(stats.net)}`, 14, 40);
    doc.autoTable({
        startY: 50,
        head: [['Waktu', 'Pelanggan', 'Items', 'Total', 'Status']],
        body: historyTransactions.map(t => [
            new Date(t.timestamp).toLocaleDateString(),
            t.customer.name,
            t.items.map(i => `${i.name} (${i.qty})`).join(', '),
            formatCurrency(t.total),
            t.status.toUpperCase()
        ]),
    });
    doc.save('Laporan_Tokotoparya.pdf');
  };

  if (!isAuthenticated) return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-white rounded-[40px] p-8 text-center shadow-2xl">
              <h1 className="text-2xl font-black mb-4 text-slate-800">Admin Login</h1>
              <input type="text" value={user} onChange={e => setUser(e.target.value)} className="w-full bg-slate-100 p-4 rounded-xl mb-3 outline-none focus:ring-2 focus:ring-rose-500" placeholder="Username" />
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="w-full bg-slate-100 p-4 rounded-xl mb-4 outline-none focus:ring-2 focus:ring-rose-500" placeholder="Password" />
              {loginError && <p className="text-red-500 text-sm mb-4 font-bold">{loginError}</p>}
              <button onClick={handleLogin} disabled={isLoggingIn} className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all">
                  {isLoggingIn ? <Loader2 className="animate-spin mx-auto"/> : 'MASUK'}
              </button>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      
      {/* Toast */}
      {toast && (<div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 rounded-2xl text-white font-bold shadow-lg animate-in fade-in slide-in-from-bottom-4 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>{toast.msg}</div>)}
      
      {/* Mobile Menu */}
      <div className="md:hidden fixed top-4 right-4 z-[60]"><button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-slate-900 text-white rounded-full shadow-lg"><Menu size={24}/></button></div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-72 bg-slate-900 text-white p-6 flex flex-col z-50 transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 shadow-xl`}>
        <h1 className="text-2xl font-black text-rose-500 mb-8 px-2 tracking-tighter">TOKOTOPARYA<span className="text-white">.ADMIN</span></h1>
        <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dash', label: 'Dashboard', icon: LayoutDashboard }, 
            { id: 'active', label: 'Pesanan', icon: ShoppingBag, badge: stats.pending }, 
            { id: 'history', label: 'Riwayat', icon: History }, 
            { id: 'products', label: 'Produk', icon: Package }, 
            { id: 'content', label: 'Konten', icon: BookOpen }, 
            { id: 'settings', label: 'Pengaturan', icon: Settings }, 
            { id: 'losses', label: 'Kerugian', icon: TrendingDown }
          ].map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-rose-600 text-white shadow-rose-500/30 shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}>
              <div className="flex items-center gap-3"><item.icon size={18}/> {item.label}</div>{item.badge ? <span className="bg-white text-rose-600 text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">{item.badge}</span> : null}
            </button>
          ))}
        </nav>
        
        {/* Sidebar Footer Actions */}
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          <button onClick={() => navigate('/')} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2"><Store size={16}/> BUKA TOKO</button>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setShowLossModal(true)} className="w-full py-3 border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 rounded-2xl font-bold text-xs transition-all">Input Rugi</button>
            <button onClick={generatePDF} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold text-xs transition-all">Laporan PDF</button>
          </div>
          
          <button onClick={handleDownloadSource} disabled={isZipping} className="w-full py-3 bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 rounded-2xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2">
            {isZipping ? <Loader2 size={16} className="animate-spin"/> : <><FileCode2 size={16}/> DOWNLOAD SOURCE</>}
          </button>

          <button onClick={handleClearData} disabled={isGlobalLoading} className="w-full py-3 border border-rose-500/20 text-rose-500/50 hover:bg-rose-500/10 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2"><Trash2 size={14}/> RESET DATA</button>
          <button onClick={handleLogout} className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-500 rounded-2xl font-bold text-xs transition-all">LOGOUT</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto h-screen">
        
        {/* --- DASHBOARD TAB --- */}
        {activeTab === 'dash' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-3xl font-black mb-8 text-slate-800">Ringkasan Toko</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                        <div className="flex items-center gap-3 mb-2 text-slate-400"><Wallet size={20}/><p className="text-xs font-bold uppercase">Pendapatan Kotor</p></div>
                        <p className="text-2xl font-black text-slate-800">{formatCurrency(stats.revenue)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                         <div className="flex items-center gap-3 mb-2 text-emerald-500"><TrendingDown className="rotate-180" size={20}/><p className="text-xs font-bold uppercase">Pendapatan Bersih</p></div>
                        <p className="text-2xl font-black text-emerald-600">{formatCurrency(stats.net)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                         <div className="flex items-center gap-3 mb-2 text-rose-500"><TrendingDown size={20}/><p className="text-xs font-bold uppercase">Total Kerugian</p></div>
                        <p className="text-2xl font-black text-rose-600">{formatCurrency(stats.loss)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100">
                         <div className="flex items-center gap-3 mb-2 text-blue-500"><ShoppingBag size={20}/><p className="text-xs font-bold uppercase">Item Terjual</p></div>
                        <p className="text-2xl font-black text-slate-800">{stats.totalItems} <span className="text-sm text-slate-400 font-medium">pcs</span></p>
                    </div>
                </div>
                
                {/* Recent Activity Preview */}
                <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><History size={20}/> Transaksi Terakhir</h3>
                    {historyTransactions.length === 0 ? <p className="text-slate-400 text-sm">Belum ada riwayat transaksi.</p> : (
                        <div className="space-y-4">
                            {historyTransactions.slice(0, 5).map(t => (
                                <div key={t.id} className="flex items-center justify-between border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-bold text-slate-800">{t.customer.name}</p>
                                        <p className="text-xs text-slate-400">{new Date(t.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-emerald-600">+{formatCurrency(t.total)}</p>
                                        <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded-full text-slate-500">{t.status.toUpperCase()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* --- ACTIVE ORDERS TAB --- */}
        {activeTab === 'active' && (
             <div className="animate-in fade-in duration-500">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black">Pesanan Masuk <span className="text-rose-600">({activeTransactions.length})</span></h2>
                 </div>
                 <div className="grid gap-4">
                    {activeTransactions.length === 0 ? (
                        <div className="bg-white p-12 rounded-[32px] text-center border-2 border-dashed border-slate-200">
                            <ShoppingBag className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-400 font-bold">Belum ada pesanan baru.</p>
                        </div>
                    ) : (
                        activeTransactions.map(t => (
                            <div key={t.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 hover:shadow-md transition-all">
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded-lg">ID: {t.id}</span>
                                            <span className="text-slate-400 text-xs font-bold flex items-center gap-1"><Clock size={12}/> {new Date(t.timestamp).toLocaleString()}</span>
                                        </div>
                                        <h3 className="font-black text-xl text-slate-800">{t.customer.name}</h3>
                                        <p className="text-slate-500 text-sm">{t.customer.wa}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-rose-600">{formatCurrency(t.total)}</p>
                                        <p className="text-xs text-slate-400 font-bold">Via {t.type.toUpperCase()}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 p-4 rounded-2xl mb-4">
                                    <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Item Pesanan</p>
                                    {t.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm font-bold text-slate-700 mb-1 last:mb-0">
                                            <span>{item.qty}x {item.name}</span>
                                            <span>{formatCurrency(item.price * item.qty)}</span>
                                        </div>
                                    ))}
                                </div>
                                
                                {t.proofUrl && (
                                    <div className="mb-4">
                                        <p className="text-xs font-bold text-slate-400 mb-2">BUKTI BAYAR:</p>
                                        <a href={t.proofUrl} target="_blank" rel="noreferrer" className="block w-full h-32 bg-slate-100 rounded-xl overflow-hidden relative group">
                                            <img src={t.proofUrl} className="w-full h-full object-cover" alt="Bukti"/>
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Eye className="text-white"/>
                                            </div>
                                        </a>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button onClick={(e) => handleAction(e, t.id, 'confirmed')} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"><CheckCircle size={18}/> Terima Pesanan</button>
                                    <button onClick={(e) => handleAction(e, t.id, 'rejected')} className="flex-1 py-3 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"><XCircle size={18}/> Tolak</button>
                                </div>
                            </div>
                        ))
                    )}
                 </div>
             </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && (
             <div className="animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black">Kelola Produk</h2>
                    <button onClick={() => openProductModal()} className="bg-rose-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-all"><PlusCircle size={20}/> Tambah</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(p => (
                        <div key={p.id} className="bg-white p-4 rounded-[28px] shadow-sm border border-slate-100 group hover:border-rose-200 transition-all">
                            <div className="h-40 bg-slate-100 rounded-2xl mb-4 overflow-hidden relative">
                                {p.img ? <img src={p.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name}/> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon/></div>}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openProductModal(p)} className="p-2 bg-white text-slate-800 rounded-full shadow-lg hover:bg-rose-50"><Edit size={14}/></button>
                                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-white text-rose-500 rounded-full shadow-lg hover:bg-rose-50"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-slate-800 mb-1">{p.name}</h3>
                            <p className="text-rose-600 font-black text-lg">{formatCurrency(p.price)}</p>
                        </div>
                    ))}
                </div>
             </div>
        )}

        {/* --- SETTINGS TAB --- */}
        {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 animate-in zoom-in-95 duration-300">
                <h2 className="text-2xl font-black mb-6">Pengaturan Toko</h2>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 ml-2 uppercase">Nama Toko</label>
                        <input value={settingsForm.storeName} onChange={e => setSettingsForm({...settingsForm, storeName: e.target.value})} className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="Contoh: Toko Keren" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2 ml-2 uppercase">Nomor WhatsApp Admin</label>
                        <div className="flex gap-2">
                             <div className="relative">
                                <button onClick={() => setIsCountryPickerOpen(!isCountryPickerOpen)} className="h-full px-4 bg-slate-100 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-colors">
                                    <span>{waCountry.flag}</span>
                                    <span>{waCountry.code}</span>
                                    <ChevronDown size={14}/>
                                </button>
                                {isCountryPickerOpen && (
                                    <div className="absolute top-full mt-2 left-0 w-64 max-h-60 overflow-y-auto bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-2">
                                        <div className="sticky top-0 bg-white p-2 border-b border-slate-50 mb-2">
                                            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                                                <Search size={14} className="text-slate-400"/>
                                                <input autoFocus value={searchCountry} onChange={e => setSearchCountry(e.target.value)} placeholder="Cari negara..." className="bg-transparent w-full text-xs font-bold outline-none"/>
                                            </div>
                                        </div>
                                        {filteredCountries.map(c => (
                                            <button key={c.code} onClick={() => selectCountry(c)} className="w-full text-left px-4 py-3 hover:bg-slate-50 rounded-xl flex items-center gap-3 text-sm font-bold">
                                                <span>{c.flag}</span>
                                                <span className="text-slate-500">{c.name}</span>
                                                <span className="ml-auto text-rose-600">{c.code}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                             </div>
                             <input type="tel" value={waNumber} onChange={handleWaNumberChange} className="flex-1 bg-slate-50 border-none p-4 rounded-2xl font-bold text-slate-800 focus:ring-2 focus:ring-rose-500 outline-none" placeholder="812345678" />
                        </div>
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-slate-400 mb-2 ml-2 uppercase">Gambar QRIS (Opsional)</label>
                         <div className="flex items-center gap-4">
                             <div className="w-24 h-24 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                                 {settingsForm.qrisImageUrl ? <img src={settingsForm.qrisImageUrl} className="w-full h-full object-cover"/> : <QrCode className="text-slate-300"/>}
                             </div>
                             <input type="file" onChange={handleQrisUpload} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100"/>
                         </div>
                    </div>

                    <button onClick={handleSaveSettings} disabled={isGlobalLoading} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                        {isGlobalLoading ? <Loader2 className="animate-spin"/> : <><Save size={20}/> Simpan Pengaturan</>}
                    </button>
                </div>
            </div>
        )}

        {/* --- CONTENT MANAGEMENT TAB --- */}
        {activeTab === 'content' && (
             <div className="animate-in fade-in duration-500">
                <div className="flex items-center gap-4 mb-6 overflow-x-auto pb-2">
                    {['testimoni', 'gallery', 'faq', 'info'].map(t => (
                        <button key={t} onClick={() => setContentSubTab(t as any)} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${contentSubTab === t ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/30' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>
                            {t.charAt(0).toUpperCase() + t.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Sub-tab: Testimoni */}
                {contentSubTab === 'testimoni' && (
                    <div>
                         <button onClick={() => setShowTestiModal(true)} className="mb-6 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all"><PlusCircle size={18}/> Tambah Testimoni</button>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {testimonials.map(t => (
                                 <div key={t.id} className="bg-white p-6 rounded-[24px] shadow-sm relative group">
                                     <div className="flex items-start gap-4">
                                         <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                             {t.img ? <img src={t.img} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">{t.name.charAt(0)}</div>}
                                         </div>
                                         <div>
                                             <h4 className="font-bold">{t.name}</h4>
                                             <div className="flex text-amber-400 mb-2">{[...Array(5)].map((_,i) => <Star key={i} size={12} fill={i < t.rating ? "currentColor" : "none"} className={i >= t.rating ? "text-slate-200" : ""}/>)}</div>
                                             <p className="text-sm text-slate-500 italic">"{t.text}"</p>
                                         </div>
                                     </div>
                                     <button onClick={() => handleDeleteTesti(t.id)} className="absolute top-4 right-4 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}

                 {/* Sub-tab: Gallery */}
                 {contentSubTab === 'gallery' && (
                    <div>
                         <button onClick={() => setShowGalleryModal(true)} className="mb-6 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all"><PlusCircle size={18}/> Upload Foto</button>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {gallery.map(g => (
                                 <div key={g.id} className="aspect-square bg-white p-2 rounded-2xl shadow-sm relative group">
                                     <img src={g.img} className="w-full h-full object-cover rounded-xl" />
                                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                         <button onClick={() => handleDeleteGallery(g.id)} className="p-3 bg-white text-rose-500 rounded-full"><Trash2 size={20}/></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
                 )}

                 {/* Sub-tab: FAQ */}
                 {contentSubTab === 'faq' && (
                    <div className="max-w-3xl">
                         <button onClick={() => setShowFaqModal(true)} className="mb-6 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all"><PlusCircle size={18}/> Tambah FAQ</button>
                         <div className="space-y-3">
                             {faqs.map(f => (
                                 <div key={f.id} className="bg-white p-6 rounded-[24px] shadow-sm flex justify-between items-start gap-4">
                                     <div>
                                         <h4 className="font-bold text-slate-800 mb-2">Q: {f.question}</h4>
                                         <p className="text-slate-500 text-sm">A: {f.answer}</p>
                                     </div>
                                     <button onClick={() => handleDeleteFaq(f.id)} className="text-slate-300 hover:text-rose-500"><Trash2 size={18}/></button>
                                 </div>
                             ))}
                         </div>
                    </div>
                 )}
                
                 {/* Sub-tab: Info Section */}
                 {contentSubTab === 'info' && (
                    <div className="max-w-3xl">
                         <button onClick={() => setShowInfoModal(true)} className="mb-6 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all"><PlusCircle size={18}/> Tambah Info</button>
                         <div className="space-y-3">
                             {infos.map(i => (
                                 <div key={i.id} className="bg-white p-6 rounded-[24px] shadow-sm flex justify-between items-center gap-4">
                                     <div className="flex items-center gap-4">
                                         <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Info size={20}/></div>
                                         <div>
                                             <h4 className="font-bold text-slate-800">{i.title}</h4>
                                             <p className="text-slate-500 text-xs truncate max-w-xs">{i.content}</p>
                                         </div>
                                     </div>
                                     <div className="flex gap-2">
                                        <button onClick={() => { setInfoForm(i); setShowInfoModal(true); }} className="p-2 text-slate-400 hover:text-blue-500"><Edit size={18}/></button>
                                        <button onClick={() => handleDeleteInfo(i.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={18}/></button>
                                     </div>
                                 </div>
                             ))}
                         </div>
                    </div>
                 )}
             </div>
        )}

        {/* --- HISTORY & LOSSES TAB --- */}
        {(activeTab === 'history' || activeTab === 'losses') && (
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
                <h2 className="text-2xl font-black mb-6">{activeTab === 'history' ? 'Riwayat Transaksi' : 'Catatan Kerugian'}</h2>
                <div className="overflow-x-auto">
                    {activeTab === 'history' ? (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-xs uppercase border-b border-slate-100">
                                    <th className="pb-3 pl-2">Tanggal</th>
                                    <th className="pb-3">Pelanggan</th>
                                    <th className="pb-3">Produk</th>
                                    <th className="pb-3 text-right pr-2">Total</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {historyTransactions.map(t => (
                                    <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 pl-2 font-bold text-slate-500">{new Date(t.timestamp).toLocaleDateString()}</td>
                                        <td className="py-4 font-bold text-slate-800">{t.customer.name}</td>
                                        <td className="py-4 text-slate-500">{t.items.length} items</td>
                                        <td className="py-4 text-right pr-2 font-black text-emerald-600">+{formatCurrency(t.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                         <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-400 text-xs uppercase border-b border-slate-100">
                                    <th className="pb-3 pl-2">Tanggal</th>
                                    <th className="pb-3">Keterangan</th>
                                    <th className="pb-3 text-right pr-2">Nominal</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {losses.map(l => (
                                    <tr key={l.id} className="border-b border-slate-50 last:border-0">
                                        <td className="py-4 pl-2 font-bold text-slate-500">{new Date(l.timestamp).toLocaleDateString()}</td>
                                        <td className="py-4 text-slate-700">{l.description}</td>
                                        <td className="py-4 text-right pr-2 font-black text-rose-500">-{formatCurrency(l.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* --- MODALS --- */}
      
      {/* Product Modal */}
      {showProductModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
              <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                  <h3 className="text-2xl font-black mb-6">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h3>
                  <div className="space-y-4">
                      <div className="flex items-center gap-4 mb-4">
                          <label className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center cursor-pointer border-2 border-dashed border-slate-200 hover:bg-slate-100 overflow-hidden">
                              {productForm.img ? <img src={productForm.img} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-300"/>}
                              <input type="file" className="hidden" onChange={e => handleProductImageUpload(e, 'img')} />
                          </label>
                          <div className="text-xs text-slate-400">
                              <p className="font-bold">Foto Produk</p>
                              <p>Klik kotak untuk upload</p>
                          </div>
                      </div>
                      <input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-rose-500" placeholder="Nama Produk" />
                      <input type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-rose-500" placeholder="Harga (Rp)" />
                      <textarea value={productForm.desc} onChange={e => setProductForm({...productForm, desc: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-medium outline-none focus:ring-2 focus:ring-rose-500 h-24" placeholder="Deskripsi singkat..." />
                      
                      <div className="flex gap-3 mt-6">
                          <button onClick={() => setShowProductModal(false)} className="flex-1 py-4 text-slate-400 font-bold hover:bg-slate-50 rounded-2xl">Batal</button>
                          <button onClick={handleSaveProduct} disabled={isUploadingProductImg || isGlobalLoading} className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-500/30">Simpan</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Testimoni Modal */}
      {showTestiModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-md rounded-[32px] p-8 animate-in zoom-in-95">
                  <h3 className="text-xl font-black mb-4">Input Testimoni</h3>
                  <input value={testiForm.name || ''} onChange={e => setTestiForm({...testiForm, name: e.target.value})} className="w-full mb-4 p-4 bg-slate-50 rounded-2xl font-bold" placeholder="Nama Pelanggan" />
                  <div className="mb-4">
                      <p className="text-xs font-bold text-slate-400 mb-2">Rating</p>
                      <div className="flex gap-2">
                          {[1,2,3,4,5].map(s => (
                              <button key={s} onClick={() => setTestiForm({...testiForm, rating: s})} className={`p-2 rounded-lg ${testiForm.rating && testiForm.rating >= s ? 'text-amber-400 bg-amber-50' : 'text-slate-200'}`}><Star fill="currentColor" size={24}/></button>
                          ))}
                      </div>
                  </div>
                  <textarea value={testiForm.text || ''} onChange={e => setTestiForm({...testiForm, text: e.target.value})} className="w-full mb-4 p-4 bg-slate-50 rounded-2xl" placeholder="Apa kata mereka?" />
                  <div className="flex gap-2">
                      <button onClick={() => setShowTestiModal(false)} className="flex-1 py-3 text-slate-400 font-bold">Batal</button>
                      <button onClick={handleSaveTesti} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-bold">Simpan</button>
                  </div>
              </div>
          </div>
      )}

      {/* Loss Modal */}
      {showLossModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-sm rounded-[48px] p-8 shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
                  <h3 className="text-2xl font-black text-slate-800 mb-6">Input Kerugian</h3>
                  <div className="space-y-4">
                      <input type="number" placeholder="Nominal (Rp)" value={lossForm.amt} onChange={e => setLossForm({...lossForm, amt: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold text-lg outline-none focus:ring-2 focus:ring-rose-500" />
                      <input type="text" placeholder="Keterangan (e.g. Barang rusak)" value={lossForm.desc} onChange={e => setLossForm({...lossForm, desc: e.target.value})} className="w-full bg-slate-50 border-none rounded-2xl p-5 font-bold outline-none focus:ring-2 focus:ring-rose-500" />
                      <button onClick={handleAddLoss} disabled={isGlobalLoading} className="w-full py-5 bg-rose-500 text-white rounded-3xl font-black shadow-xl mt-4 flex items-center justify-center hover:scale-[1.02] transition-transform">
                          {isGlobalLoading ? <Loader2 className="animate-spin" size={20}/> : 'SIMPAN DATA'}
                      </button>
                      <button onClick={() => setShowLossModal(false)} className="w-full py-4 text-slate-400 font-bold">Batal</button>
                  </div>
              </div>
          </div>
      )}

      {/* Gallery Modal */}
      {showGalleryModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-xl font-black mb-4">Upload Dokumentasi</h3>
                  <div className="space-y-4">
                      <input type="text" placeholder="Judul Foto" className="w-full bg-slate-50 p-3 rounded-xl font-bold outline-none" value={galleryForm.title} onChange={e => setGalleryForm({...galleryForm, title: e.target.value})} />
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 relative overflow-hidden">
                          {galleryForm.img ? <img src={galleryForm.img} className="w-full h-full object-cover"/> : <div className="text-center text-slate-400"><UploadCloud className="mx-auto mb-2"/><span className="text-xs font-bold">Klik Upload</span></div>}
                          <input type="file" className="hidden" onChange={handleGalleryImage} />
                      </label>
                      <button onClick={handleSaveGallery} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Simpan</button>
                      <button onClick={() => setShowGalleryModal(false)} className="w-full py-3 text-slate-400 font-bold">Batal</button>
                  </div>
              </div>
          </div>
      )}

      {/* FAQ Modal */}
      {showFaqModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-xl font-black mb-4">Edit FAQ</h3>
                  <div className="space-y-3">
                      <input type="text" placeholder="Pertanyaan (Q)" className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none" value={faqForm.q} onChange={e => setFaqForm({...faqForm, q: e.target.value})} />
                      <textarea placeholder="Jawaban (A)" className="w-full bg-slate-50 p-4 rounded-xl font-medium outline-none h-32" value={faqForm.a} onChange={e => setFaqForm({...faqForm, a: e.target.value})} />
                      <button onClick={handleSaveFaq} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Simpan</button>
                      <button onClick={() => setShowFaqModal(false)} className="w-full py-3 text-slate-400 font-bold">Batal</button>
                  </div>
              </div>
          </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
          <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6">
              <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95">
                  <h3 className="text-xl font-black mb-4">Edit Info Section</h3>
                  <div className="space-y-3">
                      <input type="text" placeholder="Judul Info (e.g. Pengiriman)" className="w-full bg-slate-50 p-4 rounded-xl font-bold outline-none" value={infoForm.title || ''} onChange={e => setInfoForm({...infoForm, title: e.target.value})} />
                      <textarea placeholder="Konten Info" className="w-full bg-slate-50 p-4 rounded-xl font-medium outline-none h-24" value={infoForm.content || ''} onChange={e => setInfoForm({...infoForm, content: e.target.value})} />
                      <button onClick={handleSaveInfo} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold">Simpan</button>
                      <button onClick={() => setShowInfoModal(false)} className="w-full py-3 text-slate-400 font-bold">Batal</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminDashboard;
