'use client';

import { createClient } from '@/lib/supabase/browser';
import { IMAGE_MIME, MAX_IMAGE_BYTES } from '@/lib/validation/admin';

export interface UploadedImage {
  storage_path: string;
  url: string;
  width: number | null;
  height: number | null;
}

export function validateImageFile(file: File) {
  if (!(IMAGE_MIME as readonly string[]).includes(file.type)) return `${file.name}: only JPG, PNG, WebP or AVIF images are allowed.`;
  if (file.size > MAX_IMAGE_BYTES) return `${file.name}: file is larger than 8 MB.`;
  return null;
}

async function dimensions(file: File) {
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return { width: null, height: null };
  }
}

/** Uploads straight to Supabase Storage with the admin's session (Storage RLS allows admins only). */
export async function uploadImage(file: File, folder: string): Promise<UploadedImage> {
  const error = validateImageFile(file);
  if (error) throw new Error(error);
  const supabase = createClient();
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const base = file.name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  const path = `${folder.replace(/^\/|\/$/g, '')}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base || 'image'}.${ext}`;
  const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  const size = await dimensions(file);
  return { storage_path: path, url: data.publicUrl, ...size };
}
