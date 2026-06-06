/**
 * useNavMap — Leaflet map composable for LiveNavigation step-by-step display.
 *
 * Improved step-by-step behavior:
 * - On mount: Show full route, then focus first step
 * - On step change: Update polyline styles smoothly, pan/zoom to active leg
 * - Clear visual distinction between active and inactive route segments
 * - Stable bounds padding that accounts for sidebar on desktop
 */

import { onUnmounted, type Ref } from 'vue';
import type { RouteDetailStep } from '@/services/api';

// Leaflet is loaded lazily so SSR / tests don't break.
type LeafletMap = import('leaflet').Map;

// Color tokens per mode — mirrors COLOR_MAP in api.ts
const MODE_COLOR: Record<string, string> = {
  walking: '#6b7280', // muted grey
  metro:   '#0ea5e9', // blue
  bus:     '#f97316', // orange
};

function modeColor(type: string) {
  return MODE_COLOR[type] ?? MODE_COLOR.bus;
}

// Cairo city centre — fallback when no step coordinates are available.
const CAIRO_CENTER: [number, number] = [30.0444, 31.2357];
const CAIRO_ZOOM = 12;

type LeafletPolyline = import('leaflet').Polyline;

export function useNavMap(
  containerRef: Ref<HTMLElement | null>,
  steps: RouteDetailStep[],
) {
  let map: LeafletMap | null = null;
  let leafletLib: typeof import('leaflet') | null = null;
  let stepPolylines: LeafletPolyline[] = [];
  let stepMarkers: any[] = [];
  let currentStepMarker: any = null;
  let hasGeometry = false;
  let currentActiveIndex = -1;

  function buildPolyline(L: typeof import('leaflet'), step: RouteDetailStep, stepIndex: number, activeIdx: number) {
    if (!step.geometry?.length || step.geometry.length < 2 || !map) return null;

    const isActive = stepIndex === activeIdx;
    const polyline = L.polyline(step.geometry.map((point) => [point.lat, point.lng]), {
      color: isActive ? '#FBBC04' : '#94A3B8',
      weight: isActive ? 8 : 5,
      opacity: isActive ? 1.0 : 0.5,
      lineCap: 'round',
      lineJoin: 'round',
      className: isActive ? 'active-route-segment' : 'inactive-route-segment',
    }).addTo(map);

    if (!isActive) {
      polyline.setStyle({ dashArray: '8, 10' });
    }

    return polyline;
  }

  function updatePolylineStyles(activeIdx: number) {
    if (!leafletLib || currentActiveIndex === activeIdx) return;
    
    currentActiveIndex = activeIdx;

    stepPolylines.forEach((polyline, idx) => {
      if (!polyline) return;
      const isActive = idx === activeIdx;
      polyline.setStyle({
        color: isActive ? '#FBBC04' : '#94A3B8',
        weight: isActive ? 8 : 5,
        opacity: isActive ? 1.0 : 0.5,
        dashArray: isActive ? '' : '8, 10',
      });

      const element = polyline.getElement();
      if (element) {
        if (isActive) {
          element.classList.add('active-route-segment');
          element.classList.remove('inactive-route-segment');
        } else {
          element.classList.remove('active-route-segment');
          element.classList.add('inactive-route-segment');
        }
      }
    });

    // Update current step marker
    if (currentStepMarker) {
      currentStepMarker.remove();
      currentStepMarker = null;
    }

    const activeStep = steps[activeIdx];
    const activePoint = activeStep?.geometry?.[0];
    if (activePoint && leafletLib && map) {
      const currentStepIcon = leafletLib.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="relative flex h-6 w-6 active-nav-marker">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-6 w-6 bg-sky-500 border-2 border-white shadow-lg"></span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
      currentStepMarker = leafletLib.marker([activePoint.lat, activePoint.lng], { icon: currentStepIcon }).addTo(map);
    }
  }

  async function initMap() {
    if (!containerRef.value) return;

    const L = (await import('leaflet')).default;

    // Leaflet ships CSS but Vite won't auto-inject it; we add it once.
    if (!document.querySelector('#leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Inject animation styles
    if (!document.querySelector('#nav-map-styles')) {
      const style = document.createElement('style');
      style.id = 'nav-map-styles';
      style.innerHTML = `
        @keyframes marker-bounce-in {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.3); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); opacity: 1; }
        }
        .active-nav-marker {
          animation: marker-bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .active-route-segment {
          filter: drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.4)) drop-shadow(0px 0px 2.5px rgba(0, 0, 0, 0.35));
          transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
        }
        .inactive-route-segment {
          transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
        }
      `;
      document.head.appendChild(style);
    }

    map = L.map(containerRef.value, {
      center: CAIRO_CENTER,
      zoom: CAIRO_ZOOM,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
      attribution: '© Google',
    }).addTo(map);

    leafletLib = L;
    hasGeometry = steps.some((step) => Array.isArray(step.geometry) && step.geometry.length > 1);
    
    if (hasGeometry) {
      renderInitialFeatures(L);
    }
  }

  function renderInitialFeatures(L: typeof import('leaflet')) {
    if (!map) return;

    // Draw all polylines initially (will be styled as inactive, step 0 will be activated after)
    steps.forEach((step, idx) => {
      const polyline = buildPolyline(L, step, idx, -1);
      if (polyline) {
        stepPolylines.push(polyline);
      }
    });

    // 1. Overall Start Point (Green dot)
    const startStep = steps.find((s) => s.geometry && s.geometry.length > 0);
    const startPoint = startStep?.geometry?.[0];
    if (startPoint) {
      const startIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div class="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-lg"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      stepMarkers.push(L.marker([startPoint.lat, startPoint.lng], { icon: startIcon }).addTo(map));
    }

    // 2. Overall Destination Point (Red Pin)
    const endStep = [...steps].reverse().find((s) => s.geometry && s.geometry.length > 0);
    const endPoint = endStep?.geometry?.[endStep.geometry.length - 1];
    if (endPoint) {
      const destIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div class="flex items-center justify-center">
            <svg class="w-8 h-8 text-rose-600 filter drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });
      stepMarkers.push(L.marker([endPoint.lat, endPoint.lng], { icon: destIcon }).addTo(map));
    }
  }

  function fitFullRoute() {
    if (!map || !leafletLib || !hasGeometry) return;
    
    const allPoints: [number, number][] = [];
    steps.forEach((step) => {
      step.geometry?.forEach((pt) => {
        allPoints.push([pt.lat, pt.lng]);
      });
    });
    
    if (allPoints.length >= 2) {
      const bounds = leafletLib.latLngBounds(allPoints);
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [60, 60],
          maxZoom: 15,
          animate: true,
          duration: 0.8,
        });
      }
    }
  }

  function fitStep(stepIndex: number) {
    if (!map || !leafletLib) return;

    // Update polyline styles first for smooth visual transition
    updatePolylineStyles(stepIndex);

    if (hasGeometry) {
      const polyline = stepPolylines[stepIndex];
      const bounds = polyline?.getBounds();
      
      if (bounds && bounds.isValid()) {
        // Desktop: account for sidebar width on left
        const isDesktop = window.innerWidth >= 1024;
        const paddingLeft = isDesktop ? 120 : 80;
        const paddingOther = isDesktop ? 100 : 60;
        
        map.flyToBounds(bounds, {
          paddingTopLeft: [paddingLeft, paddingOther],
          paddingBottomRight: [paddingOther, paddingOther],
          maxZoom: 16,
          duration: 0.7,
          easeLinearity: 0.25,
        });
        return;
      }

      // Fallback: if this step lacks geometry, show full route
      const allPoints: [number, number][] = [];
      steps.forEach((step) => {
        step.geometry?.forEach((pt) => {
          allPoints.push([pt.lat, pt.lng]);
        });
      });
      
      if (allPoints.length >= 2) {
        const fullBounds = leafletLib.latLngBounds(allPoints);
        if (fullBounds.isValid()) {
          map.flyToBounds(fullBounds, {
            padding: [70, 70],
            maxZoom: 14,
            duration: 0.7,
            easeLinearity: 0.25,
          });
          return;
        }
      }
    }

    // Ultimate fallback: Cairo center
    map.flyTo(CAIRO_CENTER, CAIRO_ZOOM, { duration: 0.6, easeLinearity: 0.25 });
  }

  function recenter(stepIndex: number) {
    fitStep(stepIndex);
  }

  function destroy() {
    stepPolylines.forEach((polyline) => polyline?.remove());
    stepPolylines = [];
    stepMarkers.forEach((marker) => marker?.remove());
    stepMarkers = [];
    if (currentStepMarker) {
      currentStepMarker.remove();
      currentStepMarker = null;
    }
    if (map) {
      map.remove();
      map = null;
    }
  }

  onUnmounted(destroy);

  return { initMap, fitStep, recenter, fitFullRoute, hasGeometry };
}
