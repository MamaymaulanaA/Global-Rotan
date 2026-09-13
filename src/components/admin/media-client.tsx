'use client';

import { Copy, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { deleteMediaFile } from '@/app/admin/actions/media-users';
import { buttonClasses } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { uploadImage, validateImageFile } from '@/lib/admin/upload';

export function MediaUploader({ folder }: { folder: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);

  const upload = async (files: FileList) => {
    const list = Array.from(files);
    list.map(validateImageFile).filter(Boolean).forEach((msg) => toast.error(msg));
    const valid = list.filter((f) => !validateImageFile(f));
    try {
      for (const [i, file] of valid.entries()) {
        setStatus(`Uploading ${i + 1} of ${valid.length}…`);
        await uploadImage(file, folder);
      }
      if (valid.length) toast.success(`${valid.length} file(s) uploaded to ${folder}`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setStatus(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-field-border bg-surface p-4">
      {status ? <Loader2 className="size-5 animate-spin text-gold-ink" aria-hidden /> : <UploadCloud className="size-5 text-gold-ink" aria-hidden />}
      <p className="flex-1 text-[0.875rem] text-muted" aria-live="polite">
        {status ?? `Upload JPG, PNG, WebP or AVIF (max 8 MB) to “${folder}”.`}
      </p>
      <button type="button" disabled={Boolean(status)} onClick={() => inputRef.current?.click()} className={buttonClasses({ variant: 'dark', size: 'sm', className: 'w-full sm:w-auto' })}>
        Upload files
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) upload(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

export function MediaFileActions({ path, url }: { path: string; url: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="mt-2 flex gap-1">
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(url);
          toast.success('URL copied');
        }}
        className="inline-flex min-h-11 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md border border-field-border px-2 text-[0.75rem] font-semibold hover:border-field-border-hover hover:bg-hover-soft"
      >
        <Copy className="size-3.5" aria-hidden /> Copy URL
      </button>
      <button type="button" onClick={() => setConfirm(true)} aria-label={`Delete ${path}`} title="Delete file" className="inline-flex size-11 shrink-0 items-center justify-center rounded-md border border-field-border text-muted hover:border-danger hover:bg-danger-soft hover:text-danger">
        <Trash2 className="size-3.5" aria-hidden />
      </button>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={async () => {
          setConfirm(false);
          const result = await deleteMediaFile(path);
          if (result.ok) {
            toast.success('File deleted');
            router.refresh();
          } else toast.error(result.error);
        }}
        title="Delete this file?"
        message={path}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        closeLabel="Close"
      />
    </div>
  );
}
