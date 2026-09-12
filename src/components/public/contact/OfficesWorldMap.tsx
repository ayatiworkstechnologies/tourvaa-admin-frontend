"use client";

import React, { useEffect, useRef, useState } from "react";
import DottedMap from "dotted-map/without-countries";
import officeMapData from "./officeMapData.json";
import styles from "./OfficesWorldMap.module.css";

export interface OfficeLocation {
  id: string;
  country: string;
  city: string;
  addressLine1: string;
  addressLine2: string;
  lat: number;
  lng: number;
}

export const OFFICES: OfficeLocation[] = [
  {
    id: "nz",
    country: "New Zealand",
    city: "Auckland",
    addressLine1: "Level 3, 28 Harbour View Road",
    addressLine2: "Auckland 1010, New Zealand",
    lat: -36.8485,
    lng: 174.7633,
  },
  {
    id: "lk",
    country: "Sri Lanka",
    city: "Colombo",
    addressLine1: "Level 2, 45 Lotus Avenue",
    addressLine2: "Colombo 00300, Sri Lanka",
    lat: 6.9271,
    lng: 79.8612,
  },
  {
    id: "in",
    country: "India",
    city: "Chennai",
    addressLine1: "Suite 204, 18 Green Park Road",
    addressLine2: "Chennai, Tamil Nadu 600028, India",
    lat: 13.0827,
    lng: 80.2707,
  },
];

// Use the same projection for land and office pins, with padding in the SVG.
const map = new DottedMap({ map: { ...officeMapData, grid: "diagonal", projection: { name: "equirectangular" } } });
const mapScale = Math.min(732 / map.image.width, 362 / map.image.height);
const offsetX = (780 - map.image.width * mapScale) / 2;
const offsetY = (410 - map.image.height * mapScale) / 2;
const landPoints = map.getPoints().map(({ x, y }) => ({ x: offsetX + x * mapScale, y: offsetY + y * mapScale }));
const projectedOffices = OFFICES.map((office) => {
  const point = map.getPin({ lat: office.lat, lng: office.lng });
  if (!point) throw new Error(`Cannot project office: ${office.id}`);
  return { ...office, x: offsetX + point.x * mapScale, y: offsetY + point.y * mapScale };
});

export interface OfficesWorldMapProps {
  activeOfficeId: string;
  selectionVersion?: number;
  onSelectOffice: (id: string) => void;
}

// Add an OFFICES entry to extend the office list and flat map markers.
export default function OfficesWorldMap({ activeOfficeId, onSelectOffice, selectionVersion = 0 }: OfficesWorldMapProps) {
  const selected = projectedOffices.find((office) => office.id === activeOfficeId) ?? projectedOffices[0];
  const [overviewOfficeId, setOverviewOfficeId] = useState<string | null>(null);
  const selectionKey = `${selected.id}-${selectionVersion}`;
  const overview = overviewOfficeId === selectionKey;
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const cameraRef = useRef(camera);

  useEffect(() => {
    const scale = overview ? 1 : 2.1;
    // Keep the map within the viewport while bringing edge locations into view.
    const target = {
      scale,
      x: overview ? 0 : Math.max(780 * (1 - scale), Math.min(0, 390 - selected.x * scale)),
      y: overview ? 0 : Math.max(410 * (1 - scale), Math.min(0, 205 - selected.y * scale)),
    };
    const start = cameraRef.current;
    let frame: number;
    const started = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function animate(now: number) {
      const progress = reducedMotion ? 1 : Math.min((now - started) / 1100, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = {
        x: start.x + (target.x - start.x) * eased,
        y: start.y + (target.y - start.y) * eased,
        scale: start.scale + (target.scale - start.scale) * eased,
      };
      cameraRef.current = next;
      setCamera(next);
      if (progress < 1) frame = requestAnimationFrame(animate);
    }
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [selected.x, selected.y, overview]);


  return (
    <div className="relative isolate overflow-hidden rounded-[28px] border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pt-5 pb-3">
      <div className="flex-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" /> Our global presence
      </div>
      <button type="button" onClick={() => setOverviewOfficeId(overview ? null : selectionKey)} className="rounded-full border border-slate-200 bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-sky-600">
        {overview ? 'Zoom to office' : 'Show full map'}
      </button>
      </div>
      <svg viewBox="0 0 780 410" className="block w-full overflow-hidden" role="group" aria-label="Interactive flat dotted world map showing our offices">
        <g transform={`translate(${camera.x} ${camera.y}) scale(${camera.scale})`} fill="#16324f">
          {landPoints.map(({ x, y }, index) => <circle key={index} cx={x} cy={y} r="1.6" opacity=".85" />)}
        </g>
        {projectedOffices.map((office) => {
          const position = { x: office.x * camera.scale + camera.x, y: office.y * camera.scale + camera.y };
          if (position.x < 16 || position.x > 764 || position.y < 16 || position.y > 394) return null;
          const active = office.id === selected.id;
          const labelX = Math.max(52, Math.min(728, position.x));
          return (
            <g key={office.id} role="button" tabIndex={0} aria-label={`Show ${office.city}, ${office.country}`} aria-pressed={active} className="cursor-pointer outline-none focus:stroke-sky-600" onClick={() => { onSelectOffice(office.id); setOverviewOfficeId(null); }} onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectOffice(office.id); setOverviewOfficeId(null); }
            }}>
              <title>{office.city}, {office.country}</title>
              <circle className={styles.ripple} cx={position.x} cy={position.y} r="10" fill="none" stroke={active ? '#e97548' : '#0284c7'} strokeWidth="1.5" pointerEvents="none" />
              <circle cx={position.x} cy={position.y} r="16" fill={active ? '#e97548' : '#0284c7'} fillOpacity=".13" />
              <circle cx={position.x} cy={position.y} r="11" fill="none" stroke={active ? '#e97548' : '#0284c7'} strokeOpacity=".5" />
              <circle className={styles.beacon} cx={position.x} cy={position.y} r="5" fill={active ? '#e97548' : '#0284c7'} stroke="white" strokeWidth="2" />
              {active && <g pointerEvents="none">
                <path d={`M${position.x},${position.y - 17} v-18`} stroke="#e97548" />
                <rect x={labelX - 49} y={position.y - 63} width="98" height="28" rx="14" fill="#102c43" />
                <text x={labelX} y={position.y - 45} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">{office.city}</text>
              </g>}
            </g>
          );
        })}
      </svg>
      <div className="relative mx-4 mb-4 mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3" aria-live="polite">
        <div><p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">{overview ? 'Explore our offices' : 'Selected location'}</p><p className="mt-1 text-sm font-bold text-slate-800">{selected.city}<span className="font-normal text-slate-500"> / {selected.country}</span></p></div>
        <span className="rounded-full bg-sky-50 px-3 py-1.5 text-[10px] font-semibold text-sky-700">{OFFICES.length} offices worldwide</span>
      </div>
    </div>
  );
}
