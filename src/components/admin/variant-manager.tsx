'use client';

import { Plus, Save, Sparkles, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { deleteVariantEntity, generateVariants, saveColor, saveSize, saveVariant } from '@/app/admin/actions/products';
import { Card } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { COLOR_FAMILIES, VARIANT_AVAILABILITIES, type ProductColor, type ProductImage, type ProductSize, type ProductVariant } from '@/types/domain';

const input = 'block min-h-control-sm w-full rounded-md px-3 text-[0.875rem]';
const iconBtn = 'inline-flex size-11 shrink-0 items-center justify-center rounded-md border';
const saveBtn = `${iconBtn} border-espresso bg-espresso text-canvas hover:bg-espresso-soft [--color-focus:var(--color-gold)]`;

function DeleteButton({ label, message, onConfirm }: { label: string; message: string; onConfirm: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label={label} title={label} className={`${iconBtn} border-transparent text-muted hover:bg-danger-soft hover:text-danger`}>
        <Trash2 className="size-4" aria-hidden />
      </button>
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          onConfirm();
        }}
        title={`${label}?`}
        message={message}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        closeLabel="Close"
      />
    </>
  );
}

type Result = { ok: boolean; error?: string; message?: string; fieldErrors?: Record<string, string> };

function useAct() {
  const router = useRouter();
  return async (promise: Promise<Result>) => {
    const result = await promise;
    if (result.ok) {
      toast.success(result.message ?? 'Saved');
      router.refresh();
      return true;
    }
    const firstField = result.fieldErrors ? Object.entries(result.fieldErrors)[0] : null;
    toast.error(firstField ? `${firstField[0]}: ${firstField[1]}` : (result.error ?? 'Failed'));
    return false;
  };
}

function ColorRow({ productId, color, index }: { productId: string; color?: ProductColor; index: number }) {
  const act = useAct();
  const [v, setV] = useState({ name_en: color?.name_en ?? '', name_id: color?.name_id ?? '', hex: color?.hex ?? '#C89B5E', family: color?.family ?? 'natural', sort_order: color?.sort_order ?? index });
  useEffect(() => {
    if (color) setV({ name_en: color.name_en, name_id: color.name_id, hex: color.hex, family: color.family, sort_order: color.sort_order });
  }, [color]);
  const save = async () => {
    const ok = await act(saveColor({ ...v, id: color?.id, product_id: productId }));
    if (ok && !color) setV({ name_en: '', name_id: '', hex: '#C89B5E', family: 'natural', sort_order: index + 1 });
  };
  return (
    <tr className="align-top">
      <td className="p-2">
        <input aria-label="Color name EN" className={input} value={v.name_en} onChange={(e) => setV({ ...v, name_en: e.target.value })} placeholder="Name (EN)" />
      </td>
      <td className="p-2">
        <input aria-label="Color name ID" className={input} value={v.name_id} onChange={(e) => setV({ ...v, name_id: e.target.value })} placeholder="Nama (ID)" />
      </td>
      <td className="p-2">
        <div className="flex items-center gap-2">
          <input aria-label="Color swatch" type="color" value={v.hex} onChange={(e) => setV({ ...v, hex: e.target.value.toUpperCase() })} className="h-11 w-12 shrink-0 cursor-pointer rounded-md border border-field-border bg-surface p-1 hover:border-field-border-hover" />
          <input aria-label="Hex code" className={`${input} w-24 font-mono`} value={v.hex} onChange={(e) => setV({ ...v, hex: e.target.value })} />
        </div>
      </td>
      <td className="p-2">
        <select aria-label="Color family" className={input} value={v.family} onChange={(e) => setV({ ...v, family: e.target.value as ProductColor['family'] })}>
          {COLOR_FAMILIES.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </td>
      <td className="p-2">
        <div className="flex gap-1">
          <button type="button" onClick={save} aria-label={color ? 'Save color' : 'Add color'} className={saveBtn}>
            {color ? <Save className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          </button>
          {color && (
            <DeleteButton label="Delete color" message={`Delete color “${color.name_en}”? Its variants will be removed.`} onConfirm={() => act(deleteVariantEntity('product_colors', color.id))} />
          )}
        </div>
      </td>
    </tr>
  );
}

function SizeRow({ productId, size, index }: { productId: string; size?: ProductSize; index: number }) {
  const act = useAct();
  const init = () => ({
    label_en: size?.label_en ?? '',
    label_id: size?.label_id ?? '',
    width_cm: size?.width_cm?.toString() ?? '',
    depth_cm: size?.depth_cm?.toString() ?? '',
    height_cm: size?.height_cm?.toString() ?? '',
    sort_order: size?.sort_order ?? index,
  });
  const [v, setV] = useState(init);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => size && setV(init()), [size]);
  const save = async () => {
    const ok = await act(saveSize({ ...v, id: size?.id, product_id: productId }));
    if (ok && !size) setV({ label_en: '', label_id: '', width_cm: '', depth_cm: '', height_cm: '', sort_order: index + 1 });
  };
  return (
    <tr className="align-top">
      <td className="p-2">
        <input aria-label="Size label EN" className={input} value={v.label_en} onChange={(e) => setV({ ...v, label_en: e.target.value })} placeholder="Label (EN)" />
      </td>
      <td className="p-2">
        <input aria-label="Size label ID" className={input} value={v.label_id} onChange={(e) => setV({ ...v, label_id: e.target.value })} placeholder="Label (ID)" />
      </td>
      {(['width_cm', 'depth_cm', 'height_cm'] as const).map((key) => (
        <td key={key} className="p-2">
          <input aria-label={key} type="number" step="0.1" className={`${input} w-20`} value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value })} placeholder={key[0].toUpperCase()} />
        </td>
      ))}
      <td className="p-2">
        <div className="flex gap-1">
          <button type="button" onClick={save} aria-label={size ? 'Save size' : 'Add size'} className={saveBtn}>
            {size ? <Save className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          </button>
          {size && (
            <DeleteButton label="Delete size" message={`Delete size “${size.label_en}”? Its variants will be removed.`} onConfirm={() => act(deleteVariantEntity('product_sizes', size.id))} />
          )}
        </div>
      </td>
    </tr>
  );
}

