"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowLeft as ArrowLeft } from "react-icons/lu";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import BlogEditorStudio from "@/components/admin/blogs/BlogEditorStudio";
import Loader from "@/components/ui/Loader";
import api from "@/lib/api/client";
import { BlogItem } from "@/lib/types/blog";
import { useToast } from "@/hooks/useToast";

export default function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const toast = useToast();
  const [blog, setBlog] = useState<BlogItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/cms/blogs/${id}`)
      .then((res) => {
        if (!active) return;
        const data = res.data?.data || res.data;
        if (data) {
          setBlog(data);
        } else {
          setError(true);
        }
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load blog:", err);
        setError(true);
        toast.error("Could not load the requested blog article.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, toast]);

  if (loading) {
    return (
      <ModuleWrapper title="Edit Blog" requiredPermission="blogs.view">
        <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader label="Loading blog article details..." compact />
        </div>
      </ModuleWrapper>
    );
  }

  if (error || !blog) {
    return (
      <ModuleWrapper title="Blog Not Found" requiredPermission="blogs.view">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
          <p className="text-base font-bold text-slate-800">
            The requested blog article could not be found or has been deleted.
          </p>
          <Link
            href="/admin/blogs"
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition"
          >
            <ArrowLeft size={14} /> Back to Blogs
          </Link>
        </div>
      </ModuleWrapper>
    );
  }

  return (
    <ModuleWrapper title={`Edit: ${blog.title}`} requiredPermission="blogs.view">
      <BlogEditorStudio initialBlog={blog} />
    </ModuleWrapper>
  );
}
