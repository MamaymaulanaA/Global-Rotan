import type { SiteSettings } from '@/types/settings';

/**
 * Fallback values used when a setting has not been saved in the dashboard yet.
 * Contact details are clearly marked as demo and must be replaced by the admin.
 */
export const DEFAULT_SETTINGS: SiteSettings = {
  business: {
    name: 'Global Rotan',
    tagline_en: 'Indonesian rattan furniture for homes, hospitality and projects worldwide.',
    tagline_id: 'Furnitur rotan Indonesia untuk hunian, hospitality, dan proyek di seluruh dunia.',
    email: 'hello@globalrotan.example',
    whatsapp: '6281200000000',
    phone_display: '+62 812-0000-0000',
    address_en: 'Workshop address — update in Admin › Settings (demo)',
    address_id: 'Alamat workshop — ubah di Admin › Pengaturan (demo)',
    hours_en: 'Mon–Sat, 08:00–17:00 (GMT+7)',
    hours_id: 'Senin–Sabtu, 08.00–17.00 WIB',
    socials: {},
    is_demo: true,
  },
  localization: {
    default_language: 'en',
    default_currency: 'USD',
    usd_to_idr: 16250,
  },
  announcement: {
    enabled: true,
    text_en: 'Worldwide Shipping and Custom Furniture Available.',
    text_id: 'Melayani Pengiriman Internasional dan Furnitur Custom.',
    link: '/custom-furniture',
  },
  commerce: {},
  seo: {},
  whatsapp: {
    general_en: 'Hello Global Rotan, I would like to ask about your rattan furniture.',
    general_id: 'Halo Global Rotan, saya ingin bertanya tentang furnitur rotan Anda.',
    product_en:
      'Hello Global Rotan, I am interested in this product:\n\n• Product: {product_name}\n• SKU: {sku}\n• Color: {color}\n• Size: {size}\n• Quantity: {quantity}\n• Link: {url}\n\nCould you share pricing and availability?',
    product_id:
      'Halo Global Rotan, saya tertarik dengan produk ini:\n\n• Produk: {product_name}\n• SKU: {sku}\n• Warna: {color}\n• Ukuran: {size}\n• Jumlah: {quantity}\n• Tautan: {url}\n\nMohon info harga dan ketersediaannya.',
    inquiry_en:
      'Hello Global Rotan, I have just sent a quotation request.\n\n• Inquiry number: {inquiry_number}\n• Name: {name}\n• Products: {items}\n\nI look forward to your reply.',
    inquiry_id:
      'Halo Global Rotan, saya baru saja mengirim permintaan penawaran.\n\n• Nomor permintaan: {inquiry_number}\n• Nama: {name}\n• Produk: {items}\n\nTerima kasih, saya tunggu kabarnya.',
  },
  content: {
    home: {},
    about: {},
    about_facts: [],
    custom: {},
    export: {},
    clients: [],
  },
};

export const SETTINGS_KEYS = [
  'business',
  'localization',
  'announcement',
  'commerce',
  'seo',
  'whatsapp',
  'content',
] as const;
export type SettingsKey = (typeof SETTINGS_KEYS)[number];
