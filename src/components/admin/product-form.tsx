'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useFieldArray, useForm, type FieldPath } from 'react-hook-form';
import { toast } from 'sonner';
import { saveProduct } from '@/app/admin/actions/products';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import { slugify } from '@/lib/utils';
import { productSchema, type ProductInput } from '@/lib/validation/admin';
import { MATERIALS, PRICE_DISPLAY_TYPES } from '@/types/domain';

const MATERIAL_LABEL: Record<string, string> = {
  natural_rattan: 'Natural rattan',
  synthetic_rattan: 'Synthetic PE rattan',
  rattan_cane: 'Rattan cane webbing',
  teak_wood: 'Teak wood',
  mahogany_wood: 'Mahogany wood',
  aluminium: 'Aluminium',
  powder_coated_steel: 'Powder-coated steel',
  seagrass: 'Seagrass',
  water_hyacinth: 'Water hyacinth',
  fabric_cushion: 'Fabric cushion',
};
const PRICE_LABEL: Record<string, string> = {
  starting_from: 'Starting From',
  estimated: 'Estimated Price',
  fixed: 'Fixed Display Price',
  contact: 'Contact for Price',
  wholesale_request: 'Wholesale Price on Request',
};

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-surface">
      <div className="border-b border-line px-5 py-3.5">
        <h2 className="font-sans text-[0.9375rem] font-semibold text-ink">{title}</h2>
        {description && <p className="text-[0.8125rem] text-muted">{description}</p>}
      </div>
      <div className="grid gap-5 p-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function ProductForm({
  productId,
  defaultValues,
  categories,
  collections,
}: {
  productId: string | null;
  defaultValues: ProductInput;
  categories: { id: string; name_en: string }[];
  collections: { id: string; name_en: string }[];
}) {
  const router = useRouter();
  const [slugTouched, setSlugTouched] = useState(Boolean(productId));
  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProductInput>({ resolver: zodResolver(productSchema) as never, defaultValues });
  const finishing = useFieldArray({ control, name: 'finishing_options' });
  const specs = useFieldArray({ control, name: 'specs' });
  const priceType = watch('price_display_type');
  const materials = watch('materials') ?? [];

  const e = (path: string) => {
    const parts = path.split('.');
    let node: unknown = errors;
    for (const part of parts) node = (node as Record<string, unknown> | undefined)?.[part];
    return (node as { message?: string } | undefined)?.message;
  };

  const text = (name: FieldPath<ProductInput>, label: string, opts: { required?: boolean; type?: string; hint?: string; step?: string; className?: string } = {}) => (
    <Field label={label} required={opts.required} hint={opts.hint} error={e(name)} className={opts.className}>
      {({ id, describedBy, invalid }) => (
        <Input id={id} type={opts.type ?? 'text'} step={opts.step} aria-describedby={describedBy} invalid={invalid} {...register(name, opts.type === 'number' ? { setValueAs: (v) => (v === '' ? null : v) } : undefined)} />
      )}
    </Field>
  );
  const area = (name: FieldPath<ProductInput>, label: string, rows = 4, required = false) => (
    <Field label={label} error={e(name)} required={required}>
      {({ id, describedBy, invalid }) => <Textarea id={id} rows={rows} aria-describedby={describedBy} invalid={invalid} {...register(name)} />}
    </Field>
  );

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveProduct(productId, values);
    if (!result.ok) {
      toast.error(result.error);
      Object.entries(result.fieldErrors ?? {}).forEach(([key, message]) => setError(key as FieldPath<ProductInput>, { message }));
      return;
    }
    toast.success(result.message ?? 'Saved');
    if (!productId) router.replace(`/admin/products/${result.data.id}?created=1`);
    else router.refresh();
  });

  const nameField = register('name_en');

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <Section title="Basic information">
        <Field label="Product name (English)" required error={e('name_en')}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              {...nameField}
              onChange={(event) => {
                nameField.onChange(event);
                if (!slugTouched) setValue('slug', slugify(event.target.value), { shouldValidate: false });
              }}
            />
          )}
        </Field>
        {text('name_id', 'Product name (Indonesian)', { required: true })}
        <Field label="Slug" required hint="Used in the product URL: /products/your-slug" error={e('slug')}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} invalid={invalid} {...register('slug', { onChange: () => setSlugTouched(true) })} />
          )}
        </Field>
        {text('sku', 'SKU (unique)', { required: true })}
        <Field label="Category" error={e('category_id')}>
          {({ id }) => (
            <Select id={id} {...register('category_id')}>
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Collection" error={e('collection_id')}>
          {({ id }) => (
            <Select id={id} {...register('collection_id')}>
              <option value="">— None —</option>
              {collections.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Status" required>
          {({ id }) => (
            <Select id={id} {...register('status')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </Select>
          )}
        </Field>
        {text('sort_order', 'Sort order', { type: 'number', hint: 'Lower numbers appear first in “Featured” sorting' })}
        <div className="flex flex-wrap gap-x-6 gap-y-2 md:col-span-2">
          {(
            [
              ['is_featured', 'Featured'],
              ['is_new', 'New product'],
              ['is_best_seller', 'Best seller'],
            ] as const
          ).map(([name, label]) => (
            <label key={name} className="flex min-h-11 items-center gap-2.5 text-[0.9375rem] text-ink">
              <Checkbox {...register(name)} /> {label}
            </label>
          ))}
        </div>
      </Section>

      <Section title="Descriptions" description="Write natural copy for each language — avoid word-for-word translation.">
        {area('short_description_en', 'Short description (English)', 3)}
        {area('short_description_id', 'Short description (Indonesian)', 3)}
        {area('description_en', 'Full description (English)', 7)}
        {area('description_id', 'Full description (Indonesian)', 7)}
      </Section>

      <Section title="Pricing" description="Prices are indicative display prices only. IDR is converted from USD using the rate in Settings unless an IDR price is set.">
        <Field label="Price display type" required>
          {({ id }) => (
            <Select id={id} {...register('price_display_type')}>
              {PRICE_DISPLAY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PRICE_LABEL[type]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {text('base_price_usd', 'Base price (USD)', {
          type: 'number',
          step: '0.01',
          required: priceType !== 'contact' && priceType !== 'wholesale_request',
          hint: priceType === 'contact' || priceType === 'wholesale_request' ? 'Optional — hidden on the website for this display type' : undefined,
        })}
        {text('price_idr', 'Optional IDR price override', { type: 'number', step: '1000', hint: 'Leave empty to convert automatically' })}
      </Section>

      <Section title="Materials & finishing">
        <fieldset className="md:col-span-2">
          <legend className="mb-2 text-[0.875rem] font-medium text-ink">Materials (used for catalog filters)</legend>
          <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
            {MATERIALS.map((m) => (
              <label key={m} className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[0.9375rem]">
                <Checkbox
                  checked={materials.includes(m)}
                  onChange={(ev) =>
                    setValue('materials', ev.target.checked ? [...materials, m] : materials.filter((x) => x !== m), { shouldDirty: true })
                  }
                />
                {MATERIAL_LABEL[m]}
              </label>
            ))}
          </div>
        </fieldset>
        {area('material_detail_en', 'Material details (English)', 3)}
        {area('material_detail_id', 'Material details (Indonesian)', 3)}
        {text('finishing_en', 'Finishing (English)')}
        {text('finishing_id', 'Finishing (Indonesian)')}
        <Field label="Indoor / Outdoor" required>
          {({ id }) => (
            <Select id={id} {...register('usage')}>
              <option value="indoor">Indoor</option>
              <option value="outdoor">Outdoor</option>
              <option value="both">Indoor & Outdoor</option>
            </Select>
          )}
        </Field>
        <div className="md:col-span-2">
          <p className="mb-2 text-[0.875rem] font-medium text-ink">Selectable material / finishing options</p>
          <div className="space-y-2">
            {finishing.fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
                <Input aria-label={`Option ${index + 1} English`} placeholder="English" {...register(`finishing_options.${index}.en` as const)} />
                <Input aria-label={`Option ${index + 1} Indonesian`} placeholder="Indonesian" {...register(`finishing_options.${index}.id` as const)} />
                <button type="button" onClick={() => finishing.remove(index)} aria-label={`Remove option ${index + 1}`} className="inline-flex size-12 shrink-0 items-center justify-center rounded-md border border-transparent text-muted hover:bg-danger-soft hover:text-danger">
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-2" icon={<Plus className="size-4" aria-hidden />} onClick={() => finishing.append({ en: '', id: '' })}>
            Add option
          </Button>
        </div>
      </Section>

      <Section title="Dimensions, stock & production">
        <div className="grid grid-cols-2 gap-3 md:col-span-2 lg:grid-cols-5">
          {text('width_cm', 'Width (cm)', { type: 'number', step: '0.1' })}
          {text('depth_cm', 'Depth (cm)', { type: 'number', step: '0.1' })}
          {text('height_cm', 'Height (cm)', { type: 'number', step: '0.1' })}
          {text('seat_height_cm', 'Seat height (cm)', { type: 'number', step: '0.1' })}
          {text('weight_kg', 'Weight (kg)', { type: 'number', step: '0.01' })}
        </div>
        {text('moq', 'Minimum order quantity', { type: 'number', required: true })}
        <Field label="Availability" required>
          {({ id }) => (
            <Select id={id} {...register('availability')}>
              <option value="ready_stock">Ready Stock</option>
              <option value="made_to_order">Made to Order</option>
            </Select>
          )}
        </Field>
        {text('lead_time_min_weeks', 'Lead time — min (weeks)', { type: 'number' })}
        {text('lead_time_max_weeks', 'Lead time — max (weeks)', { type: 'number' })}
      </Section>

      <Section title="Care, customization & specifications">
        {area('care_en', 'Care instructions (English)', 4)}
        {area('care_id', 'Care instructions (Indonesian)', 4)}
        {area('customization_en', 'Customization (English)', 4)}
        {area('customization_id', 'Customization (Indonesian)', 4)}
        <div className="md:col-span-2">
          <p className="mb-2 text-[0.875rem] font-medium text-ink">Additional specification rows</p>
          <div className="space-y-2">
            {specs.fields.map((field, index) => (
              <div key={field.id} className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-[1fr_1fr_1fr_1fr_auto]">
                <Input aria-label="Label EN" placeholder="Label (EN)" {...register(`specs.${index}.label_en` as const)} />
                <Input aria-label="Label ID" placeholder="Label (ID)" {...register(`specs.${index}.label_id` as const)} />
                <Input aria-label="Value EN" placeholder="Value (EN)" {...register(`specs.${index}.value_en` as const)} />
                <Input aria-label="Value ID" placeholder="Value (ID)" {...register(`specs.${index}.value_id` as const)} />
                <button type="button" onClick={() => specs.remove(index)} aria-label={`Remove specification ${index + 1}`} className="inline-flex size-12 shrink-0 items-center justify-center rounded-md border border-transparent text-muted hover:bg-danger-soft hover:text-danger">
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </div>
            ))}
          </div>
          <Button type="button" variant="ghost" size="sm" className="mt-2" icon={<Plus className="size-4" aria-hidden />} onClick={() => specs.append({ label_en: '', label_id: '', value_en: '', value_id: '' })}>
            Add specification
          </Button>
        </div>
      </Section>

      <Section title="SEO" description="Leave empty to use the product name and short description.">
        {text('seo_title_en', 'SEO title (English)')}
        {text('seo_title_id', 'SEO title (Indonesian)')}
        {area('meta_description_en', 'Meta description (English)', 3)}
        {area('meta_description_id', 'Meta description (Indonesian)', 3)}
      </Section>

      <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t border-line bg-surface/95 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
        <p className="text-[0.8125rem] text-muted">{Object.keys(errors).length ? 'Please fix the highlighted fields.' : isDirty ? 'You have unsaved changes.' : 'All changes saved.'}</p>
        <Button type="submit" variant="dark" loading={isSubmitting} icon={<Save className="size-4" aria-hidden />}>
          {productId ? 'Save product' : 'Create product'}
        </Button>
      </div>
    </form>
  );
}
