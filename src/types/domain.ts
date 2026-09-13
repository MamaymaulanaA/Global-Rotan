export type Locale = 'en' | 'id';
export type Currency = 'USD' | 'IDR';

export const PRICE_DISPLAY_TYPES = ['starting_from', 'estimated', 'fixed', 'contact', 'wholesale_request'] as const;
export type PriceDisplayType = (typeof PRICE_DISPLAY_TYPES)[number];

export const PRODUCT_STATUSES = ['draft', 'published', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const AVAILABILITIES = ['ready_stock', 'made_to_order'] as const;
export type Availability = (typeof AVAILABILITIES)[number];

export const USAGES = ['indoor', 'outdoor', 'both'] as const;
export type Usage = (typeof USAGES)[number];

export const VARIANT_AVAILABILITIES = ['available', 'made_to_order', 'unavailable'] as const;
export type VariantAvailability = (typeof VARIANT_AVAILABILITIES)[number];

export const COLOR_FAMILIES = ['natural', 'honey', 'brown', 'black', 'white', 'grey', 'green', 'blue', 'other'] as const;
export type ColorFamily = (typeof COLOR_FAMILIES)[number];

export const MATERIALS = [
  'natural_rattan',
  'synthetic_rattan',
  'rattan_cane',
  'teak_wood',
  'mahogany_wood',
  'aluminium',
  'powder_coated_steel',
  'seagrass',
  'water_hyacinth',
  'fabric_cushion',
] as const;
export type Material = (typeof MATERIALS)[number];

export const INQUIRY_STATUSES = [
  'new',
  'contacted',
  'quotation_sent',
  'negotiation',
  'confirmed',
  'in_production',
  'completed',
  'cancelled',
] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export const CUSTOMER_TYPES = [
  'individual',
  'retailer',
  'distributor',
  'interior_designer',
  'architect',
  'hotel_restaurant',
  'project_owner',
  'other',
] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const MESSAGE_TOPICS = ['general', 'product', 'project', 'export'] as const;
export type MessageTopic = (typeof MESSAGE_TOPICS)[number];

export const MESSAGE_STATUSES = ['new', 'read', 'replied', 'archived'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export interface Category {
  id: string;
  slug: string;
  name_en: string;
  name_id: string;
  description_en: string | null;
  description_id: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  product_count?: number;
}

export interface Collection {
  id: string;
  slug: string;
  name_en: string;
  name_id: string;
  tagline_en: string | null;
  tagline_id: string | null;
  description_en: string | null;
  description_id: string | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  product_count?: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  color_id: string | null;
  storage_path: string | null;
  url: string;
  alt_en: string | null;
  alt_id: string | null;
  width: number | null;
  height: number | null;
  is_primary: boolean;
  sort_order: number;
}

export interface ProductColor {
  id: string;
  product_id: string;
  name_en: string;
  name_id: string;
  hex: string;
  family: ColorFamily;
  sort_order: number;
}

export interface ProductSize {
  id: string;
  product_id: string;
  label_en: string;
  label_id: string;
  width_cm: number | null;
  depth_cm: number | null;
  height_cm: number | null;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  color_id: string | null;
  size_id: string | null;
  sku: string | null;
  material_en: string | null;
  material_id: string | null;
  finishing_en: string | null;
  finishing_id: string | null;
  price_adjustment_usd: number;
  availability: VariantAvailability;
  stock_quantity: number | null;
  image_id: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface LocalizedOption {
  en: string;
  id: string;
}

export interface SpecRow {
  label_en: string;
  label_id: string;
  value_en: string;
  value_id: string;
}

export interface ProductBase {
  id: string;
  slug: string;
  sku: string;
  name_en: string;
  name_id: string;
  short_description_en: string | null;
  short_description_id: string | null;
  category_id: string | null;
  collection_id: string | null;
  base_price_usd: number | null;
  price_idr: number | null;
  price_display_type: PriceDisplayType;
  availability: Availability;
  usage: Usage;
  materials: Material[];
  moq: number;
  is_featured: boolean;
  is_new: boolean;
  is_best_seller: boolean;
  status: ProductStatus;
  created_at: string;
}

export interface ProductCardData extends ProductBase {
  /** Number of selectable colors + sizes (0 = can be added without configuration). */
  option_count: number;
  category: Pick<Category, 'id' | 'slug' | 'name_en' | 'name_id'> | null;
  images: Pick<ProductImage, 'id' | 'url' | 'alt_en' | 'alt_id' | 'is_primary' | 'sort_order' | 'color_id'>[];
}

export interface ProductDetail extends ProductBase {
  description_en: string | null;
  description_id: string | null;
  material_detail_en: string | null;
  material_detail_id: string | null;
  finishing_en: string | null;
  finishing_id: string | null;
  finishing_options: LocalizedOption[];
  width_cm: number | null;
  depth_cm: number | null;
  height_cm: number | null;
  seat_height_cm: number | null;
  weight_kg: number | null;
  specs: SpecRow[];
  lead_time_min_weeks: number | null;
  lead_time_max_weeks: number | null;
  care_en: string | null;
  care_id: string | null;
  customization_en: string | null;
  customization_id: string | null;
  seo_title_en: string | null;
  seo_title_id: string | null;
  meta_description_en: string | null;
  meta_description_id: string | null;
  updated_at: string;
  category: Pick<Category, 'id' | 'slug' | 'name_en' | 'name_id'> | null;
  collection: Pick<Collection, 'id' | 'slug' | 'name_en' | 'name_id'> | null;
  images: ProductImage[];
  colors: ProductColor[];
  sizes: ProductSize[];
  variants: ProductVariant[];
}

export interface Testimonial {
  id: string;
  author_name: string;
  author_role_en: string | null;
  author_role_id: string | null;
  company_name: string | null;
  country: string | null;
  quote_en: string;
  quote_id: string;
  rating: number | null;
  avatar_url: string | null;
  is_demo: boolean;
  is_published: boolean;
  sort_order: number;
}
