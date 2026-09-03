import type { ImageResult } from "@/lib/pexels";

export default function CreditedImage({
  image,
  className = "",
}: {
  image: ImageResult;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image.url} alt={image.alt} className={`w-full h-full object-cover ${className}`} />
  );
}
