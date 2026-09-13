'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { toast } from 'sonner';
import { buttonClasses } from '@/components/ui/button';
import { SmartImage } from '@/components/ui/smart-image';
import { uploadImage } from '@/lib/admin/upload';

/** Image picker that uploads to Supabase Storage and stores the public URL (or accepts a pasted URL/path). */
export function ImageUrlField({ label, value, onChange, folder, aspect = 'aspect-[4/5]' }: { label: string; value: string; onChange: (url: string) => void; folder: string; aspect?: string }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    setBusy(true);
    try {
      const uploaded = await uploadImage(file, folder);
      onChange(uploaded.url);
      toast.success('Image uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.875rem] font-medium text-ink">
        {label}
      </label>
      <div className="flex gap-3">
        <div className={`relative w-24 shrink-0 overflow-hidden rounded-md border border-line bg-sand ${aspect}`}>
          {value ? <SmartImage src={value} alt="" fill sizes="96px" className="object-cover" /> : null}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="https://… or /demo/…" className="block min-h-control-sm w-full rounded-md px-3 text-[0.875rem]" />
          <div className="flex gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className={buttonClasses({ variant: 'outline', size: 'sm', className: 'border-field-border px-3 text-[0.8125rem]' })}>
              {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />} Upload
            </button>
            {value && (
              <button type="button" onClick={() => onChange('')} className={buttonClasses({ variant: 'ghost', size: 'sm', className: 'px-3 text-[0.8125rem] text-muted hover:bg-danger-soft hover:text-danger' })}>
                <X className="size-4" aria-hidden /> Remove
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) pick(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </div>
  );
}
