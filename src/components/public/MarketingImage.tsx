import Image, { type ImageProps } from "next/image";

/** Optimize local assets and approved image hosts; preserve other CMS URLs. */
export default function MarketingImage(props: ImageProps) {
  const src = typeof props.src === "string" ? props.src : "";
  const optimized = src.startsWith("/") && !src.startsWith("//") || src.startsWith("https://images.unsplash.com/");
  return <Image {...props} alt={props.alt} unoptimized={!optimized} />;
}
