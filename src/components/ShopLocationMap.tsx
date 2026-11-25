/// <reference types="google.maps" />
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  APILoadingStatus,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { ExternalLink, Navigation } from 'lucide-react';
import type { ShopLocation } from '../types/coffeeShop';

interface ShopLocationMapProps {
  shopName: string;
  hours: {
    weekdays: string;
    weekends: string;
  };
  location: ShopLocation;
  mapsApiKey: string;
}

type TravelModeOption = 'WALKING' | 'DRIVING' | 'BICYCLING' | 'TRANSIT';

const ORIGIN_PRESETS = [
  'Union Station, Portland, OR',
  "Powell's City of Books, Portland, OR",
  'Pioneer Courthouse Square, Portland, OR',
];

function RouteLayer({
  origin,
  destination,
  travelMode,
  onRouteResult,
}: {
  origin: string;
  destination: { lat: number; lng: number };
  travelMode: TravelModeOption;
  onRouteResult: (info: {
    distanceText: string;
    durationText: string;
    error: string | null;
    loading: boolean;
  }) => void;
}) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin.trim()) return;

    polylinesRef.current.forEach((p) => p.setMap(null));
    polylinesRef.current = [];

    onRouteResult({
      distanceText: '',
      durationText: '',
      error: null,
      loading: true,
    });

    const request = {
      origin: origin.trim(),
      destination,
      travelMode,
      fields: ['path', 'distanceMeters', 'durationMillis', 'viewport'],
    };

    let cancelled = false;

    (routesLib.Route as unknown as {
      computeRoutes: (req: typeof request) => Promise<{
        routes?: Array<{
          distanceMeters?: number;
          durationMillis?: number;
          viewport?: google.maps.LatLngBounds;
          createPolylines: () => google.maps.Polyline[];
        }>;
      }>;
    })
      .computeRoutes(request)
      .then(({ routes }) => {
        if (cancelled) return;
        if (!routes || routes.length === 0) {
          onRouteResult({
            distanceText: '',
            durationText: '',
            error: 'No route found for this origin and mode.',
            loading: false,
          });
          return;
        }

        const primaryRoute = routes[0];
        const newPolylines = primaryRoute.createPolylines();
        newPolylines.forEach((polyline) => {
          polyline.setOptions({
            strokeColor: '#9A3412',
            strokeWeight: 5,
            strokeOpacity: 0.9,
          });
          polyline.setMap(map);
        });
        polylinesRef.current = newPolylines;

        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }

        const meters = primaryRoute.distanceMeters ?? 0;
        const mins = Math.max(
          1,
          Math.round((primaryRoute.durationMillis ?? 0) / 60000)
        );
        const distanceText =
          meters >= 1000
            ? `${(meters / 1000).toFixed(2)} km`
            : `${Math.round(meters)} m`;

        onRouteResult({
          distanceText,
          durationText: `${mins} min`,
          error: null,
          loading: false,
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('OVER_QUERY_LIMIT') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        onRouteResult({
          distanceText: '',
          durationText: '',
          error: 'Unable to compute route right now. Try another address or travel mode.',
          loading: false,
        });
      });

    return () => {
      cancelled = true;
      polylinesRef.current.forEach((p) => p.setMap(null));
      polylinesRef.current = [];
    };
  }, [routesLib, map, origin, destination, travelMode, onRouteResult]);

  return null;
}

function CoffeeShopMapContent({
  shopName,
  hours,
  location,
  routeOrigin,
  travelMode,
  onRouteResult,
}: {
  shopName: string;
  hours: { weekdays: string; weekends: string };
  location: ShopLocation;
  routeOrigin: string;
  travelMode: TravelModeOption;
  onRouteResult: (info: {
    distanceText: string;
    durationText: string;
    error: string | null;
    loading: boolean;
  }) => void;
}) {
  const status = useApiLoadingStatus();
  const [marker, setMarker] =
    useState<google.maps.marker.AdvancedMarkerElement | null>(null);
  const [infoOpen, setInfoOpen] = useState(true);

  const markerRef = useCallback(
    (m: google.maps.marker.AdvancedMarkerElement | null) => {
      setMarker(m);
    },
    []
  );

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="h-[440px] w-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-700 p-6 text-center">
        <p className="text-sm font-medium text-zinc-900">
          Interactive map could not be initialized.
        </p>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          {location.address} ({location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)})
        </p>
      </div>
    );
  }

  return (
    <div className="h-[440px] w-full">
      <GoogleMap
        mapId="DEMO_MAP_ID"
        defaultCenter={location.coordinates}
        defaultZoom={15}
        gestureHandling="greedy"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
      >
        <AdvancedMarker
          ref={markerRef}
          position={location.coordinates}
          title={shopName}
          onClick={() => setInfoOpen(true)}
        >
          <Pin
            background="#9A3412"
            borderColor="#431407"
            glyphColor="#FFFFFF"
          />
        </AdvancedMarker>

        {infoOpen && marker && (
          <InfoWindow anchor={marker} onCloseClick={() => setInfoOpen(false)}>
            <div className="p-1 max-w-[220px]">
              <p className="font-semibold text-sm text-zinc-900">{shopName}</p>
              <p className="text-xs text-zinc-600 mt-0.5">{location.address}</p>
              <p className="text-[11px] text-zinc-500 mt-1">
                Mon–Fri {hours.weekdays} · Sat–Sun {hours.weekends}
              </p>
            </div>
          </InfoWindow>
        )}

        {routeOrigin && (
          <RouteLayer
            origin={routeOrigin}
            destination={location.coordinates}
            travelMode={travelMode}
            onRouteResult={onRouteResult}
          />
        )}
      </GoogleMap>
    </div>
  );
}

