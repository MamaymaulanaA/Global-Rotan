'use client';

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, ImagePlus, Loader2, RefreshCw, Star, Trash2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  addProductImages,
  deleteProductImage,
  reorderProductImages,
  replaceProductImage,
  setPrimaryImage,
  updateProductImage,
} from '@/app/admin/actions/products';
import { Card } from '@/components/admin/ui';
import { buttonClasses } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { SmartImage } from '@/components/ui/smart-image';
import { uploadImage, validateImageFile } from '@/lib/admin/upload';
import { cn } from '@/lib/utils';
import type { ProductColor, ProductImage } from '@/types/domain';

function SortableImage({
  image,
  index,
  colors,
  onPrimary,
  onDelete,
  onReplace,
  onSaveMeta,
}: {
  image: ProductImage;
  index: number;
  colors: ProductColor[];
  onPrimary: () => void;
  onDelete: () => void;
  onReplace: (file: File) => void;
  onSaveMeta: (patch: { alt_en?: string; alt_id?: string; color_id?: string | null }) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
  const replaceRef = useRef<HTMLInputElement>(null);
  const [altEn, setAltEn] = useState(image.alt_en ?? '');
  const [altId, setAltId] = useState(image.alt_id ?? '');

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('relative rounded-md border bg-surface', isDragging ? 'z-10 border-gold-ink opacity-90' : image.is_primary ? 'border-gold-ink' : 'border-line')}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-t-md bg-sand">
        <SmartImage src={image.url} alt={image.alt_en ?? ''} fill sizes="220px" className="object-cover" />
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder image ${index + 1}`}
          title="Drag to reorder"
          className="absolute left-2 top-2 inline-flex size-11 cursor-grab touch-none items-center justify-center rounded-md border border-line bg-surface/95 text-ink hover:bg-surface active:cursor-grabbing"
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        {image.is_primary && <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-gold bg-gold px-2 py-px text-[0.75rem] font-semibold leading-5 text-ink">Primary</span>}
      </div>
      <div className="space-y-2 p-3">
        <label className="block text-[0.75rem] font-medium text-muted" htmlFor={`alt-en-${image.id}`}>
          Alt text (EN)
        </label>
        <input
          id={`alt-en-${image.id}`}
          value={altEn}
          onChange={(e) => setAltEn(e.target.value)}
          onBlur={() => altEn !== (image.alt_en ?? '') && onSaveMeta({ alt_en: altEn })}
          className="block min-h-control-sm w-full rounded-md px-3 text-[0.875rem]"
        />
        <label className="block text-[0.75rem] font-medium text-muted" htmlFor={`alt-id-${image.id}`}>
          Alt text (ID)
        </label>
        <input
          id={`alt-id-${image.id}`}
          value={altId}
          onChange={(e) => setAltId(e.target.value)}
          onBlur={() => altId !== (image.alt_id ?? '') && onSaveMeta({ alt_id: altId })}
          className="block min-h-control-sm w-full rounded-md px-3 text-[0.875rem]"
        />
        <label className="block text-[0.75rem] font-medium text-muted" htmlFor={`color-${image.id}`}>
          Linked color variant
        </label>
        <select
          id={`color-${image.id}`}
          defaultValue={image.color_id ?? ''}
          onChange={(e) => onSaveMeta({ color_id: e.target.value || null })}
          className="block min-h-control-sm w-full cursor-pointer rounded-md px-3 text-[0.875rem]"
        >
          <option value="">All colors</option>
          {colors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_en}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 pt-1">
          <button type="button" onClick={onPrimary} disabled={image.is_primary} title="Set as primary" aria-label="Set as primary image" className="inline-flex size-11 items-center justify-center rounded-md border border-transparent hover:bg-hover-soft disabled:opacity-40">
            <Star className={cn('size-4', image.is_primary && 'fill-gold text-gold-ink')} aria-hidden />
          </button>
          <button type="button" onClick={() => replaceRef.current?.click()} title="Replace image" aria-label="Replace image" className="inline-flex size-11 items-center justify-center rounded-md border border-transparent hover:bg-hover-soft">
            <RefreshCw className="size-4" aria-hidden />
          </button>
          <input
            ref={replaceRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onReplace(file);
              e.target.value = '';
            }}
          />
          <button type="button" onClick={onDelete} title="Delete image" aria-label="Delete image" className="ml-auto inline-flex size-11 items-center justify-center rounded-md border border-transparent text-muted hover:bg-danger-soft hover:text-danger">
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}

export function ProductImagesManager({ productId, images: initial, colors }: { productId: string; images: ProductImage[]; colors: ProductColor[] }) {
  const router = useRouter();
  const [images, setImages] = useState(initial);
  const [uploading, setUploading] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState<ProductImage | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  useEffect(() => setImages(initial), [initial]);

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files);
    const invalid = list.map(validateImageFile).filter(Boolean);
    invalid.forEach((msg) => toast.error(msg));
    const valid = list.filter((f) => !validateImageFile(f));
    if (!valid.length) return;
    const uploaded = [];
    try {
      for (const [index, file] of valid.entries()) {
        setUploading(`Uploading ${index + 1} of ${valid.length}…`);
        uploaded.push(await uploadImage(file, `products/${productId}`));
      }
      const result = await addProductImages(productId, uploaded);
      if (!result.ok) throw new Error(result.error);
      toast.success(`${uploaded.length} image(s) uploaded`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((i) => i.id === active.id);
    const newIndex = images.findIndex((i) => i.id === over.id);
    const next = arrayMove(images, oldIndex, newIndex);
    setImages(next);
    const result = await reorderProductImages(productId, next.map((i) => i.id));
    if (!result.ok) {
      toast.error(result.error);
      setImages(images);
    }
  };

  const act = async (promise: Promise<{ ok: boolean; error?: string; message?: string }>) => {
    const result = await promise;
    if (result.ok) {
      if (result.message) toast.success(result.message);
      router.refresh();
    } else toast.error(result.error ?? 'Action failed');
  };

  return (
    <Card title={`Images (${images.length})`} actions={<p className="text-[0.8125rem] text-muted">Drag to reorder · JPG, PNG, WebP, AVIF · max 8 MB</p>}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        className={cn('flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-4 py-8 text-center transition-colors', dragOver ? 'border-gold-ink bg-gold-soft' : 'border-field-border bg-canvas hover:border-field-border-hover')}
      >
        {uploading ? <Loader2 className="size-7 animate-spin text-gold-ink" aria-hidden /> : <UploadCloud className="size-7 text-gold-ink" aria-hidden />}
        <p className="text-[0.9375rem] text-ink-soft" aria-live="polite">
          {uploading ?? 'Drop images here or choose files to upload several at once.'}
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={Boolean(uploading)}
          className={buttonClasses({ variant: 'dark', size: 'sm' })}
        >
          <ImagePlus className="size-4" aria-hidden /> Choose images
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

      {images.length > 0 && (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={images.map((i) => i.id)} strategy={rectSortingStrategy}>
            <ul className="mt-5 grid grid-cols-1 gap-3 min-[440px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {images.map((image, index) => (
                <SortableImage
                  key={image.id}
                  image={image}
                  index={index}
                  colors={colors}
                  onPrimary={() => act(setPrimaryImage(productId, image.id))}
                  onDelete={() => setDeleting(image)}
                  onSaveMeta={(patch) => act(updateProductImage(image.id, patch))}
                  onReplace={async (file) => {
                    try {
                      setUploading('Replacing image…');
                      const uploaded = await uploadImage(file, `products/${productId}`);
                      await act(replaceProductImage(image.id, uploaded));
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Replace failed');
                    } finally {
                      setUploading(null);
                    }
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) act(deleteProductImage(deleting.id));
          setDeleting(null);
        }}
        title="Delete this image?"
        message="The file will be removed from storage. This cannot be undone."
        confirmLabel="Delete image"
        cancelLabel="Cancel"
        closeLabel="Close"
      />
    </Card>
  );
}
