export function fillTemplate(template: string, vars: Record<string, string | number | null | undefined>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value == null || value === '' ? '-' : String(value);
  });
}

export function whatsappUrl(number: string, text?: string) {
  const digits = number.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
