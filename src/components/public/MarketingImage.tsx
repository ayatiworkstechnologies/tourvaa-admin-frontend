"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

/** Optimize local assets and approved image hosts; preserve other CMS URLs. */
export default function MarketingImage(props: ImageProps) {
  const [failed, setFailed] = useState(false);
  const originalSrc = typeof props.src === "string" ? props.src : "";
  // A local, non-CMS fallback prevents a broken CMS hero/showcase image from
  // causing another remote request or an image-error loop.
  const src = failed ? "/images/tour-card-fallback.jpg" : originalSrc;
  const optimized = src.startsWith("/") && !src.startsWith("//") || src.startsWith("https://images.unsplash.com/");
  return <Image {...props} src={src} alt={props.alt} unoptimized={!optimized} onError={() => setFailed(true)} />;
}
