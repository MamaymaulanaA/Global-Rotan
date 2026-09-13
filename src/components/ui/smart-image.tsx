import Image, { type ImageProps } from 'next/image';
import { ImageOff } from 'lucide-react';
import { cn, isSvg } from '@/lib/utils';

type SmartImageProps = Omit<ImageProps, 'src'> & { src: string | null | undefined; fallbackLabel?: string };

/** next/image wrapper: skips optimization for SVG placeholders and shows a calm fallback when missing. */
export function SmartImage({ src, alt, className, fallbackLabel, ...props }: SmartImageProps) {
  if (!src) {
    return (
      <div className={cn('flex size-full flex-col items-center justify-center gap-2 bg-sand text-muted', className)} role="img" aria-label={alt}>
        <ImageOff className="size-6" aria-hidden />
        {fallbackLabel && <span className="text-xs">{fallbackLabel}</span>}
      </div>
    );
  }
  return <Image src={src} alt={alt} className={className} unoptimized={isSvg(src) || props.unoptimized} {...props} />;
}
