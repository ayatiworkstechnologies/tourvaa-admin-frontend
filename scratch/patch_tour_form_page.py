form_page_path = r"d:\ayatiworks\2026\tourvaa\tourvaa-admin-frontend\src\components\cms\TourFormPage.tsx"

with open(form_page_path, "r", encoding="utf-8") as f:
    code = f.read()

# 1. Add icons if missing
if "LuPlus as Plus" not in code:
    code = code.replace(
        '  LuTags as Tags,\n',
        '  LuTags as Tags,\n  LuPlus as Plus,\n  LuSparkles as Sparkles,\n  LuInfo as Info,\n'
    )

# 2. Upgrade saveButtonClass to gradient with modern hover/shadow effects
old_save_button = '''  const saveButtonClass = isSupplier
    ? "bg-[#16833A] text-white shadow-[0_4px_12px_rgba(22,131,58,.2)] hover:bg-[#117331]"
    : "bg-dash-brand text-white shadow-[0_4px_12px_rgb(67,169,246,0.25)] hover:bg-dash-brand-hover";'''

new_save_button = '''  const saveButtonClass = isSupplier
    ? "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-800 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all"
    : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-95 transition-all";'''

if old_save_button in code:
    code = code.replace(old_save_button, new_save_button)

# 3. Upgrade the long_description detailer in descriptionFields
old_desc_block = '''              if (key === "long_description") {
                const words = (form.long_description || "").trim().split(/\\s+/).filter(Boolean).length;
                return (
                  <div key={key} className="md:col-span-2 space-y-2 rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          {label}
                        </span>
                        <span className="text-[11px] text-dash-muted">
                          (Shown on public tour page)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const add = "\\n\\nTour Highlight / Experience: Describe the key scenic points, cultural encounters, or included adventures...";
                            update("long_description", (form.long_description ? form.long_description.trimEnd() : "") + add);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                        >
                          + Add Section
                        </button>
                        <span className="text-[11px] text-slate-500">
                          {words} words • {(form.long_description || "").length} characters
                        </span>
                      </div>
                    </div>
                    <textarea
                      value={form.long_description ?? ""}
                      onChange={(e) => update("long_description", e.target.value)}
                      rows={8}
                      placeholder="Comprehensive tour narrative and itinerary overview. Introduce the journey, destination atmosphere, key highlights, travel comfort, and unforgettable memories awaiting guests..."
                      className="w-full min-h-48 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-blue-500 text-slate-900 placeholder:text-slate-400 font-normal"
                    />
                  </div>
                );
              }'''

new_desc_block = '''              if (key === "long_description") {
                const words = (form.long_description || "").trim().split(/\\s+/).filter(Boolean).length;

                const handleAppendSection = (title: string, desc: string) => {
                  const add = `\\n\\n${title}: ${desc}`;
                  update("long_description", (form.long_description ? form.long_description.trimEnd() : "") + add);
                };

                const handleTemplate = () => {
                  const sample = `Tour Overview & Atmosphere: Embark on an unforgettable voyage curated for travellers seeking scenic wonder, effortless comfort, and genuine cultural immersion.\\n\\nKey Highlights: Marvel at world-renowned landscapes, wander charming historic districts, and capture panoramic views from iconic viewpoints along the journey.\\n\\nTravel Comfort & Inclusions: Travel in modern, climate-controlled comfort with expert local guidance, boutique accommodation stays, and authentic culinary stops curated at every turn.`;
                  if (!form.long_description || confirm("Insert standard tour overview narrative template?")) {
                    update("long_description", sample);
                  }
                };

                const handleFormatSpacing = () => {
                  if (!form.long_description) return;
                  const formatted = form.long_description
                    .replace(/(?:^|\\n|(?<=[.!?"]\\s+))([A-Z0-9][A-Za-z0-9\\s&'/–—\\-]+:)/g, "\\n\\n$1")
                    .trim();
                  update("long_description", formatted);
                };

                return (
                  <div key={key} className="md:col-span-2 space-y-3 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 to-slate-50/30 p-4 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 shadow-xs">
                    {/* Header Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                          <Sparkles size={14} className="text-blue-600" />
                          {label} (Narrative Overview)
                        </span>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100">
                          Shown on public tour page
                        </span>
                      </div>
                      <div className="text-[11px] font-medium text-slate-500">
                        <span>{words} words</span>
                        <span className="mx-1.5">•</span>
                        <span>{(form.long_description || "").length} characters</span>
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      value={form.long_description ?? ""}
                      onChange={(e) => update("long_description", e.target.value)}
                      rows={8}
                      placeholder="Comprehensive tour narrative and overview. Introduce the journey, destination atmosphere, key highlights, travel comfort, and unforgettable memories awaiting guests..."
                      className="w-full min-h-48 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-blue-500 text-slate-900 placeholder:text-slate-400 font-normal shadow-2xs"
                    />

                    {/* In-Editor Toolbar Docked Inside Detailer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 shadow-2xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleAppendSection("Tour Highlights & Key Experiences", "Describe the top scenic points, guided adventures, and must-see attractions...")}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow active:scale-95"
                          title="Append a highlighted section"
                        >
                          <Plus size={13} /> Add Highlight Section
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAppendSection("Scenic Route & Landscape", "Describe the route beauty, coastlines, and photographic vistas...")}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          + Scenic Route
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAppendSection("Included Travel Comfort", "Highlight comfortable vehicle transfers, curated accommodation, and attentive service...")}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          + Included Comfort
                        </button>

                        <button
                          type="button"
                          onClick={handleTemplate}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          <Sparkles size={11} className="text-amber-500" /> Template
                        </button>

                        <button
                          type="button"
                          onClick={handleFormatSpacing}
                          disabled={!form.long_description}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                        >
                          Clean Spacing
                        </button>
                      </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
                      <Info size={13} className="text-blue-500 shrink-0" />
                      <span>
                        Use structured section titles (e.g. <strong className="text-slate-700">Tour Highlights:</strong> or <strong className="text-slate-700">Included Comfort:</strong>) to make long tour overviews easy to scan and read for prospective guests.
                      </span>
                    </div>
                  </div>
                );
              }'''

# Find the start and end of the if (key === "long_description") block
start_pos = code.find('if (key === "long_description") {')
end_marker = 'return (\n                <label key={key} className="md:col-span-2">'
end_pos = code.find(end_marker)

if start_pos != -1 and end_pos != -1:
    code = code[:start_pos] + new_desc_block + "\n\n              " + code[end_pos:]
    with open(form_page_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("TourFormPage.tsx updated successfully!")
else:
    print(f"Could not find markers: start={start_pos}, end={end_pos}")