function VariantRow({ productId, variant, colors, sizes, images }: { productId: string; variant?: ProductVariant; colors: ProductColor[]; sizes: ProductSize[]; images: ProductImage[] }) {
  const act = useAct();
  const init = () => ({
    color_id: variant?.color_id ?? '',
    size_id: variant?.size_id ?? '',
    sku: variant?.sku ?? '',
    finishing_en: variant?.finishing_en ?? '',
    finishing_id: variant?.finishing_id ?? '',
    material_en: variant?.material_en ?? '',
    material_id: variant?.material_id ?? '',
    price_adjustment_usd: variant?.price_adjustment_usd?.toString() ?? '0',
    availability: variant?.availability ?? 'available',
    stock_quantity: variant?.stock_quantity?.toString() ?? '',
    image_id: variant?.image_id ?? '',
    is_active: variant?.is_active ?? true,
  });
  const [v, setV] = useState(init);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => variant && setV(init()), [variant]);
  const save = async () => {
    const ok = await act(saveVariant({ ...v, id: variant?.id, product_id: productId }));
    if (ok && !variant) setV({ ...init(), color_id: '', size_id: '', sku: '' });
  };
  return (
    <tr className="align-top">
      <td className="p-2">
        <select aria-label="Variant color" className={input} value={v.color_id} onChange={(e) => setV({ ...v, color_id: e.target.value })}>
          <option value="">Any color</option>
          {colors.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_en}
            </option>
          ))}
        </select>
      </td>
      <td className="p-2">
        <select aria-label="Variant size" className={input} value={v.size_id} onChange={(e) => setV({ ...v, size_id: e.target.value })}>
          <option value="">Any size</option>
          {sizes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label_en}
            </option>
          ))}
        </select>
      </td>
      <td className="p-2">
        <input aria-label="Variant SKU" className={`${input} font-mono`} value={v.sku} onChange={(e) => setV({ ...v, sku: e.target.value })} placeholder="SKU" />
      </td>
      <td className="p-2">
        <input aria-label="Finishing EN" className={input} value={v.finishing_en} onChange={(e) => setV({ ...v, finishing_en: e.target.value })} placeholder="Finishing (EN)" />
        <input aria-label="Finishing ID" className={`${input} mt-1`} value={v.finishing_id} onChange={(e) => setV({ ...v, finishing_id: e.target.value })} placeholder="Finishing (ID)" />
      </td>
      <td className="p-2">
        <input aria-label="Price adjustment USD" type="number" step="0.01" className={`${input} w-24`} value={v.price_adjustment_usd} onChange={(e) => setV({ ...v, price_adjustment_usd: e.target.value })} />
      </td>
      <td className="p-2">
        <select aria-label="Availability" className={input} value={v.availability} onChange={(e) => setV({ ...v, availability: e.target.value as ProductVariant['availability'] })}>
          {VARIANT_AVAILABILITIES.map((a) => (
            <option key={a} value={a}>
              {a.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
        <input aria-label="Stock quantity" type="number" className={`${input} mt-1`} value={v.stock_quantity} onChange={(e) => setV({ ...v, stock_quantity: e.target.value })} placeholder="Stock" />
      </td>
      <td className="p-2">
        <select aria-label="Variant image" className={input} value={v.image_id} onChange={(e) => setV({ ...v, image_id: e.target.value })}>
          <option value="">No image</option>
          {images.map((img, i) => (
            <option key={img.id} value={img.id}>
              Image {i + 1}
            </option>
          ))}
        </select>
        <label className="mt-1 flex min-h-11 items-center gap-2.5 text-[0.8125rem]">
          <input type="checkbox" checked={v.is_active} onChange={(e) => setV({ ...v, is_active: e.target.checked })} /> Active
        </label>
      </td>
      <td className="p-2">
        <div className="flex gap-1">
          <button type="button" onClick={save} aria-label={variant ? 'Save variant' : 'Add variant'} className={saveBtn}>
            {variant ? <Save className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
          </button>
          {variant && (
            <DeleteButton label="Delete variant" message={'Delete this variant?'} onConfirm={() => act(deleteVariantEntity('product_variants', variant.id))} />
          )}
        </div>
      </td>
    </tr>
  );
}

export function VariantManager({
  productId,
  colors,
  sizes,
  variants,
  images,
}: {
  productId: string;
  colors: ProductColor[];
  sizes: ProductSize[];
  variants: ProductVariant[];
  images: ProductImage[];
}) {
  const act = useAct();
  const head = 'whitespace-nowrap border-b border-line p-2 text-left text-[0.75rem] font-semibold uppercase tracking-[0.05em] text-muted';

  return (
    <div className="space-y-6" id="variants">
      <Card title={`Colors (${colors.length})`}>
        <div className="scroll-x -mx-2">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className={head}>Name EN</th>
                <th className={head}>Name ID</th>
                <th className={head}>Hex</th>
                <th className={head}>Filter family</th>
                <th className={head} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {colors.map((c, i) => (
                <ColorRow key={c.id} productId={productId} color={c} index={i} />
              ))}
              <ColorRow key={`new-${colors.length}`} productId={productId} index={colors.length} />
            </tbody>
          </table>
        </div>
      </Card>

      <Card title={`Sizes (${sizes.length})`}>
        <div className="scroll-x -mx-2">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className={head}>Label EN</th>
                <th className={head}>Label ID</th>
                <th className={head}>W cm</th>
                <th className={head}>D cm</th>
                <th className={head}>H cm</th>
                <th className={head} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sizes.map((s, i) => (
                <SizeRow key={s.id} productId={productId} size={s} index={i} />
              ))}
              <SizeRow key={`new-${sizes.length}`} productId={productId} index={sizes.length} />
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title={`Variants (${variants.length})`}
        actions={
          <Button type="button" size="sm" variant="outline" icon={<Sparkles className="size-4" aria-hidden />} onClick={() => act(generateVariants(productId))} disabled={!colors.length && !sizes.length}>
            Generate missing combinations
          </Button>
        }
      >
        <p className="mb-3 text-[0.8125rem] text-muted">
          Leave variants empty to allow every color/size combination. Once variants exist, only listed combinations are selectable; set availability to “unavailable” to disable one.
        </p>
        <div className="scroll-x -mx-2">
          <table className="w-full min-w-[1080px]">
            <thead>
              <tr>
                <th className={head}>Color</th>
                <th className={head}>Size</th>
                <th className={head}>SKU</th>
                <th className={head}>Finishing</th>
                <th className={head}>+ USD</th>
                <th className={head}>Availability / stock</th>
                <th className={head}>Image</th>
                <th className={head} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {variants.map((v) => (
                <VariantRow key={v.id} productId={productId} variant={v} colors={colors} sizes={sizes} images={images} />
              ))}
              <VariantRow key={`new-${variants.length}`} productId={productId} colors={colors} sizes={sizes} images={images} />
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
