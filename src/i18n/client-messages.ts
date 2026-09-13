import type { AbstractIntlMessages } from 'next-intl';

/**
 * Namespaces read with `useTranslations` inside Client Components. Only these are
 * serialised into every page; server-only copy (meta, footer, about, legal…) stays on
 * the server. Add a namespace here when a new client component needs it.
 */
const CLIENT_NAMESPACES = [
  'availability',
  'badges',
  'catalog',
  'colorFamilies',
  'common',
  'contact',
  'customerTypes',
  'errors',
  'favorites',
  'floating',
  'header',
  'inquiry',
  'materials',
  'nav',
  'price',
  'product',
  'quickView',
  'quote',
  'search',
  'success',
  'usage',
  'validation',
] as const;

/** Nested namespaces where the client only needs one branch. */
const CLIENT_SUBTREES = [['home', 'project']] as const;

export function pickClientMessages(messages: AbstractIntlMessages): AbstractIntlMessages {
  const picked: AbstractIntlMessages = {};
  for (const key of CLIENT_NAMESPACES) {
    if (messages[key] !== undefined) picked[key] = messages[key];
  }
  for (const [parent, child] of CLIENT_SUBTREES) {
    const branch = messages[parent];
    if (branch && typeof branch === 'object' && child in branch) {
      picked[parent] = { ...((picked[parent] as AbstractIntlMessages) ?? {}), [child]: (branch as AbstractIntlMessages)[child] };
    }
  }
  return picked;
}
