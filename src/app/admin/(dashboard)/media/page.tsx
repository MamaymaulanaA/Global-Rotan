import { ChevronRight, Folder, FolderOpen, Images } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MediaFileActions, MediaUploader } from '@/components/admin/media-client';
import { AdminPageHeader, EmptyPanel, formatDate } from '@/components/admin/ui';
import { SmartImage } from '@/components/ui/smart-image';
import { requireAdminPage } from '@/lib/admin/auth';

export const metadata: Metadata = { title: 'Media Library' };
const crumb = 'inline-flex min-h-11 items-center gap-1.5 rounded-md border border-transparent px-2 hover:bg-hover-soft aria-[current=page]:font-semibold aria-[current=page]:text-ink';

export default async function MediaPage({ searchParams }: { searchParams: Promise<{ folder?: string }> }) {
  const admin = await requireAdminPage();
  const { folder: rawFolder } = await searchParams;
  const folder = rawFolder && !rawFolder.includes('..') ? rawFolder.replace(/^\/+|\/+$/g, '') : '';
  const { data, error } = await admin.supabase.storage.from('media').list(folder, { limit: 500, sortBy: { column: 'created_at', order: 'desc' } });
  const entries = (data ?? []).filter((e) => e.name !== '.emptyFolderPlaceholder');
  const folders = entries.filter((e) => e.id === null);
  const files = entries.filter((e) => e.id !== null);
  const crumbs = folder ? folder.split('/') : [];
  const publicUrl = (name: string) => admin.supabase.storage.from('media').getPublicUrl(folder ? `${folder}/${name}` : name).data.publicUrl;

  return (
    <>
      <AdminPageHeader title="Media Library" description="Files stored in Supabase Storage (bucket “media”). Product images are managed from each product." />

      <nav aria-label="Folder path" className="mb-4 flex flex-wrap items-center gap-1 text-[0.9375rem]">
        <Link href="/admin/media" aria-current={crumbs.length === 0 ? 'page' : undefined} className={crumb}>
          <FolderOpen className="size-4 text-gold-ink" aria-hidden />
          media
        </Link>
        {crumbs.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            <ChevronRight className="size-3.5 text-muted" aria-hidden />
            <Link href={`/admin/media?folder=${crumbs.slice(0, i + 1).join('/')}`} aria-current={i === crumbs.length - 1 ? 'page' : undefined} className={crumb}>
              {part}
            </Link>
          </span>
        ))}
      </nav>

      <MediaUploader folder={folder || 'site/library'} />

      {error && <p className="my-4 rounded-md border border-danger/25 bg-danger-soft px-4 py-3 text-danger">{error.message}</p>}

      {folders.length > 0 && (
        <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {folders.map((f) => (
            <li key={f.name}>
              <Link href={`/admin/media?folder=${folder ? `${folder}/` : ''}${f.name}`} className="flex min-h-12 items-center gap-2 rounded-md border border-line bg-surface px-3 text-[0.875rem] transition-colors hover:border-line-strong hover:bg-hover-soft">
                <Folder className="size-4 text-gold-ink" aria-hidden />
                <span className="truncate">{f.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {files.length === 0 && folders.length === 0 ? (
        <div className="mt-6 rounded-lg border border-line bg-surface">
          <EmptyPanel icon={Images} title="This folder is empty" description="Upload files above. Demo placeholder images live in the project’s /public/demo folder and are not listed here." />
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {files.map((file) => {
            const path = folder ? `${folder}/${file.name}` : file.name;
            const size = Number((file.metadata as { size?: number } | null)?.size ?? 0);
            return (
              <li key={file.name} className="overflow-hidden rounded-md border border-line bg-surface">
                <div className="relative aspect-square bg-sand">
                  <SmartImage src={publicUrl(file.name)} alt={file.name} fill sizes="240px" className="object-cover" />
                </div>
                <div className="p-2.5">
                  <p className="truncate text-[0.8125rem] font-medium" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[0.75rem] text-muted">
                    {size ? `${(size / 1024).toFixed(0)} KB · ` : ''}
                    {formatDate(file.created_at)}
                  </p>
                  <MediaFileActions path={path} url={publicUrl(file.name)} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
