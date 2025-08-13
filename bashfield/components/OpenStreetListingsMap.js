// bashfield/bashfield/components/OpenStreetListingsMap.js
import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

/**
 * markers: [{ id, lat, lng, title, href }]
 * center: { lat, lng } optional
 * zoom: number (default 11)
 */
export default function OpenStreetListingsMap({
  markers = [],
  center,
  zoom = 11,
  className = 'w-full h-96 rounded-xl overflow-hidden border border-gray-200'
}) {
  const mapRef = useRef(null)
  const elRef = useRef(null)
  const [ready, setReady] = useState(false)

  // Compute center fallback
  const computedCenter = center || (() => {
    if (markers.length) {
      const lat = markers.reduce((s, m) => s + Number(m.lat || 0), 0) / markers.length
      const lng = markers.reduce((s, m) => s + Number(m.lng || 0), 0) / markers.length
      return { lat, lng }
    }
    // Baghdad as a sensible default
    return { lat: 33.3152, lng: 44.3661 }
  })()

  useEffect(() => {
    if (!ready || typeof window === 'undefined' || !window.L) return

    if (!mapRef.current) {
      mapRef.current = window.L.map(elRef.current, {
        center: [computedCenter.lat, computedCenter.lng],
        zoom,
        scrollWheelZoom: true
      })
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current)
    } else {
      mapRef.current.setView([computedCenter.lat, computedCenter.lng], zoom)
    }

    // Clear old markers
    mapRef.current.eachLayer(layer => {
      if (layer instanceof window.L.Marker) mapRef.current.removeLayer(layer)
    })

    // Add markers
    const mks = []
    markers.forEach(m => {
      if (!m.lat || !m.lng) return
      const marker = window.L.marker([Number(m.lat), Number(m.lng)]).addTo(mapRef.current)
      const label = m.title ? `<div style="font-weight:600">${escapeHtml(m.title)}</div>` : ''
      const link = m.href ? `<a href="${m.href}" style="color:#2563eb;text-decoration:underline">Open</a>` : ''
      marker.bindPopup(`${label}${label && link ? '<br/>' : ''}${link}`, { closeButton: true })
      marker.on('click', () => { if (m.href) window.location.href = m.href })
      mks.push(marker)
    })

    // Fit bounds if multiple markers
    if (mks.length > 1) {
      const group = new window.L.featureGroup(mks)
      mapRef.current.fitBounds(group.getBounds().pad(0.2))
    }

    return () => {}
  }, [ready, JSON.stringify(markers), computedCenter.lat, computedCenter.lng, zoom])

  return (
    <>
      {/* Leaflet CSS/JS from CDN (no package install needed) */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        crossOrigin=""
        strategy="afterInteractive"
        onLoad={() => setReady(true)}
      />
      <div ref={elRef} className={className} />
    </>
  )
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
