'use client';

import { Layers, Pencil, Plus, Quote, Tags, Trash2, type LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteTaxonomy, saveTaxonomy } from '@/app/admin/actions/taxonomy';
import { EmptyPanel, MobileList, StatusPill, TableWrap, td, th, thead, tr } from '@/components/admin/ui';
import { ActionsMenu } from './actions-menu';
import { Button } from '@/components/ui/button';
import { ConfirmDialog, Dialog } from '@/components/ui/dialog';
import { Checkbox, Field, Input, Textarea } from '@/components/ui/form';
import { SmartImage } from '@/components/ui/smart-image';
import { slugify } from '@/lib/utils';
import { ImageUrlField } from './image-url-field';

type Kind = 'categories' | 'collections' | 'testimonials';
type Row = Record<string, unknown> & { id: string };

interface FieldDef {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'checkbox' | 'image' | 'slug';
  required?: boolean;
  full?: boolean;
}

const FIELDS: Record<Kind, FieldDef[]> = {
  categories: [
    { name: 'name_en', label: 'Name (English)', required: true },
    { name: 'name_id', label: 'Name (Indonesian)', required: true },
    { name: 'slug', label: 'Slug', type: 'slug', required: true },
    { name: 'sort_order', label: 'Sort order', type: 'number' },
    { name: 'description_en', label: 'Description (English)', type: 'textarea' },
    { name: 'description_id', label: 'Description (Indonesian)', type: 'textarea' },
    { name: 'image_url', label: 'Image', type: 'image', full: true },
    { name: 'is_active', label: 'Active (visible on website)', type: 'checkbox', full: true },
  ],
  collections: [
    { name: 'name_en', label: 'Name (English)', required: true },
    { name: 'name_id', label: 'Name (Indonesian)', required: true },
    { name: 'slug', label: 'Slug', type: 'slug', required: true },
    { name: 'sort_order', label: 'Sort order', type: 'number' },
    { name: 'tagline_en', label: 'Tagline (English)' },
    { name: 'tagline_id', label: 'Tagline (Indonesian)' },
    { name: 'description_en', label: 'Description (English)', type: 'textarea' },
    { name: 'description_id', label: 'Description (Indonesian)', type: 'textarea' },
    { name: 'image_url', label: 'Cover image', type: 'image', full: true },
    { name: 'is_active', label: 'Active (visible on website)', type: 'checkbox' },
    { name: 'is_featured', label: 'Featured', type: 'checkbox' },
  ],
  testimonials: [
    { name: 'author_name', label: 'Author name', required: true },
    { name: 'company_name', label: 'Company' },
    { name: 'author_role_en', label: 'Role (English)' },
    { name: 'author_role_id', label: 'Role (Indonesian)' },
    { name: 'country', label: 'Country' },
    { name: 'rating', label: 'Rating (1–5)', type: 'number' },
    { name: 'quote_en', label: 'Quote (English)', type: 'textarea', required: true },
    { name: 'quote_id', label: 'Quote (Indonesian)', type: 'textarea', required: true },
    { name: 'avatar_url', label: 'Photo (optional, with permission)', type: 'image', full: true },
    { name: 'sort_order', label: 'Sort order', type: 'number' },
    { name: 'is_published', label: 'Published', type: 'checkbox' },
    { name: 'is_demo', label: 'Demo / sample content (shows a “Sample” label)', type: 'checkbox', full: true },
  ],
};

const DEFAULTS: Record<Kind, Record<string, unknown>> = {
  categories: { is_active: true, sort_order: 0 },
  collections: { is_active: true, is_featured: false, sort_order: 0 },
  testimonials: { is_published: true, is_demo: false, sort_order: 0, rating: 5 },
};

const EMPTY_ICON: Record<Kind, LucideIcon> = { categories: Tags, collections: Layers, testimonials: Quote };

