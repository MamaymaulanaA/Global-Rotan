import {
  Activity,
  Archive,
  CircleCheck,
  Copy,
  Download,
  FilePenLine,
  ImagePlus,
  LogIn,
  Pencil,
  Plus,
  RefreshCw,
  StickyNote,
  Trash2,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { formatDate } from './ui';

export interface ActivityItem {
  id: string;
  actor_email: string | null;
  action: string;
  entity_type: string;
  summary: string | null;
  created_at: string;
}

const ACTIVITY_ICON: Record<string, LucideIcon> = {
  create: Plus,
  update: Pencil,
  delete: Trash2,
  published: CircleCheck,
  draft: FilePenLine,
  archived: Archive,
  archive: Archive,
  unarchive: RefreshCw,
  duplicate: Copy,
  upload: ImagePlus,
  replace: RefreshCw,
  generate: Plus,
  login: LogIn,
  export: Download,
  invite: UserPlus,
  role: UserPlus,
  activate: CircleCheck,
  deactivate: Archive,
  status: CircleCheck,
  quote: StickyNote,
  followed_up: CircleCheck,
  follow_up_reset: RefreshCw,
};

const DANGER = new Set(['delete', 'deactivate']);

/** Vertical timeline: icon node, thin connecting line, summary, admin and timestamp. */
export function ActivityTimeline({ items }: { items: ActivityItem[] }) {
  return (
    <ol>
      {items.map((a, index) => {
        const Icon = ACTIVITY_ICON[a.action] ?? Activity;
        return (
          <li key={a.id} className="relative flex gap-3 pb-5 last:pb-0">
            {index < items.length - 1 && <span className="absolute bottom-0 left-[15.5px] top-8 w-px bg-line" aria-hidden />}
            <span
              className={
                DANGER.has(a.action)
                  ? 'relative flex size-8 shrink-0 items-center justify-center rounded-full border border-danger/25 bg-danger-soft text-danger'
                  : 'relative flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-gold-ink'
              }
            >
              <Icon className="size-3.5" strokeWidth={2} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="break-words text-[0.9375rem] leading-snug text-ink">{a.summary ?? `${a.action} ${a.entity_type}`}</p>
              <p className="mt-1 flex flex-wrap gap-x-1.5 text-[0.75rem] text-muted">
                <span className="max-w-full truncate">{a.actor_email ?? 'System'}</span>
                <span aria-hidden>·</span>
                <time dateTime={a.created_at}>{formatDate(a.created_at, true)}</time>
                <span aria-hidden>·</span>
                <span className="capitalize">{a.entity_type.replace(/_/g, ' ')}</span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
