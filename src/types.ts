export type PaymentType = 'cash' | 'qris';
// Tambahkan 'completed' agar tidak error saat AdminDashboard mengecek status tersebut
export type OrderStatus = 'pending' | 'confirmed' | 'rejected' | 'cancelled' | 'paid' | 'completed';

export interface OrderItem {
  id: number;
  name: string;
  qty: number;
  price: number;
}

export interface Customer {
  name: string;
  wa: string; // Menggunakan 'wa', bukan 'whatsapp'
  address: string;
  lat?: number;
  lng?: number;
}

export interface Transaction {
  id: string;
  type: PaymentType; // Menggunakan 'type', bukan 'paymentMethod'
  customer: Customer;
  items: OrderItem[];
  total: number;
  fee: number;
  status: OrderStatus;
  timestamp: number;
  proofUrl?: string; // Menggunakan 'proofUrl', bukan 'proof'
}

export interface LossRecord {
  id: string;
  amount: number;
  description: string;
  timestamp: number;
}

export interface Product {
  id: number;
  name: string;
  desc: string;
  price: number;
  img: string;
  qrisUrl?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  text: string;
  rating: number;
  img?: string;
  role?: string;
  timestamp?: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  img: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface InfoSection {
  id: string;
  title: string;
  content: string;
  icon: 'truck' | 'star' | 'info' | 'clock' | 'shield';
  isActive: boolean;
}

export interface StoreContent {
  testimonials: Testimonial[];
  gallery: GalleryItem[];
  faqs: FaqItem[];
  infos: InfoSection[];
  shopRating: number;
}

export interface StoreSettings {
  storeName: string;
  whatsapp: string;
  qrisImageUrl: string;
  qrisTimerMinutes: number;
}