function RowIdentity({ kind, row, onOpen }: { kind: Kind; row: Row; onOpen: () => void }) {
  const image = (row.image_url ?? row.avatar_url) as string | null;
  return (
    <button type="button" onClick={onOpen} className="group flex w-full min-w-0 items-center gap-3 rounded-md text-left">
      {kind !== 'testimonials' && (
        <span className="relative size-11 shrink-0 overflow-hidden rounded-md border border-line bg-sand">
          <SmartImage src={image} alt="" fill sizes="44px" className="object-cover" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block truncate font-medium text-ink group-hover:text-gold-ink">{String(row.name_en ?? row.author_name)}</span>
        <span className="block truncate text-[0.8125rem] text-muted">{String(row.name_id ?? row.company_name ?? row.country ?? '')}</span>
      </span>
    </button>
  );
}

function RowStatus({ kind, row }: { kind: Kind; row: Row }) {
  const active = kind === 'testimonials' ? row.is_published : row.is_active;
  return (
    <span className="flex flex-wrap gap-1">
      <StatusPill status={active ? 'active' : 'inactive'} label={active ? (kind === 'testimonials' ? 'Published' : 'Active') : 'Hidden'} />
      {Boolean(row.is_featured) && <StatusPill status="new" label="Featured" />}
      {Boolean(row.is_demo) && <StatusPill status="negotiation" label="Demo" />}
    </span>
  );
}

function RowMenu({ label, onEdit, onDelete }: { label: string; onEdit: () => void; onDelete: () => void }) {
  return (
    <ActionsMenu
      label={`Actions for ${label}`}
      items={[
        { label: 'Edit', icon: Pencil, onSelect: onEdit },
        { label: 'Delete…', icon: Trash2, danger: true, onSelect: onDelete },
      ]}
    />
  );
}

export function TaxonomyManager({ kind, rows, counts }: { kind: Kind; rows: Row[]; counts?: Record<string, number> }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const singular = kind === 'categories' ? 'category' : kind === 'collections' ? 'collection' : 'testimonial';

  const open = (row?: Row) => {
    setErrors({});
    setSlugTouched(Boolean(row));
    setEditing(row ? { ...row } : { ...DEFAULTS[kind] });
  };

  const set = (name: string, value: unknown) =>
    setEditing((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'name_en' && !slugTouched && kind !== 'testimonials') next.slug = slugify(String(value));
      return next;
    });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const payload = Object.fromEntries(Object.entries(editing).map(([k, v]) => [k, v === null ? '' : v]));
    const result = await saveTaxonomy(kind, payload);
    setSaving(false);
    if (!result.ok) {
      setErrors(result.fieldErrors ?? {});
      toast.error(result.error);
      return;
    }
    toast.success(result.message ?? 'Saved');
    setEditing(null);
    router.refresh();
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[0.875rem] text-muted">
          {rows.length} {rows.length === 1 ? singular : kind}
        </p>
        <Button variant="dark" size="sm" icon={<Plus className="size-4" aria-hidden />} onClick={() => open()}>
          Add {singular}
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-line bg-surface">
          <EmptyPanel
            icon={EMPTY_ICON[kind]}
            title={`No ${kind} yet`}
            description={kind === 'testimonials' ? 'Add customer testimonials you have permission to publish.' : `Create a ${singular} to organise products on the website.`}
            action={
              <Button variant="dark" size="sm" icon={<Plus className="size-4" aria-hidden />} onClick={() => open()}>
                Add {singular}
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <TableWrap className="hidden md:block">
            <table className="w-full min-w-[640px]">
              <thead className={thead}>
                <tr>
                  <th className={th}>{kind === 'testimonials' ? 'Author' : 'Name'}</th>
                  <th className={`${th} hidden lg:table-cell`}>{kind === 'testimonials' ? 'Quote' : 'Slug'}</th>
                  {counts && <th className={`${th} text-right`}>Products</th>}
                  <th className={th}>Status</th>
                  <th className={`${th} w-16 text-right`}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.id} className={tr}>
                    <td className={td}>
                      <RowIdentity kind={kind} row={row} onOpen={() => open(row)} />
                    </td>
                    <td className={`${td} hidden max-w-[320px] truncate text-[0.875rem] text-muted lg:table-cell`}>{String(row.slug ?? row.quote_en ?? '')}</td>
                    {counts && <td className={`${td} text-right tabular-nums`}>{counts[row.id] ?? 0}</td>}
                    <td className={td}>
                      <RowStatus kind={kind} row={row} />
                    </td>
                    <td className={`${td} text-right`}>
                      <RowMenu label={String(row.name_en ?? row.author_name)} onEdit={() => open(row)} onDelete={() => setDeleting(row)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>

          <MobileList>
            {rows.map((row) => (
              <li key={row.id} className="flex items-start gap-2 rounded-lg border border-line bg-surface p-3">
                <div className="min-w-0 flex-1">
                  <RowIdentity kind={kind} row={row} onOpen={() => open(row)} />
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.8125rem] text-muted">
                    <RowStatus kind={kind} row={row} />
                    {counts && <span>{counts[row.id] ?? 0} products</span>}
                  </div>
                </div>
                <RowMenu label={String(row.name_en ?? row.author_name)} onEdit={() => open(row)} onDelete={() => setDeleting(row)} />
              </li>
            ))}
          </MobileList>
        </>
      )}

      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit ${singular}` : `Add ${singular}`}
        closeLabel="Close"
        className="sm:max-w-2xl"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button variant="dark" size="sm" loading={saving} onClick={save}>
              Save
            </Button>
          </div>
        }
      >
        {editing && (
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            {FIELDS[kind].map((field) => {
              const value = editing[field.name];
              if (field.type === 'checkbox') {
                return (
                  <label key={field.name} className={`flex min-h-11 items-center gap-2.5 text-[0.9375rem] ${field.full ? 'sm:col-span-2' : ''}`}>
                    <Checkbox checked={Boolean(value)} onChange={(e) => set(field.name, e.target.checked)} /> {field.label}
                  </label>
                );
              }
              if (field.type === 'image') {
                return (
                  <div key={field.name} className="sm:col-span-2">
                    <ImageUrlField label={field.label} value={String(value ?? '')} onChange={(url) => set(field.name, url)} folder={`site/${kind}`} />
                  </div>
                );
              }
              return (
                <Field key={field.name} label={field.label} required={field.required} error={errors[field.name]} className={field.type === 'textarea' || field.full ? 'sm:col-span-2' : ''}>
                  {({ id, invalid }) =>
                    field.type === 'textarea' ? (
                      <Textarea id={id} rows={3} invalid={invalid} value={String(value ?? '')} onChange={(e) => set(field.name, e.target.value)} />
                    ) : (
                      <Input
                        id={id}
                        type={field.type === 'number' ? 'number' : 'text'}
                        invalid={invalid}
                        value={String(value ?? '')}
                        onChange={(e) => {
                          if (field.type === 'slug') setSlugTouched(true);
                          set(field.name, e.target.value);
                        }}
                      />
                    )
                  }
                </Field>
              );
            })}
          </div>
        )}
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          const result = await deleteTaxonomy(kind, deleting.id);
          setDeleting(null);
          if (result.ok) {
            toast.success('Deleted');
            router.refresh();
          } else toast.error(result.error);
        }}
        title={`Delete this ${singular}?`}
        message={kind === 'testimonials' ? 'This cannot be undone.' : 'Only items without products can be deleted. Consider deactivating instead.'}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        closeLabel="Close"
      />
    </>
  );
}
