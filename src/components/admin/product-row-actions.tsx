'use client';

import { Archive, Copy, ExternalLink, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { deleteProduct, duplicateProduct, setProductStatus } from '@/app/admin/actions/products';
import { Button } from '@/components/ui/button';
import { ActionsMenu } from './actions-menu';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/form';
import type { ProductStatus } from '@/types/domain';

export function ProductRowActions({ id, slug, sku, name, status }: { id: string; slug: string; sku: string; name: string; status: ProductStatus }) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmSku, setConfirmSku] = useState('');
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string; message?: string; data?: unknown }>, after?: (data: unknown) => void) => {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(result.message ?? 'Done');
        after?.(result.data);
        router.refresh();
      } else {
        toast.error(result.error ?? 'Action failed');
      }
    });
  };

  return (
    <>
      <ActionsMenu
        label={`Actions for ${name}`}
        disabled={pending}
        items={[
          { label: 'Edit', icon: Pencil, href: `/admin/products/${id}` },
          { label: 'View on site', icon: ExternalLink, href: `/products/${slug}`, external: true, hidden: status !== 'published' },
          { label: 'Duplicate', icon: Copy, onSelect: () => run(() => duplicateProduct(id), (d) => router.push(`/admin/products/${(d as { id: string }).id}`)) },
          { label: 'Publish', icon: Eye, onSelect: () => run(() => setProductStatus(id, 'published')), hidden: status === 'published' },
          { label: 'Move to draft', icon: EyeOff, onSelect: () => run(() => setProductStatus(id, 'draft')), hidden: status !== 'published' },
          { label: 'Archive', icon: Archive, onSelect: () => run(() => setProductStatus(id, 'archived')), hidden: status === 'archived' },
          { label: 'Delete…', icon: Trash2, danger: true, onSelect: () => setConfirmDelete(true) },
        ]}
      />

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete product permanently?" closeLabel="Close" className="sm:max-w-md">
        <div className="space-y-4 p-5 text-left sm:p-6">
          {status === 'published' ? (
            <p className="rounded-md bg-warning-soft px-3 py-2 text-[0.875rem] text-warning">
              This product is published. Archive it or move it to draft first. Archiving keeps history and is usually the safer choice.
            </p>
          ) : (
            <>
              <p className="text-[0.9375rem]">
                “{name}” and its images, colors, sizes and variants will be deleted. Past inquiries keep their product snapshot. This cannot be undone.
              </p>
              <label className="block text-[0.875rem] font-medium text-ink" htmlFor={`confirm-${id}`}>
                Type the SKU <code className="rounded bg-sand px-1">{sku}</code> to confirm
              </label>
              <Input id={`confirm-${id}`} value={confirmSku} onChange={(e) => setConfirmSku(e.target.value)} autoComplete="off" />
            </>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            {status !== 'published' && (
              <Button
                variant="danger"
                size="sm"
                disabled={confirmSku.trim() !== sku}
                loading={pending}
                onClick={() => {
                  setConfirmDelete(false);
                  run(() => deleteProduct(id, confirmSku));
                }}
              >
                Delete product
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </>
  );
}
