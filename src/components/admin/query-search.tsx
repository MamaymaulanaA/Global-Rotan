'use client';

import { useRef, useState } from 'react';
import { SearchInput, type ControlSize } from '@/components/ui/form';

/**
 * Uncontrolled search field for GET filter forms (`?q=`). Shares the SearchInput look;
 * clearing a previously applied term resubmits the form so the list resets.
 */
export function QuerySearch({
  name = 'q',
  defaultValue = '',
  label,
  placeholder,
  className,
  id,
  controlSize = 'sm',
}: {
  name?: string;
  defaultValue?: string;
  label: string;
  placeholder?: string;
  className?: string;
  id?: string;
  controlSize?: ControlSize;
}) {
  const [value, setValue] = useState(defaultValue);
  const ref = useRef<HTMLInputElement>(null);

  return (
    <SearchInput
      ref={ref}
      id={id}
      name={name}
      label={label}
      placeholder={placeholder}
      value={value}
      controlSize={controlSize}
      className={className}
      onValueChange={(next) => {
        setValue(next);
        if (next === '' && defaultValue) queueMicrotask(() => ref.current?.form?.requestSubmit());
      }}
    />
  );
}
