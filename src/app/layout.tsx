import type { Metadata } from "next";
import { AuthProvider } from "@/providers/AuthProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";
import "./globals.css";
import { DEFAULT_DESCRIPTION, DEFAULT_SOCIAL_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo/pageMetadata";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "travel",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_US", title: SITE_NAME, description: DEFAULT_DESCRIPTION, url: "/", images: [{ url: DEFAULT_SOCIAL_IMAGE, alt: "Tourvaa travel experiences" }] },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: DEFAULT_DESCRIPTION, images: [DEFAULT_SOCIAL_IMAGE] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