export function ShopLocationMap({
  shopName,
  hours,
  location,
  mapsApiKey,
}: ShopLocationMapProps) {
  const [originDraft, setOriginDraft] = useState(ORIGIN_PRESETS[0]);
  const [activeOrigin, setActiveOrigin] = useState('');
  const [travelMode, setTravelMode] = useState<TravelModeOption>('WALKING');
  const [routeInfo, setRouteInfo] = useState<{
    distanceText: string;
    durationText: string;
    error: string | null;
    loading: boolean;
  }>({
    distanceText: '',
    durationText: '',
    error: null,
    loading: false,
  });

  const handleRouteResult = useCallback(
    (info: {
      distanceText: string;
      durationText: string;
      error: string | null;
      loading: boolean;
    }) => {
      setRouteInfo(info);
    },
    []
  );

  const googleMapsDirectionsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${location.coordinates.lat},${location.coordinates.lng}`
  )}`;

  return (
    <section id="location" className="py-20 border-t border-zinc-200/80">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-2 max-w-xl">
            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
              Location &amp; Wayfinding
            </p>
            <h2 className="font-display text-3xl font-medium text-zinc-900 tracking-tight text-balance">
              Visit the roastery in {location.neighborhood}
            </h2>
          </div>

          <a
            href={googleMapsDirectionsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-900 bg-white border border-zinc-300 rounded-md hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0 self-start md:self-auto"
          >
            Open in Google Maps
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-lg p-6 flex flex-col justify-between gap-6">
            <div className="space-y-5">
              <div>
                <p className="text-xs text-zinc-500">Address</p>
                <p className="text-base font-semibold text-zinc-900 mt-1">
                  {location.address}
                </p>
                <p className="text-xs font-mono tabular-nums text-zinc-500 mt-1">
                  {location.coordinates.lat.toFixed(4)}° N,{' '}
                  {Math.abs(location.coordinates.lng).toFixed(4)}° W
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100 text-sm">
                <div>
                  <p className="text-xs text-zinc-500">Monday – Friday</p>
                  <p className="font-mono tabular-nums font-medium text-zinc-900 mt-0.5">
                    {hours.weekdays}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Saturday – Sunday</p>
                  <p className="font-mono tabular-nums font-medium text-zinc-900 mt-0.5">
                    {hours.weekends}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 space-y-2">
                <p className="text-xs text-zinc-500">Arrival &amp; Transit</p>
                <ul className="space-y-1.5 text-sm text-zinc-700">
                  {location.transitNotes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setActiveOrigin(originDraft);
              }}
              className="pt-5 border-t border-zinc-200 space-y-3"
            >
              <label
                htmlFor="route-origin"
                className="block text-xs font-medium text-zinc-700"
              >
                Route from your starting point
              </label>

              <div className="flex flex-wrap gap-1.5">
                {ORIGIN_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setOriginDraft(preset);
                      setActiveOrigin(preset);
                    }}
                    className="px-2.5 py-1 text-[11px] bg-[#F7F7F5] hover:bg-zinc-200/70 border border-zinc-200 rounded text-zinc-700 transition-colors cursor-pointer"
                  >
                    {preset.split(',')[0]}
                  </button>
                ))}
              </div>

              <input
                id="route-origin"
                type="text"
                value={originDraft}
                onChange={(e) => setOriginDraft(e.target.value)}
                placeholder="Enter starting address..."
                className="w-full px-3.5 py-2 text-sm bg-[#F7F7F5] border border-zinc-200 rounded-md focus:outline-none focus:border-amber-800"
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-md">
                  {(
                    [
                      ['WALKING', 'Walk'],
                      ['DRIVING', 'Drive'],
                      ['BICYCLING', 'Bike'],
                      ['TRANSIT', 'Transit'],
                    ] as const
                  ).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTravelMode(mode)}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                        travelMode === mode
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-600 hover:text-zinc-900'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-amber-800 hover:bg-amber-900 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Get Route
                </button>
              </div>

              {routeInfo.loading && (
                <p className="text-xs text-zinc-500">Computing route...</p>
              )}
              {routeInfo.error && (
                <p className="text-xs text-red-700">{routeInfo.error}</p>
              )}
              {routeInfo.distanceText && !routeInfo.error && (
                <div className="p-3 bg-[#F7F7F5] border border-zinc-200 rounded-md flex items-center justify-between text-xs">
                  <span className="text-zinc-600">Estimated Route</span>
                  <span className="font-mono tabular-nums font-semibold text-zinc-900">
                    {routeInfo.distanceText} · {routeInfo.durationText}
                  </span>
                </div>
              )}
            </form>
          </div>

          <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-lg overflow-hidden">
            {mapsApiKey ? (
              <APIProvider
                apiKey={mapsApiKey}
                libraries={['marker', 'routes']}
                language="en"
                region="US"
              >
                <CoffeeShopMapContent
                  shopName={shopName}
                  hours={hours}
                  location={location}
                  routeOrigin={activeOrigin}
                  travelMode={travelMode}
                  onRouteResult={handleRouteResult}
                />
              </APIProvider>
            ) : (
              <div className="h-[440px] w-full flex flex-col items-center justify-center bg-zinc-100 p-6 text-center space-y-2">
                <p className="text-sm font-medium text-zinc-900">
                  {shopName} — {location.address}
                </p>
                <p className="text-xs font-mono tabular-nums text-zinc-500">
                  {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                </p>
                <a
                  href={googleMapsDirectionsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-amber-800 rounded-md"
                >
                  Open in Google Maps
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
