import type { Currency, Locale } from './domain';

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  youtube?: string;
  tiktok?: string;
  pinterest?: string;
}

export interface BusinessSettings {
  name: string;
  tagline_en?: string;
  tagline_id?: string;
  email: string;
  whatsapp: string; // international digits only, e.g. 6281234567890
  phone_display?: string;
  address_en?: string;
  address_id?: string;
  maps_url?: string;
  hours_en?: string;
  hours_id?: string;
  logo_url?: string;
  favicon_url?: string;
  socials: SocialLinks;
  is_demo?: boolean;
}

export interface LocalizationSettings {
  default_language: Locale;
  default_currency: Currency;
  usd_to_idr: number;
}

export interface AnnouncementSettings {
  enabled: boolean;
  text_en: string;
  text_id: string;
  link?: string;
}

export interface CommerceSettings {
  moq_note_en?: string;
  moq_note_id?: string;
  production_info_en?: string;
  production_info_id?: string;
  shipping_info_en?: string;
  shipping_info_id?: string;
}

export interface SeoSettings {
  title_en?: string;
  title_id?: string;
  description_en?: string;
  description_id?: string;
  og_image?: string;
}

export interface WhatsappTemplates {
  general_en?: string;
  general_id?: string;
  product_en?: string;
  product_id?: string;
  inquiry_en?: string;
  inquiry_id?: string;
}

export interface ClientLogo {
  name: string;
  logo_url?: string;
  is_demo?: boolean;
}

export interface FactItem {
  value: string;
  label_en: string;
  label_id: string;
}

export type ContentFields = Record<string, string | undefined>;

export interface ContentSettings {
  home?: ContentFields;
  about?: ContentFields;
  about_facts?: FactItem[];
  custom?: ContentFields;
  export?: ContentFields;
  clients?: ClientLogo[];
}

export interface SiteSettings {
  business: BusinessSettings;
  localization: LocalizationSettings;
  announcement: AnnouncementSettings;
  commerce: CommerceSettings;
  seo: SeoSettings;
  whatsapp: WhatsappTemplates;
  content: ContentSettings;
}
