'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect } from 'react';

// Fix for default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Green icon for highlighted location
const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type Location = {
  lat: number;
  lng: number;
  phone: string;
  created_at: string;
  jobId?: string;
};

function MapController({ highlightedLocation }: { highlightedLocation: Location | null }) {
  const map = useMap();

  useEffect(() => {
    if (highlightedLocation) {
      map.flyTo([highlightedLocation.lat, highlightedLocation.lng], 13);
    }
  }, [highlightedLocation, map]);

  return null;
}

export default function MapComponent({ locations, highlightedPhone, highlightedJobId }: { locations: Location[], highlightedPhone?: string, highlightedJobId?: string }) {
  // Default center (Indonesia)
  const center: [number, number] = [-2.5489, 118.0149];
  const zoom = 5;

  const highlightedLocation = highlightedJobId
    ? locations.find(loc => loc.jobId === highlightedJobId) || null
    : highlightedPhone 
      ? locations.find(loc => loc.phone === highlightedPhone) || null
      : null;

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className="h-full w-full rounded-lg z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapController highlightedLocation={highlightedLocation} />
      {locations.map((loc, idx) => {
        const isHighlighted = (highlightedJobId && loc.jobId === highlightedJobId) || (highlightedPhone && loc.phone === highlightedPhone);
        return (
          <Marker 
            key={idx} 
            position={[loc.lat, loc.lng]} 
            icon={isHighlighted ? greenIcon : defaultIcon}
            zIndexOffset={isHighlighted ? 1000 : 0}
          >
            <Popup>
              <div className="text-slate-800">
                <p className="font-bold">{loc.phone}</p>
                <p className="text-xs">{new Date(loc.created_at).toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
