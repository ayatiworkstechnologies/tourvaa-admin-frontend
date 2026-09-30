"use client";

import React from "react";
import ModuleWrapper from "@/components/common/ModuleWrapper";
import BlogEditorStudio from "@/components/admin/blogs/BlogEditorStudio";

export default function CreateBlogPage() {
  return (
    <ModuleWrapper title="New Blog Article" requiredPermission="blogs.view">
      <BlogEditorStudio />
    </ModuleWrapper>
  );
}
