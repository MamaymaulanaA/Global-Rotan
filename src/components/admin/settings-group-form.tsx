'use client';

import { Plus, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { saveSettings } from '@/app/admin/actions/settings';
import { Card } from '@/components/admin/ui';
import { Button } from '@/components/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/form';
import type { SettingsKey } from '@/lib/settings/defaults';
import { ImageUrlField } from './image-url-field';

export interface SettingField {
  path: string;
  label: string;
  type?: 'text' | 'textarea' | 'image' | 'checkbox' | 'select' | 'number';
  options?: { value: string; label: string }[];
  hint?: string;
  full?: boolean;
  rows?: number;
}

export interface SettingSection {
  title: string;
  description?: string;
  fields?: SettingField[];
  list?: { path: string; label: string; itemFields: SettingField[]; empty: Record<string, unknown>; max?: number };
}

type Data = Record<string, unknown>;

function getPath(obj: Data, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => (acc && typeof acc === 'object' ? (acc as Data)[key] : undefined), obj);
}

function setPath(obj: Data, path: string, value: unknown): Data {
  const [head, ...rest] = path.split('.');
  if (!rest.length) return { ...obj, [head]: value };
  return { ...obj, [head]: setPath(((obj[head] as Data) ?? {}) as Data, rest.join('.'), value) };
}

function FieldControl({ field, value, onChange, folder }: { field: SettingField; value: unknown; onChange: (v: unknown) => void; folder: string }) {
  if (field.type === 'checkbox') {
    return (
      <label className={`flex min-h-11 items-center gap-2.5 text-[0.9375rem] ${field.full ? 'md:col-span-2' : ''}`}>
        <Checkbox checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} /> {field.label}
      </label>
    );
  }
  if (field.type === 'image') {
    return (
      <div className={field.full === false ? '' : 'md:col-span-2'}>
        <ImageUrlField label={field.label} value={String(value ?? '')} onChange={onChange} folder={folder} aspect="aspect-[4/3]" />
        {field.hint && <p className="mt-1 text-[0.8125rem] text-muted">{field.hint}</p>}
      </div>
    );
  }
  return (
    <Field label={field.label} hint={field.hint} className={field.full || field.type === 'textarea' ? 'md:col-span-2' : ''}>
      {({ id, describedBy }) =>
        field.type === 'textarea' ? (
          <Textarea id={id} rows={field.rows ?? 3} aria-describedby={describedBy} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
        ) : field.type === 'select' ? (
          <Select id={id} aria-describedby={describedBy} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ) : (
          <Input id={id} type={field.type === 'number' ? 'number' : 'text'} aria-describedby={describedBy} value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
        )
      }
    </Field>
  );
}

/** Edits one `site_settings` row (a JSON object) through declarative sections. */
export function SettingsGroupForm({ settingsKey, initial, sections, submitLabel = 'Save changes' }: { settingsKey: SettingsKey; initial: Data; sections: SettingSection[]; submitLabel?: string }) {
  const router = useRouter();
  const [data, setData] = useState<Data>(initial);
  const [saving, setSaving] = useState(false);
  const folder = `site/${settingsKey}`;

  const save = async () => {
    setSaving(true);
    const result = await saveSettings(settingsKey, data);
    setSaving(false);
    if (result.ok) {
      toast.success(result.message ?? 'Saved');
      router.refresh();
    } else toast.error(result.error);
  };

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.title} title={section.title}>
          {section.description && <p className="-mt-1 mb-4 text-[0.875rem] text-muted">{section.description}</p>}
          {section.fields && (
            <div className="grid gap-5 md:grid-cols-2">
              {section.fields.map((field) => (
                <FieldControl key={field.path} field={field} folder={folder} value={getPath(data, field.path)} onChange={(v) => setData((prev) => setPath(prev, field.path, v))} />
              ))}
            </div>
          )}
          {section.list && (
            <div className="space-y-3">
              {((getPath(data, section.list.path) as Data[] | undefined) ?? []).map((item, index) => (
                <div key={index} className="grid gap-3 rounded-md border border-line p-4 md:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
                  {section.list!.itemFields.map((field) => (
                    <FieldControl
                      key={field.path}
                      field={{ ...field, full: false }}
                      folder={folder}
                      value={item[field.path]}
                      onChange={(v) =>
                        setData((prev) => {
                          const list = [...((getPath(prev, section.list!.path) as Data[]) ?? [])];
                          list[index] = { ...list[index], [field.path]: v };
                          return setPath(prev, section.list!.path, list);
                        })
                      }
                    />
                  ))}
                  <button
                    type="button"
                    aria-label={`Remove ${section.list!.label} ${index + 1}`}
                    onClick={() =>
                      setData((prev) => setPath(prev, section.list!.path, ((getPath(prev, section.list!.path) as Data[]) ?? []).filter((_, i) => i !== index)))
                    }
                    className="inline-flex size-11 items-center justify-center self-end rounded-md text-muted hover:bg-danger-soft hover:text-danger"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Plus className="size-4" aria-hidden />}
                disabled={((getPath(data, section.list.path) as Data[] | undefined)?.length ?? 0) >= (section.list.max ?? 24)}
                onClick={() => setData((prev) => setPath(prev, section.list!.path, [...((getPath(prev, section.list!.path) as Data[]) ?? []), { ...section.list!.empty }]))}
              >
                Add {section.list.label}
              </Button>
            </div>
          )}
        </Card>
      ))}
      <div className="sticky bottom-0 z-20 -mx-4 flex justify-end border-t border-line bg-surface/95 px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:-mx-10 xl:px-10">
        <Button variant="dark" loading={saving} onClick={save} icon={<Save className="size-4" aria-hidden />}>
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
