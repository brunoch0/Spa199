"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AREA_COORDS, formatAED, serviceLabel } from "@/lib/constants";
import type { Therapist } from "@/lib/types";

const pinIcon = L.divIcon({
  className: "",
  html: `<div style="background:#C0974B;color:#0B0B0D;border-radius:9999px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2.5px solid #F0EADD;box-shadow:0 2px 6px rgba(0,0,0,.35)">💆</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

// deterministic jitter so therapists in the same area don't stack
function jitter(id: string, scale = 0.008): [number, number] {
  let h1 = 0;
  let h2 = 0;
  for (let i = 0; i < id.length; i++) {
    h1 = (h1 * 31 + id.charCodeAt(i)) % 1000;
    h2 = (h2 * 17 + id.charCodeAt(i)) % 1000;
  }
  return [((h1 / 1000) - 0.5) * scale, ((h2 / 1000) - 0.5) * scale];
}

export default function TherapistMap({ therapists }: { therapists: Therapist[] }) {
  const markers = useMemo(
    () =>
      therapists
        .map((t) => {
          const base = AREA_COORDS[t.base_area ?? ""] ?? [25.2048, 55.2708];
          const [dlat, dlng] = jitter(t.id);
          return { t, pos: [base[0] + dlat, base[1] + dlng] as [number, number] };
        }),
    [therapists]
  );

  return (
    <div className="overflow-hidden rounded-xl border" dir="ltr">
      <MapContainer
        center={[25.16, 55.23]}
        zoom={11}
        style={{ height: 520, width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map(({ t, pos }) => {
          const minPrice = t.services?.length
            ? Math.min(...t.services.map((s) => Number(s.price_aed)))
            : null;
          return (
            <Marker key={t.id} position={pos} icon={pinIcon}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <p style={{ fontWeight: 600, margin: 0 }}>{t.profile?.full_name}</p>
                  <p style={{ margin: "2px 0", fontSize: 13 }}>
                    ★ {Number(t.rating_avg).toFixed(1)} ({t.rating_count}) · {t.base_area}
                  </p>
                  <p style={{ margin: "2px 0", fontSize: 13 }}>
                    {t.specialties.slice(0, 3).map(serviceLabel).join(" · ")}
                  </p>
                  {minPrice !== null && (
                    <p style={{ margin: "2px 0", fontSize: 13, fontWeight: 600, color: "#A87E39" }}>
                      from {formatAED(minPrice)}
                    </p>
                  )}
                  <Link
                    href={`/therapists/${t.id}`}
                    style={{ fontSize: 13, fontWeight: 600, color: "#A87E39" }}
                  >
                    View profile →
                  </Link>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
