itinerary_path = r"d:\ayatiworks\2026\tourvaa\tourvaa-admin-frontend\src\components\tours\TourItineraryTab.tsx"

with open(itinerary_path, "r", encoding="utf-8") as f:
    code = f.read()

# Replace references to stop/stops with point/points in ItineraryLongDescriptionEditor
old_block = """function ItineraryLongDescriptionEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);

  const stops = useMemo(() => parseStopTitles(value), [value]);
  const wordCount = useMemo(() => (value ? value.trim().split(/\\s+/).filter(Boolean).length : 0), [value]);

  const handleAddStop = () => {
    const nextNum = stops.length + 1;
    const addition = `\\n\\nStop ${nextNum} – Landmark Highlight: Describe the scenic views, guided exploration, and key moments for travellers here...`;
    onChange((value ? value.trimEnd() : "") + addition);
  };

  const handleInsertSection = (title: string, desc: string) => {
    const addition = `\\n\\n${title}: ${desc}`;
    onChange((value ? value.trimEnd() : "") + addition);
  };

  const handleInsertTemplate = () => {
    const sample = `Auckland Harbour Bridge – A City Icon: Begin your journey with a smooth drive over the Auckland Harbour Bridge, enjoying panoramic harbour views and distant volcanic peaks.\\n\\nDevonport – Heritage Charm & Stunning Views: Cross to Devonport, a charming waterfront gem with Victorian-style streets, art galleries, and historic Mount Victoria lookouts.\\n\\nSky Tower – Auckland's Iconic Skyline: End your luxurious city adventure with a visit to the Sky Tower for breathtaking 360-degree vistas of the city and beyond.`;
    if (!value || confirm("Insert structured multi-stop itinerary template?")) {
      onChange(sample);
    }
  };

  const handleFormatSpacing = () => {
    if (!value) return;
    const formatted = value
      .replace(/(?:^|\\n|(?<=[.!?"]\\s+))([A-Z0-9][A-Za-z0-9\\s&'/–—\\-]+:)/g, "\\n\\n$1")
      .trim();
    onChange(formatted);
  };

  return (
    <div className="md:col-span-2 space-y-3 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 to-slate-50/30 p-4 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 shadow-xs">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
            <Sparkles size={14} className="text-blue-600" />
            Detailed Day Narrative & Milestone Stops
          </span>
          {stops.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {stops.length} Milestone Stop{stops.length === 1 ? "" : "s"} Formatted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
              Structured Narrative Mode
            </span>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              showPreview
                ? "bg-slate-900 text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs"
            }`}
            title="Toggle between editor and public card preview"
          >
            <Eye size={13} /> {showPreview ? "Back to Editor" : "Card Preview"}
          </button>
        </div>
      </div>

      {/* Detected Milestone Chips */}
      {stops.length > 0 && !showPreview && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 uppercase tracking-wide">
            Detected:
          </span>
          {stops.map((title, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 shrink-0 rounded-md border border-blue-100 bg-blue-50/80 px-2 py-0.5 text-[11px] font-semibold text-blue-800"
              title={`Milestone card ${i + 1}: ${title}`}
            >
              <MapPin size={11} className="text-blue-500" />
              <span className="max-w-[140px] truncate">{i + 1}. {title}</span>
            </span>
          ))}
        </div>
      )}

      {/* Editor or Preview Mode */}
      {showPreview ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 min-h-[220px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Public Tour Page Preview ({stops.length} Milestones)
            </p>
            <span className="text-[11px] text-slate-400">
              How travellers see this day on the live tour page
            </span>
          </div>
          {stops.length > 0 ? (
            <div className="space-y-2.5">
              {stops.map((title, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/30">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-[11px] font-black text-white shadow-xs">
                    {i + 1}
                  </span>
                  <div>
                    <h6 className="text-sm font-bold text-slate-900">{title}</h6>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Structured milestone card automatically highlighted on the public tour page.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-slate-500 italic">
                No landmark milestones formatted yet. Click &quot;Back to Editor&quot; and use the pattern:
              </p>
              <code className="mt-2 inline-block rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-blue-600">
                Landmark Name – Highlight: Description text...
              </code>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Main Textarea */}
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            placeholder={`Enter the day's detailed itinerary narrative. Format each stop as:

Landmark Name – Highlight Title: Detailed description of what travellers will see and experience...

Each formatted stop automatically generates an individual numbered milestone card on the traveller tour page!`}
            className="w-full min-h-[190px] resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-blue-500 text-slate-900 placeholder:text-slate-400 font-normal shadow-2xs"
          />

          {/* In-Editor Toolbar Docked Inside Text Area Detailer */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 shadow-2xs">
            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleAddStop}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow active:scale-95"
                title="Append a new structured stop milestone"
              >
                <Plus size={13} /> Add Stop / Landmark
              </button>

              <button
                type="button"
                onClick={() => handleInsertSection("Morning Exploration", "Depart early for a scenic journey through...")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                title="Insert morning milestone"
              >
                + Morning
              </button>

              <button
                type="button"
                onClick={() => handleInsertSection("Afternoon Discovery", "Arrive at the destination and enjoy guided access to...")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                title="Insert afternoon milestone"
              >
                + Afternoon
              </button>

              <button
                type="button"
                onClick={() => handleInsertSection("Included Lunch / Tasting", "Savor an authentic local meal featuring regional specialties...")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                title="Insert meal highlight"
              >
                + Meal / Activity
              </button>

              <button
                type="button"
                onClick={handleInsertTemplate}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                title="Load standard multi-stop template"
              >
                <Sparkles size={11} className="text-amber-500" /> Template
              </button>

              <button
                type="button"
                onClick={handleFormatSpacing}
                disabled={!value}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                title="Clean paragraph spacing between stops"
              >
                Clean Spacing
              </button>
            </div>

            {/* Stats Counter */}
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span>{stops.length} stop{stops.length === 1 ? "" : "s"}</span>
              <span>•</span>
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{value.length} chars</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info Pro Tip */}
      <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
        <Info size={13} className="text-blue-500 shrink-0" />
        <span>
          Format milestones as <strong className="text-slate-700">Landmark – Highlight: Description</strong> to automatically render numbered milestone cards on the traveller tour page.
        </span>
      </div>
    </div>
  );
}"""

new_block = """function ItineraryLongDescriptionEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [showPreview, setShowPreview] = useState(false);

  const points = useMemo(() => parseStopTitles(value), [value]);
  const wordCount = useMemo(() => (value ? value.trim().split(/\\s+/).filter(Boolean).length : 0), [value]);

  const handleAddPoint = () => {
    const nextNum = points.length + 1;
    const addition = `\\n\\nPoint ${nextNum} – Landmark / Highlight: Describe the scenic views, guided exploration, and key moments for travellers here...`;
    onChange((value ? value.trimEnd() : "") + addition);
  };

  const handleInsertSection = (title: string, desc: string) => {
    const addition = `\\n\\n${title}: ${desc}`;
    onChange((value ? value.trimEnd() : "") + addition);
  };

  const handleInsertTemplate = () => {
    const sample = `Auckland Harbour Bridge – A City Icon: Begin your journey with a smooth drive over the Auckland Harbour Bridge, enjoying panoramic harbour views and distant volcanic peaks.\\n\\nDevonport – Heritage Charm & Stunning Views: Cross to Devonport, a charming waterfront gem with Victorian-style streets, art galleries, and historic Mount Victoria lookouts.\\n\\nSky Tower – Auckland's Iconic Skyline: End your luxurious city adventure with a visit to the Sky Tower for breathtaking 360-degree vistas of the city and beyond.`;
    if (!value || confirm("Insert structured multi-point itinerary template?")) {
      onChange(sample);
    }
  };

  const handleFormatSpacing = () => {
    if (!value) return;
    const formatted = value
      .replace(/(?:^|\\n|(?<=[.!?"]\\s+))([A-Z0-9][A-Za-z0-9\\s&'/–—\\-]+:)/g, "\\n\\n$1")
      .trim();
    onChange(formatted);
  };

  return (
    <div className="md:col-span-2 space-y-3 rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/70 to-slate-50/30 p-4 transition-all focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 shadow-xs">
      {/* Editor Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
            <Sparkles size={14} className="text-blue-600" />
            Detailed Day Narrative & Key Points
          </span>
          {points.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {points.length} Key Point{points.length === 1 ? "" : "s"} Formatted
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
              Structured Narrative Mode
            </span>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowPreview((p) => !p)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition-all ${
              showPreview
                ? "bg-slate-900 text-white shadow-xs"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 shadow-2xs"
            }`}
            title="Toggle between editor and public card preview"
          >
            <Eye size={13} /> {showPreview ? "Back to Editor" : "Card Preview"}
          </button>
        </div>
      </div>

      {/* Detected Point Chips */}
      {points.length > 0 && !showPreview && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 uppercase tracking-wide">
            Points:
          </span>
          {points.map((title, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 shrink-0 rounded-md border border-blue-100 bg-blue-50/80 px-2 py-0.5 text-[11px] font-semibold text-blue-800"
              title={`Point ${i + 1}: ${title}`}
            >
              <MapPin size={11} className="text-blue-500" />
              <span className="max-w-[140px] truncate">{i + 1}. {title}</span>
            </span>
          ))}
        </div>
      )}

      {/* Editor or Preview Mode */}
      {showPreview ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 min-h-[220px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
              Public Tour Page Preview ({points.length} Points)
            </p>
            <span className="text-[11px] text-slate-400">
              How travellers see each point on the live tour page
            </span>
          </div>
          {points.length > 0 ? (
            <div className="space-y-2.5">
              {points.map((title, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/30">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-[11px] font-black text-white shadow-xs">
                    {i + 1}
                  </span>
                  <div>
                    <h6 className="text-sm font-bold text-slate-900">{title}</h6>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Key point card automatically highlighted on the public tour page.
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-slate-500 italic">
                No landmark points formatted yet. Click &quot;Back to Editor&quot; and use the pattern:
              </p>
              <code className="mt-2 inline-block rounded-md bg-slate-100 px-3 py-1.5 text-xs font-semibold text-blue-600">
                Landmark Name – Highlight: Description text...
              </code>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Main Textarea */}
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            placeholder={`Enter the day's detailed itinerary narrative. Format each point as:

Landmark / Highlight Title: Detailed description of what travellers will see and experience...

Each formatted point automatically generates an individual numbered milestone card on the traveller tour page!`}
            className="w-full min-h-[190px] resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-blue-500 text-slate-900 placeholder:text-slate-400 font-normal shadow-2xs"
          />

          {/* In-Editor Toolbar Docked Inside Text Area Detailer */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-2 shadow-2xs">
            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleAddPoint}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:from-blue-700 hover:to-indigo-700 hover:shadow active:scale-95"
                title="Append a new structured point"
              >
                <Plus size={13} /> Add Point / Landmark
              </button>

              <button
                type="button"
                onClick={() => handleInsertSection("Morning Exploration", "Depart early for a scenic journey through...")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                title="Insert morning point"
              >
                + Morning
              </button>

              <button
                type="button"
                onClick={() => handleInsertSection("Afternoon Discovery", "Arrive at the destination and enjoy guided access to...")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                title="Insert afternoon point"
              >
                + Afternoon
              </button>

              <button
                type="button"
                onClick={() => handleInsertSection("Included Lunch / Tasting", "Savor an authentic local meal featuring regional specialties...")}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                title="Insert meal point"
              >
                + Meal / Activity
              </button>

              <button
                type="button"
                onClick={handleInsertTemplate}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                title="Load standard multi-point template"
              >
                <Sparkles size={11} className="text-amber-500" /> Template
              </button>

              <button
                type="button"
                onClick={handleFormatSpacing}
                disabled={!value}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-40"
                title="Clean paragraph spacing between points"
              >
                Clean Spacing
              </button>
            </div>

            {/* Stats Counter */}
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span>{points.length} point{points.length === 1 ? "" : "s"}</span>
              <span>•</span>
              <span>{wordCount} words</span>
              <span>•</span>
              <span>{value.length} chars</span>
            </div>
          </div>
        </div>
      )}

      {/* Footer Info Pro Tip */}
      <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
        <Info size={13} className="text-blue-500 shrink-0" />
        <span>
          Format points as <strong className="text-slate-700">Landmark – Highlight: Description</strong> to automatically render numbered point cards on the traveller tour page.
        </span>
      </div>
    </div>
  );
}"""

if old_block in code:
    code = code.replace(old_block, new_block)
    with open(itinerary_path, "w", encoding="utf-8") as f:
        f.write(code)
    print("Replaced with Points successfully!")
else:
    print("Could not find exact old_block, using start/end markers")
    start_marker = "function ItineraryLongDescriptionEditor({"
    end_marker = "export default function TourItineraryTab("
    start_pos = code.find(start_marker)
    end_pos = code.find(end_marker)
    if start_pos != -1 and end_pos != -1:
        code = code[:start_pos] + new_block + "\n\n" + code[end_pos:]
        with open(itinerary_path, "w", encoding="utf-8") as f:
            f.write(code)
        print("Replaced with Points using markers successfully!")
