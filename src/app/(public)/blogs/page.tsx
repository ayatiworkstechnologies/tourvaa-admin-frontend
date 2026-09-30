import React from "react";
import BlogsListClient from "@/components/public/blogs/BlogsListClient";
import { fetchBlogsListForServer } from "@/lib/seo/blogMetadata";
import { CmsBlog } from "@/lib/api/publicClient";

export const revalidate = 0; // Ensure fresh blog list on every visit

export default async function BlogsPage() {
  const serverBlogs = await fetchBlogsListForServer();
  const sorted = [...(serverBlogs as CmsBlog[])].sort((a, b) =>
    (b.published_at || b.created_at || "").localeCompare(
      a.published_at || a.created_at || ""
    )
  );

  return <BlogsListClient initialPosts={sorted} />;
}
