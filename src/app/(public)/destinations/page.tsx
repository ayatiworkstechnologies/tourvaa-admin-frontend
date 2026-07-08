"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuMapPin as MapPin, LuArrowRight as ArrowRight, LuSearch as Search } from "react-icons/lu";
import { fetchPublicCountries, PublicCountry } from "@/lib/api/publicClient";

export default function DestinationsPage() {
  const [countries, setCountries] = useState<PublicCountry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchPublicCountries()
      .then((data) => setCountries(data))
      .finally(() => setLoading(false));
  }, []);

  const filteredCountries = countries.filter((c) => c.country_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <main className="min-h-screen bg-zinc-50 pb-20 pt-32">
      {/* Header Section */}
      <section className="container mx-auto px-6 sm:px-10 max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-2 text-xs font-bold uppercase tracking-widest text-indigo-600">
            <MapPin size={14} />
            Explore The World
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-950 sm:text-6xl sm:leading-[1.1]">
            Find your next <span className="text-indigo-600">dream destination</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-500">
            From the bustling streets of Tokyo to the serene beaches of Bali, explore our hand-picked selection of breathtaking destinations across the globe.
          </p>

          <div className="mx-auto mt-10 relative max-w-md">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
             <input 
               type="text" 
               placeholder="Search destinations..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full rounded-full border border-zinc-200 bg-white py-4 pl-12 pr-4 text-sm font-semibold text-zinc-950 shadow-sm outline-none transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10"
             />
          </div>
        </div>
      </section>

      {/* Destinations Grid */}
      <section className="container mx-auto px-6 sm:px-10 mt-20 max-w-7xl">
        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse aspect-[4/3] rounded-3xl bg-zinc-200" />
            ))}
          </div>
        ) : filteredCountries.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCountries.map((country, index) => (
              <Link
                key={country.id}
                href={`/tours?country_id=${country.id}`}
                className="group relative overflow-hidden rounded-3xl aspect-[4/3] bg-zinc-900 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-xl block"
                style={{ animationDelay: `${(index % 6) * 60}ms` }}
              >
                <img
                  src={`https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=75&query=${encodeURIComponent(country.country_name)}`}
                  alt={country.country_name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 w-full p-8 transition-transform duration-500 group-hover:-translate-y-2">
                  <div className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-400">
                    <MapPin size={16} />
                    {country.country_code}
                  </div>
                  <h3 className="text-3xl font-black text-white">
                    {country.country_name}
                  </h3>
                  
                  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                    Explore Tours <ArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center">
            <MapPin size={48} className="mx-auto text-zinc-300" />
            <h3 className="mt-6 text-xl font-black text-zinc-950">No destinations found</h3>
            <p className="mt-2 text-zinc-500">We couldn't find any destinations matching "{search}"</p>
            <button 
              onClick={() => setSearch("")}
              className="mt-6 rounded-xl bg-zinc-100 px-6 py-3 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-200"
            >
              Clear Search
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
