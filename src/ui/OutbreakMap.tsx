import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef } from 'react';
import { hotspots } from '../cases/outbreaks';
import type { CaseRecord } from '../cases/types';
import { useI18n } from '../i18n';
import { getCrop } from '../knowledge';
import { useConditionName } from './format';

const COLORS = { high: '#b3261e', medium: '#d98a00', low: '#2f7a4f' } as const;
/** Can Tho, centre of the Mekong Delta, when there is nothing to show yet. */
const DEFAULT_CENTER: L.LatLngTuple = [10.03, 105.78];

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/** Community outbreak map: anonymous, ~1 km cells, coloured by severity. */
export default function OutbreakMap({ cases }: { cases: CaseRecord[] }) {
  const { t, l } = useI18n();
  const name = useConditionName();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const spots = useMemo(() => hotspots(cases), [cases]);

  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false }).setView(DEFAULT_CENTER, 9);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    map.current = m;
    // The card may still be laying out when the map is created; keep Leaflet
    // in sync with the real container size or markers render mis-scaled.
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(el.current);
    return () => {
      resize.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const group = layer.current;
    if (!m || !group) return;
    group.clearLayers();
    for (const s of spots) {
      const lines = s.entries
        .map((e) => `${escapeHtml(name(getCrop(e.cropId), e.conditionId, e.otherName))} (${l(getCrop(e.cropId).names)}): <b>${e.count}</b>`)
        .join('<br/>');
      L.circleMarker([s.lat, s.lng], {
        radius: 8 + Math.min(16, s.total * 2),
        color: COLORS[s.severity],
        fillColor: COLORS[s.severity],
        fillOpacity: 0.45,
        weight: 2,
        className: `hotspot hotspot-${s.severity}`,
      })
        .bindPopup(lines)
        .addTo(group);
    }
    m.invalidateSize();
    if (spots.length === 1) m.setView([spots[0].lat, spots[0].lng], 11);
    else if (spots.length > 1) {
      m.fitBounds(L.latLngBounds(spots.map((s) => [s.lat, s.lng] as L.LatLngTuple)).pad(0.4), { maxZoom: 12 });
    }
  }, [spots, name, l]);

  return (
    <section className="card">
      <h3>{t('outbreakMap')}</h3>
      <div ref={el} className="outbreak-map" role="region" aria-label={t('outbreakMap')} />
      <p className="small muted">
        {spots.length === 0 ? t('outbreakMapEmpty') : t('outbreakMapNote')}
      </p>
    </section>
  );
}
