import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { MenuCategory, MenuItem } from '../types/coffeeShop';
import { ResilientImage } from './ResilientImage';

interface MenuSectionProps {
  items: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
}

const CATEGORIES: Array<'All' | MenuCategory> = [
  'All',
  'Espresso',
  'Pour Over',
  'Whole Bean',
  'Pastries',
];

export function MenuSection({ items, onAddToCart }: MenuSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<'All' | MenuCategory>('All');
  const [inspectItem, setInspectItem] = useState<MenuItem | null>(null);

  const filteredItems =
    selectedCategory === 'All'
      ? items
      : items.filter((item) => item.category === selectedCategory);

  return (
    <section id="menu" className="py-20 border-t border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Current Menu &amp; Roasts
            </p>
            <h2 className="font-display text-3xl font-medium text-zinc-900 tracking-tight text-balance">
              Precision extraction and daily bakes
            </h2>
          </div>

          <div
            role="tablist"
            aria-label="Filter menu by category"
            className="flex flex-wrap items-center gap-1 p-1 bg-zinc-200/60 rounded-lg self-start md:self-auto"
          >
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  role="tab"
                  aria-selected={active}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-white text-zinc-900 shadow-xs'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredItems.map((item) => (
            <article
              key={item.id}
              className="group bg-white border border-zinc-200 rounded-lg overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
            >
              <button
                type="button"
                onClick={() => setInspectItem(item)}
                className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 text-left cursor-pointer"
                aria-label={`View tasting and brew details for ${item.name}`}
              >
                <ResilientImage
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </button>

              <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <span className="uppercase tracking-wide font-medium text-zinc-600">
                      {item.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{item.roastLevel}</span>
                  </div>

                  <div className="flex items-baseline justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setInspectItem(item)}
                      className="text-left font-semibold text-base text-zinc-900 hover:text-amber-800 transition-colors cursor-pointer"
                    >
                      {item.name}
                    </button>
                    <span className="text-[15px] font-mono tabular-nums font-medium text-zinc-900 shrink-0">
                      ${item.priceUsd.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-sm text-zinc-600 leading-relaxed line-clamp-2">
                    {item.description}
                  </p>

                  <p className="text-xs text-zinc-500 pt-1">
                    {item.tastingNotes.join(' · ')}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-3 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setInspectItem(item)}
                    className="text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-4 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Tasting &amp; Brew
                  </button>
                  <button
                    type="button"
                    disabled={!item.available}
                    onClick={() => onAddToCart(item)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-zinc-900 hover:bg-amber-800 disabled:bg-zinc-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {item.available ? 'Add to Bag' : 'Sold Out'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {inspectItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/45 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={`${inspectItem.name} details`}
        >
          <div className="bg-white border border-zinc-200 rounded-lg max-w-2xl w-full overflow-hidden shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-[4/3] md:aspect-auto md:h-full bg-zinc-100">
                <ResilientImage
                  src={inspectItem.image}
                  alt={inspectItem.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 flex flex-col justify-between gap-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-zinc-500">
                        {inspectItem.category} · {inspectItem.origin}
                      </p>
                      <h3 className="font-display text-xl font-medium text-zinc-900 mt-1">
                        {inspectItem.name}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectItem(null)}
                      aria-label="Close item details"
                      className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {inspectItem.description}
                  </p>

                  <div className="text-xs text-zinc-600 space-y-2 pt-2 border-t border-zinc-100">
                    <div>
                      <span className="text-zinc-400">Tasting Notes: </span>
                      {inspectItem.tastingNotes.join(' · ')}
                    </div>
                    <div>
                      <span className="text-zinc-400">Roast Profile: </span>
                      {inspectItem.roastLevel}
                    </div>
                    <div className="font-mono tabular-nums">
                      <span className="text-zinc-400 font-sans">Brew Spec: </span>
                      {inspectItem.brewParams.doseGrams}g · {inspectItem.brewParams.waterTempC}°C · {inspectItem.brewParams.extractionSec}s
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                  <span className="text-lg font-mono tabular-nums font-semibold text-zinc-900">
                    ${inspectItem.priceUsd.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onAddToCart(inspectItem);
                      setInspectItem(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-800 hover:bg-amber-900 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Add to Bag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
