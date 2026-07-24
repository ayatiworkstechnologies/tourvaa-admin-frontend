import type { Metadata } from "next";

export const SITE_NAME = "Tourvaa";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
export const DEFAULT_DESCRIPTION = "Discover curated tours, trusted travel experiences, and simple online booking with Tourvaa.";
export const DEFAULT_SOCIAL_IMAGE = "/images/tour-card-fallback.jpg";

type PageDefinition = {
  title: string;
  description: string;
  index?: boolean;
  keywords?: string[];
};

export const PAGE_METADATA: Record<string, PageDefinition> = {
  "/": { title: "Curated Tours & Travel Experiences", description: DEFAULT_DESCRIPTION, keywords: ["tours", "travel experiences", "holiday packages", "Tourvaa"] },
  "/about": { title: "About Us", description: "Learn how Tourvaa connects travellers with curated tours, trusted suppliers, and dependable booking support." },
  "/accessibility": { title: "Accessibility", description: "Read Tourvaa's accessibility commitment and learn how we make travel discovery and booking easier for everyone." },
  "/blogs": { title: "Travel Guides & Stories", description: "Explore Tourvaa travel guides, destination inspiration, planning advice, and stories for your next journey." },
  "/blogs/[slug]": { title: "Travel Guide", description: "Read destination insights, practical travel advice, and trip inspiration from the Tourvaa travel guide." },
  "/booking/[id]": { title: "Complete Your Booking", description: "Review travellers, trip options, pricing, and secure payment details to complete your Tourvaa booking.", index: false },
  "/cart": { title: "Your Cart", description: "Review saved Tourvaa packages and continue securely to booking.", index: false },
  "/cancellation-policy": { title: "Cancellation Policy", description: "Understand Tourvaa cancellation timelines, refund eligibility, supplier conditions, and booking change procedures." },
  "/contact": { title: "Contact Us", description: "Contact the Tourvaa team for booking assistance, tour questions, partnership enquiries, or platform support." },
  "/cookie-policy": { title: "Cookie Policy", description: "Learn how Tourvaa uses cookies and similar technologies to operate, secure, and improve the website." },
  "/destinations": { title: "Travel Destinations", description: "Browse inspiring destinations and find curated Tourvaa experiences for city breaks, holidays, and memorable adventures." },
  "/login": { title: "Sign In", description: "Sign in to your Tourvaa customer, supplier, agent, affiliate, or administration account.", index: false },
  "/register": { title: "Create an Account", description: "Create your Tourvaa customer account to save travellers, manage bookings, payments, invoices, and support.", index: false },
  "/account-status": { title: "Account Status", description: "Check the verification and activation status of your Tourvaa account.", index: false },
  "/auth/verify-email": { title: "Verify Email", description: "Verify your Tourvaa email and create a secure password.", index: false },
  "/terms": { title: "Terms & Conditions", description: "Review the terms governing Tourvaa accounts, tour bookings, payments, cancellations, suppliers, and platform use." },
  "/tours": { title: "Browse Tours", description: "Compare curated tours by destination, dates, duration, availability, and price, then book securely with Tourvaa." },
  "/tours/[id]": { title: "Tour Details", description: "Review tour itinerary, inclusions, available dates, optional experiences, accommodation, and pricing on Tourvaa." },
  "/tours/[id]/[slug]": { title: "Tour Details", description: "Review tour itinerary, inclusions, available dates, optional experiences, accommodation, and pricing on Tourvaa." },
  "/tours/[country]/[slug]": { title: "Tour Details", description: "Review tour itinerary, inclusions, available dates, optional experiences, accommodation, and pricing on Tourvaa." },
  "/wishlist": { title: "Your Wishlist", description: "Review and compare tours saved to your Tourvaa wishlist.", index: false },
  "/customer/wishlist": { title: "My Wishlist", description: "Review tours saved to your Tourvaa customer account.", index: false },
  "/forgot-password": { title: "Forgot Password", description: "Request a secure password reset link for your Tourvaa account.", index: false },
  "/reset-password": { title: "Reset Password", description: "Choose a new secure password and restore access to your Tourvaa account.", index: false },
  "/join/affiliate": { title: "Become a Tourvaa Affiliate", description: "Apply to promote Tourvaa experiences, share tracked referral links, and earn commission from eligible bookings." },
  "/join/agent": { title: "Become a Tourvaa Travel Agent", description: "Register your travel agency with Tourvaa to serve customers, create bookings, manage payments, and access invoices." },
  "/join/supplier": { title: "Become a Tourvaa Supplier", description: "Join Tourvaa as a tour supplier to publish experiences, manage bookings, track earnings, and request payouts." },

  "/admin": { title: "Administration", description: "Open the secure Tourvaa administration workspace.", index: false },
  "/admin/login": { title: "Admin Sign In", description: "Sign in securely to the Tourvaa administration console.", index: false },
  "/admin/dashboard": { title: "Admin Dashboard", description: "Monitor Tourvaa operations, approvals, bookings, payments, and recent platform activity.", index: false },
  "/admin/activity-logs": { title: "Activity Logs", description: "Review operational activity recorded across the Tourvaa administration console.", index: false },
  "/admin/audit-logs": { title: "Audit Logs", description: "Inspect security and data-change audit records for Tourvaa administration.", index: false },
  "/admin/affiliates": { title: "Affiliate Management", description: "Review affiliate accounts, status, performance, and commercial settings.", index: false },
  "/admin/affiliates/[id]": { title: "Affiliate Details", description: "Review and manage a Tourvaa affiliate profile, approval, and performance details.", index: false },
  "/admin/agents": { title: "Agent Management", description: "Review travel agent accounts, verification status, discounts, and access.", index: false },
  "/admin/agents/[id]": { title: "Agent Verification", description: "Review an agent profile, business information, documents, and approval status.", index: false },
  "/admin/bookings": { title: "Booking Management", description: "Search, review, and manage Tourvaa bookings across customers, agents, tours, and suppliers.", index: false },
  "/admin/bookings/[id]": { title: "Booking Details", description: "Review booking execution, travellers, pricing, payment, supplier decision, and status history.", index: false },
  "/admin/chatbot": { title: "Chatbot Management", description: "Configure and review Tourvaa chatbot content and support behaviour.", index: false },
  "/admin/cms": { title: "Content Management", description: "Manage Tourvaa website content and publishing records.", index: false },
  "/admin/customers": { title: "Customer Management", description: "Search and manage Tourvaa customer profiles, bookings, payments, and communications.", index: false },
  "/admin/customers/[id]": { title: "Customer Details", description: "Review a customer's profile, booking history, payments, and communication activity.", index: false },
  "/admin/discounts": { title: "Discount Management", description: "Create and manage Tourvaa promotional discounts and eligibility rules.", index: false },
  "/admin/email-templates": { title: "Email Templates", description: "Manage transactional and operational email templates sent by Tourvaa.", index: false },
  "/admin/invoices": { title: "Invoice Management", description: "Review and download invoices generated for Tourvaa bookings and payments.", index: false },
  "/admin/notifications": { title: "Notifications", description: "Review and manage Tourvaa system and operational notifications.", index: false },
  "/admin/payments": { title: "Payment Management", description: "Monitor payment attempts, captures, refunds, voids, and gateway statuses.", index: false },
  "/admin/permissions": { title: "Permission Management", description: "Manage fine-grained Tourvaa administration permissions.", index: false },
  "/admin/profile": { title: "Admin Profile", description: "Manage your Tourvaa administrator profile and account security.", index: false },
  "/admin/refunds": { title: "Refunds & Cancellations", description: "Review cancellation requests, refund eligibility, policies, and refund processing.", index: false },
  "/admin/reports": { title: "Reports", description: "Review Tourvaa booking, revenue, supplier, customer, and operational reports.", index: false },
  "/admin/roles": { title: "Role Management", description: "Configure administration roles and their Tourvaa permissions.", index: false },
  "/admin/sessions": { title: "Active Sessions", description: "Review and manage authenticated Tourvaa administration sessions.", index: false },
  "/admin/settings": { title: "Platform Settings", description: "Configure Tourvaa platform, business, localization, and operational settings.", index: false },
  "/admin/settings/api": { title: "API Settings", description: "Configure secure third-party API and integration settings for Tourvaa.", index: false },
  "/admin/settings/cities": { title: "City Settings", description: "Manage cities available for Tourvaa tours, customers, suppliers, and agents.", index: false },
  "/admin/settings/countries": { title: "Country Settings", description: "Manage supported countries, currencies, and localization details.", index: false },
  "/admin/settings/payment": { title: "Payment Settings", description: "Configure Tourvaa payment gateways, currencies, and checkout settings.", index: false },
  "/admin/supplier-payouts": { title: "Supplier Payouts", description: "Review supplier balances, payout requests, approvals, and payment status.", index: false },
  "/admin/suppliers": { title: "Supplier Management", description: "Review supplier accounts, verification, vehicles, tours, and commercial settings.", index: false },
  "/admin/suppliers/[id]": { title: "Supplier Verification", description: "Review supplier business details, documents, vehicles, and approval status.", index: false },
  "/admin/tour-approval": { title: "Tour Approvals", description: "Review submitted tour versions and approve or reject publication changes.", index: false },
  "/admin/tours": { title: "Tour Management", description: "Create, review, edit, publish, and manage Tourvaa tour inventory.", index: false },
  "/admin/tours/create": { title: "Create Tour", description: "Create a new Tourvaa tour with itinerary, pricing, availability, and media.", index: false },
  "/admin/tours/[id]/edit": { title: "Edit Tour", description: "Update tour content, itinerary, pricing, availability, and publication details.", index: false },
  "/admin/tours/categories": { title: "Tour Categories", description: "Manage the categories used to organize Tourvaa tour inventory.", index: false },
  "/admin/tours/subcategories": { title: "Tour Subcategories", description: "Manage detailed subcategories used to classify Tourvaa tours.", index: false },
  "/admin/users": { title: "User Management", description: "Manage Tourvaa administration users, roles, status, and account access.", index: false },
  "/admin/users/[id]": { title: "User Details", description: "Review and manage a Tourvaa user account lifecycle.", index: false },

  "/agent/dashboard": { title: "Agent Dashboard", description: "Review agency bookings, sales activity, customers, and operational updates.", index: false },
  "/agent/tours": { title: "Agent Tour Catalogue", description: "Browse published Tourvaa tours and select experiences for agent customers.", index: false },
  "/agent/bookings": { title: "Agent Bookings", description: "Track agency bookings, payments, supplier decisions, and travel status.", index: false },
  "/agent/bookings/create": { title: "Agent Bookings", description: "Redirects retired agent booking creation links to the booking list.", index: false },
  "/agent/bookings/[id]": { title: "Agent Booking Details", description: "Review travellers, pricing, payment, supplier acceptance, and booking execution.", index: false },
  "/agent/customers": { title: "Agent Customers", description: "Create and manage customer profiles used for agency tour bookings.", index: false },
  "/agent/invoices": { title: "Agent Invoices", description: "Review and download invoices for bookings created by your agency.", index: false },
  "/agent/messages": { title: "Agent Messages", description: "View agency support conversations and contact the Tourvaa team.", index: false },
  "/agent/profile": { title: "Agent Profile & Verification", description: "Manage agency details, security, required documents, and verification status.", index: false },

  "/supplier/dashboard": { title: "Supplier Dashboard", description: "Monitor supplier tours, bookings, earnings, payouts, and operational alerts.", index: false },
  "/supplier/bookings": { title: "Supplier Bookings", description: "Review booking requests, accept paid reservations, and manage tour execution.", index: false },
  "/supplier/bookings/[id]": { title: "Supplier Booking Details", description: "Review reservation details, payment readiness, travellers, and booking status.", index: false },
  "/supplier/earnings": { title: "Supplier Earnings", description: "Track completed booking earnings, reserved funds, and available supplier balance.", index: false },
  "/supplier/messages": { title: "Supplier Messages", description: "Review supplier support conversations and contact the Tourvaa team.", index: false },
  "/supplier/notifications": { title: "Supplier Notifications", description: "Review supplier approval, verification, booking, and account updates from Tourvaa.", index: false },
  "/supplier/payouts": { title: "Supplier Payouts", description: "Review payout history and request eligible supplier earnings.", index: false },
  "/supplier/profile": { title: "Supplier Profile & Verification", description: "Manage company information, vehicles, documents, and supplier verification.", index: false },
  "/supplier/tours": { title: "Supplier Tours", description: "Create and manage tour inventory submitted by your supplier account.", index: false },
  "/supplier/tours/create": { title: "Create Supplier Tour", description: "Build a tour with overview, itinerary, inclusions, pricing, availability, and media.", index: false },
  "/supplier/tours/[id]/edit": { title: "Edit Supplier Tour", description: "Update a supplier tour and submit changes for administrative approval.", index: false },
  "/supplier/tours/[id]/preview": { title: "Preview Supplier Tour", description: "Privately preview tour content, itinerary, pricing, and media before publication.", index: false },

  "/customer/dashboard": { title: "Customer Dashboard", description: "Review upcoming trips, recent bookings, payments, and travel updates.", index: false },
  "/customer/bookings": { title: "My Bookings", description: "Track your Tourvaa reservations, supplier confirmations, payments, and trip status.", index: false },
  "/customer/bookings/[id]": { title: "My Booking Details", description: "Review your trip, travellers, price, payments, supplier confirmation, and timeline.", index: false },
  "/customer/cancellations": { title: "My Cancellations", description: "Review cancellation requests, eligibility, refund estimates, and processing status.", index: false },
  "/customer/invoices": { title: "My Invoices", description: "View and download invoices for your Tourvaa bookings and payments.", index: false },
  "/customer/payments": { title: "My Payments", description: "Review deposits, balances, completed payments, and transaction status.", index: false },
  "/customer/profile": { title: "My Profile", description: "Manage your Tourvaa personal details, contact information, and account security.", index: false },
  "/customer/support": { title: "Customer Support", description: "Review support conversations and contact Tourvaa about your account or booking.", index: false },
  "/customer/travellers": { title: "My Travellers", description: "Save and manage traveller information for faster Tourvaa booking.", index: false },

  "/affiliate/dashboard": { title: "Affiliate Dashboard", description: "Monitor affiliate clicks, conversions, commissions, and payout performance.", index: false },
  "/affiliate/clicks": { title: "Affiliate Clicks", description: "Review tracked visits generated by your Tourvaa referral links.", index: false },
  "/affiliate/commissions": { title: "Affiliate Commissions", description: "Track pending, approved, and paid commission earned from referrals.", index: false },
  "/affiliate/conversions": { title: "Affiliate Conversions", description: "Review bookings and customers attributed to your affiliate referrals.", index: false },
  "/affiliate/payouts": { title: "Affiliate Payouts", description: "Review payout history and commission payment status.", index: false },
  "/affiliate/profile": { title: "Affiliate Profile", description: "Manage affiliate contact, promotion, and account information.", index: false },
  "/affiliate/referral-links": { title: "Referral Links", description: "Create and manage trackable Tourvaa affiliate referral links.", index: false },
};

export function metadataFor(path: keyof typeof PAGE_METADATA | string, resolvedPath?: string): Metadata {
  const definition = PAGE_METADATA[path];
  if (!definition) throw new Error(`Missing metadata definition for ${path}`);
  const index = definition.index !== false;
  const absoluteTitle = `${definition.title} | ${SITE_NAME}`;
  const canonicalPath = resolvedPath || (path.includes("[") ? undefined : path);

  return {
    title: definition.title,
    description: definition.description,
    keywords: definition.keywords,
    alternates: index && canonicalPath ? { canonical: canonicalPath } : undefined,
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false, noarchive: true, nosnippet: true },
    openGraph: index
      ? {
          type: "website",
          siteName: SITE_NAME,
          locale: "en_US",
          title: absoluteTitle,
          description: definition.description,
          url: canonicalPath,
          images: [{ url: DEFAULT_SOCIAL_IMAGE, alt: `${definition.title} - ${SITE_NAME}` }],
        }
      : undefined,
    twitter: index
      ? {
          card: "summary_large_image",
          title: absoluteTitle,
          description: definition.description,
          images: [DEFAULT_SOCIAL_IMAGE],
        }
      : undefined,
  };
}
