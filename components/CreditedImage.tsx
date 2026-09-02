import type { ImageResult } from "@/lib/pexels";

export default function CreditedImage({
  image,
  className = "",
}: {
  image: ImageResult;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image.url} alt={image.alt} className="w-full h-full object-cover" />
      <a
        href={image.creditUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 text-[10px] bg-ink/50 text-white px-1.5 py-0.5 rounded backdrop-blur-sm hover:bg-ink/70"
      >
        Photo: {image.credit} / Pexels
      </a>
    </div>
  );
}
