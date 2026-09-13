import type { Metadata } from 'next';
import { SettingsGroupForm, type SettingField, type SettingSection } from '@/components/admin/settings-group-form';
import { AdminPageHeader } from '@/components/admin/ui';
import { requireAdminPage } from '@/lib/admin/auth';
import { DEFAULT_SETTINGS } from '@/lib/settings/defaults';

export const metadata: Metadata = { title: 'Website Content' };

const pair = (base: string, key: string, label: string, type: SettingField['type'] = 'text', rows?: number): SettingField[] => [
  { path: `${base}.${key}_en`, label: `${label} (English)`, type, rows },
  { path: `${base}.${key}_id`, label: `${label} (Indonesian)`, type, rows },
];

const SECTIONS: SettingSection[] = [
  {
    title: 'Home · Hero',
    description: 'Empty fields fall back to the built-in bilingual copy.',
    fields: [...pair('home', 'hero_eyebrow', 'Eyebrow'), ...pair('home', 'hero_title', 'Heading'), ...pair('home', 'hero_description', 'Description', 'textarea'), { path: 'home.hero_image', label: 'Hero image (16:11)', type: 'image' }],
  },
  {
    title: 'Home · Brand introduction',
    fields: [...pair('home', 'intro_title', 'Heading'), ...pair('home', 'intro_body', 'Body', 'textarea', 4), { path: 'home.intro_image', label: 'Image (4:5)', type: 'image' }],
  },
  {
    title: 'Home · Custom & project section',
    fields: [...pair('home', 'project_title', 'Heading'), ...pair('home', 'project_body', 'Body', 'textarea', 4), { path: 'home.project_image', label: 'Image (16:11)', type: 'image' }],
  },
  { title: 'Home · Closing call to action', fields: [...pair('home', 'cta_title', 'Heading'), ...pair('home', 'cta_body', 'Body', 'textarea')] },
  {
    title: 'Trusted clients',
    description: 'Only add client names or logos you have permission to show. Items marked as demo show a placeholder note.',
    list: { path: 'clients', label: 'client', max: 24, empty: { name: '', logo_url: '', is_demo: false }, itemFields: [{ path: 'name', label: 'Client name' }, { path: 'logo_url', label: 'Logo', type: 'image' }, { path: 'is_demo', label: 'Demo placeholder', type: 'checkbox' }] },
  },
  {
    title: 'About Us page',
    fields: [...pair('about', 'title', 'Heading'), ...pair('about', 'description', 'Intro', 'textarea'), ...pair('about', 'story_title', 'Story heading'), ...pair('about', 'story_body', 'Story (blank line = new paragraph)', 'textarea', 8), { path: 'about.image', label: 'Story image (4:5)', type: 'image' }],
  },
  {
    title: 'About Us · Verified company facts',
    description: 'Leave empty until figures (years in business, capacity, export countries…) are verified. The section shows a neutral message when empty.',
    list: { path: 'about_facts', label: 'fact', max: 8, empty: { value: '', label_en: '', label_id: '' }, itemFields: [{ path: 'value', label: 'Value' }, { path: 'label_en', label: 'Label (EN)' }, { path: 'label_id', label: 'Label (ID)' }] },
  },
  { title: 'Custom Furniture page', fields: [...pair('custom', 'title', 'Heading'), ...pair('custom', 'description', 'Intro', 'textarea'), { path: 'custom.image', label: 'Image (4:5)', type: 'image' }] },
  { title: 'Export Information page', fields: [...pair('export', 'title', 'Heading'), ...pair('export', 'description', 'Intro', 'textarea'), { path: 'export.image', label: 'Banner image (21:9)', type: 'image' }] },
];

export default async function ContentPage() {
  const admin = await requireAdminPage();
  const { data } = await admin.supabase.from('site_settings').select('value').eq('key', 'content').maybeSingle();
  const stored = ((data as { value: Record<string, unknown> } | null)?.value ?? {}) as Record<string, unknown>;
  const initial = {
    home: {},
    about: {},
    about_facts: [],
    custom: {},
    export: {},
    clients: [],
    ...(DEFAULT_SETTINGS.content as Record<string, unknown>),
    ...stored,
  } as Record<string, unknown>;
  // Remove legacy keys that are not part of the schema
  if (initial.about && typeof initial.about === 'object') {
    const about = { ...(initial.about as Record<string, unknown>) };
    delete about.facts;
    initial.about = about;
  }

  return (
    <>
      <AdminPageHeader title="Website Content" description="Edit bilingual copy and images on the public pages without touching code." />
      <SettingsGroupForm settingsKey="content" initial={initial} sections={SECTIONS} submitLabel="Save content" />
    </>
  );
}
