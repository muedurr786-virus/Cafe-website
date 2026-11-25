import { useState } from 'react';
import { Plus, Send } from 'lucide-react';
import type {
  AiShopViewResponse,
  CoffeeShopPayload,
  MenuItem,
  SpatialZone,
} from '../types/coffeeShop';
import { ResilientImage } from './ResilientImage';

interface AiFullShopViewProps {
  shopData: CoffeeShopPayload;
  onAddToCart: (item: MenuItem) => void;
}

const PRESET_VIEWS = [
  'Quiet morning focus with a bright floral filter coffee',
  'Full espresso flight and warm pastry pairing at the bar',
  'Afternoon sunny courtyard seating and light roast beans',
  'Roastery glass lab tour and precision brew specs',
];

export function AiFullShopView({
  shopData,
  onAddToCart,
}: AiFullShopViewProps) {
  const [activeZoneId, setActiveZoneId] = useState<string>(
    shopData.spatialZones[0]?.id ?? ''
  );
  const [promptInput, setPromptInput] = useState(PRESET_VIEWS[0]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiView, setAiView] = useState<AiShopViewResponse | null>(null);

  const activeZone: SpatialZone | undefined =
    shopData.spatialZones.find((z) => z.id === activeZoneId) ??
    shopData.spatialZones[0];

  const handleGenerateAiView = async (customPrompt?: string) => {
    const query = (customPrompt ?? promptInput).trim();
    if (!query) return;

    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch('/api/ai/shop-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          shopData,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to generate AI shop view.');
      }

      setAiView(payload as AiShopViewResponse);
      if (
        payload.recommendedZoneId &&
        shopData.spatialZones.some((z) => z.id === payload.recommendedZoneId)
      ) {
        setActiveZoneId(payload.recommendedZoneId);
      }
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : 'Unexpected error calling AI curator.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const recommendedZoneName =
    shopData.spatialZones.find((z) => z.id === aiView?.recommendedZoneId)?.name ??
    aiView?.recommendedZoneId;

  return (
    <section id="ai-shop-view" className="py-20 border-t border-zinc-200/80 bg-[#EFEFEA]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Full Space Walkthrough &amp; AI Curator
            </p>
            <h2 className="font-display text-3xl font-medium text-zinc-900 tracking-tight text-balance">
              AI view of the full coffee shop
            </h2>
            <p className="text-sm text-zinc-600 leading-relaxed">
              Explore all four architectural zones across the roastery or ask our AI spatial guide to build a tailored visit, seating recommendation, and tasting pairing.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Full Panoramic Interior with Clickable Zone Hotspots */}
          <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
            <div className="relative aspect-[16/9] w-full bg-zinc-900">
              <ResilientImage
                src={shopData.shop.panoramaImage}
                alt={`Panoramic full interior of ${shopData.shop.name}`}
                className="w-full h-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent pointer-events-none"
              />

              {shopData.spatialZones.map((zone, idx) => {
                const isActive = zone.id === activeZone?.id;
                return (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => setActiveZoneId(zone.id)}
                    style={{
                      left: `${zone.hotspot.x}%`,
                      top: `${zone.hotspot.y}%`,
                    }}
                    aria-label={`Inspect ${zone.name}`}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all shadow-md whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-amber-800 text-white scale-105 ring-2 ring-white'
                        : 'bg-white/95 text-zinc-900 hover:bg-white'
                    }`}
                  >
                    <span className="font-mono tabular-nums text-[11px]">
                      0{idx + 1}
                    </span>
                    <span className="hidden sm:inline">
                      {zone.name.replace(/^\d+\.\s*/, '')}
                    </span>
                  </button>
                );
              })}

              {activeZone && (
                <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-white pointer-events-none">
                  <div className="max-w-xl">
                    <p className="text-xs text-zinc-200">
                      {activeZone.seating} · {activeZone.acoustics} · {activeZone.lighting}
                    </p>
                    <h3 className="font-display text-xl sm:text-2xl font-medium mt-0.5">
                      {activeZone.name}
                    </h3>
                  </div>
                </div>
              )}
            </div>

            {/* Zone Selector Strip + Active Zone Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 border-t border-zinc-200">
              <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-zinc-200 divide-y divide-zinc-100">
                {shopData.spatialZones.map((zone) => {
                  const selected = zone.id === activeZone?.id;
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() => setActiveZoneId(zone.id)}
                      className={`w-full text-left px-5 py-4 transition-colors cursor-pointer ${
                        selected ? 'bg-zinc-900 text-white' : 'bg-white hover:bg-zinc-50 text-zinc-900'
                      }`}
                    >
                      <div className="text-sm font-medium">{zone.name}</div>
                      <div
                        className={`text-xs mt-1 ${
                          selected ? 'text-zinc-300' : 'text-zinc-500'
                        }`}
                      >
                        {zone.seating} · {zone.lighting}
                      </div>
                    </button>
                  );
                })}
              </div>

              {activeZone && (
                <div className="lg:col-span-8 p-6 flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-full sm:w-52 aspect-[4/3] rounded-md overflow-hidden shrink-0 bg-zinc-100">
                    <ResilientImage
                      src={activeZone.image}
                      alt={activeZone.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-3 flex-1">
                    <h4 className="font-display text-xl font-medium text-zinc-900">
                      {activeZone.name}
                    </h4>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {activeZone.description}
                    </p>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-2 border-t border-zinc-100 text-xs">
                      <div>
                        <dt className="text-zinc-400">Acoustics</dt>
                        <dd className="text-zinc-800 font-medium mt-0.5">
                          {activeZone.acoustics}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-zinc-400">Equipment &amp; Material</dt>
                        <dd className="text-zinc-800 font-medium mt-0.5">
                          {activeZone.signatureEquipment}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AI Full Shop Guide */}
          <div className="bg-white border border-zinc-200 rounded-lg p-6 sm:p-8 space-y-6">
            <div>
              <h3 className="font-display text-2xl font-medium text-zinc-900">
                AI Guided Space &amp; Tasting View
              </h3>
              <p className="text-sm text-zinc-600 mt-1">
                Describe what kind of visit you want and our AI guide will build a personalized walkthrough, seat recommendation, and menu pairing.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {PRESET_VIEWS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setPromptInput(preset);
                    handleGenerateAiView(preset);
                  }}
                  className="px-3 py-1.5 text-xs text-zinc-700 bg-[#F7F7F5] hover:bg-zinc-200/70 border border-zinc-200 rounded-md transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateAiView();
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="Ask for a full shop walkthrough, seating mood, or coffee pairing..."
                aria-label="Custom AI coffee shop tour prompt"
                className="flex-1 px-4 py-2.5 text-sm bg-[#F7F7F5] border border-zinc-200 rounded-md focus:outline-none focus:border-amber-800"
              />
              <button
                type="submit"
                disabled={aiLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-amber-800 hover:bg-amber-900 disabled:bg-zinc-400 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {aiLoading ? 'Generating View...' : 'Generate Shop View'}
              </button>
            </form>

            {aiError && (
              <div
                role="alert"
                className="p-4 rounded-md bg-red-50 border border-red-200 text-sm text-red-800"
              >
                {aiError}
              </div>
            )}

            {aiView && (
              <div className="pt-6 border-t border-zinc-200 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 space-y-4">
                    <div>
                      <p className="text-xs font-medium text-amber-800">
                        Recommended Zone · {recommendedZoneName}
                      </p>
                      <h4 className="font-display text-2xl font-medium text-zinc-900 mt-1 text-balance">
                        {aiView.headline}
                      </h4>
                    </div>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {aiView.atmosphereSummary}
                    </p>

                    <div className="space-y-3 pt-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Full Shop Spatial Sequence
                      </p>
                      <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-md">
                        {aiView.spatialWalkthrough.map((step) => (
                          <div
                            key={step.step}
                            className="p-3.5 flex items-start justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-zinc-900">
                                <span className="font-mono tabular-nums text-zinc-400 mr-2">
                                  0{step.step}.
                                </span>
                                {step.zoneName}
                              </div>
                              <p className="text-xs text-zinc-600 leading-relaxed">
                                {step.sensoryDetail}
                              </p>
                            </div>
                            <span className="text-xs font-mono tabular-nums text-zinc-500 whitespace-nowrap shrink-0">
                              {step.recommendedDurationMin} min
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-5">
                    <div className="space-y-3">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Curated Menu Pairing
                      </p>
                      <div className="space-y-3">
                        {aiView.curatedOrder.map((orderItem) => {
                          const matchedMenu = shopData.menuItems.find(
                            (m) => m.id === orderItem.itemId
                          );
                          return (
                            <div
                              key={`${orderItem.itemId}-${orderItem.itemName}`}
                              className="p-4 border border-zinc-200 rounded-md bg-[#F7F7F5] space-y-2"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-semibold text-zinc-900">
                                    {orderItem.itemName}
                                  </p>
                                  <p className="text-xs text-amber-900 mt-0.5">
                                    {orderItem.customization}
                                  </p>
                                </div>
                                {matchedMenu && (
                                  <button
                                    type="button"
                                    onClick={() => onAddToCart(matchedMenu)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-zinc-900 hover:bg-amber-800 rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Add
                                  </button>
                                )}
                              </div>
                              <p className="text-xs text-zinc-600 leading-relaxed">
                                {orderItem.pairingReason}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="p-4 border border-zinc-200 rounded-md space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Barista Brew Parameters
                      </p>
                      <dl className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <dt className="text-zinc-400">Brew Method</dt>
                          <dd className="font-mono text-zinc-900 mt-0.5">
                            {aiView.baristaJsonSpecs.brewMethod}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-zinc-400">Water Temp</dt>
                          <dd className="font-mono tabular-nums text-zinc-900 mt-0.5">
                            {aiView.baristaJsonSpecs.waterTempC}°C
                          </dd>
                        </div>
                        <div>
                          <dt className="text-zinc-400">Grind Profile</dt>
                          <dd className="font-mono text-zinc-900 mt-0.5">
                            {aiView.baristaJsonSpecs.grindProfile}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-zinc-400">Suggested Seat</dt>
                          <dd className="font-mono text-zinc-900 mt-0.5">
                            {aiView.baristaJsonSpecs.suggestedSeat}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
