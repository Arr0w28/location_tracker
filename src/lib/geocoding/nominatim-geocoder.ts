export interface GeocodeResult {
  timestamp: string;
  placeName: string;
  placeLocation: string;
  latitude: number;
  longitude: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Geocodes an array of parsed Snapchat places.
 * To make this extremely fast and stable:
 * 1. Deduplicates queries so we never query the API twice for the same spot.
 * 2. Uses Komoot Photon API (high-speed OSM Elasticsearch mirror) as the primary geocoder.
 * 3. Falls back to OpenStreetMap Nominatim with rate limiting only if Photon misses.
 */
export async function geocodeLocations(
  locations: { timestamp: string; placeName: string; placeLocation: string }[],
  onProgress: (currentIndex: number, total: number, currentPlace: string) => void
): Promise<GeocodeResult[]> {
  const cache = new Map<string, { lat: number; lng: number }>();
  
  // 1. Resolve and normalize queries
  const normalizedLocations = locations.map(loc => {
    const queryParts = [loc.placeName, loc.placeLocation]
      .map(part => part.trim())
      .filter(part => part && part !== ',');
    const query = queryParts.join(', ').trim();
    return { ...loc, query };
  });

  // 2. Identify unique queries (ignore empty ones)
  const uniqueQueries = Array.from(
    new Set(normalizedLocations.map(loc => loc.query).filter(q => q.length > 0))
  );

  console.log(`Deduplicated: ${locations.length} records reduced to ${uniqueQueries.length} unique locations.`);

  // 3. Geocode unique queries
  for (let i = 0; i < uniqueQueries.length; i++) {
    const query = uniqueQueries[i];
    onProgress(i + 1, uniqueQueries.length, query);

    try {
      // 3.1. Primary: Komoot Photon (Fast, no strict rate limit, OSM-based)
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1`;
      
      // Small delay to be extremely polite (approx 15 requests per second)
      await delay(65);

      const response = await fetch(photonUrl, {
        headers: {
          'User-Agent': '3D-Travel-Diary-App/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].geometry.coordinates;
          cache.set(query, { lat, lng });
          continue;
        }
      }

      // 3.2. Fallback: OSM Nominatim (with strict 1 request per second sleep)
      console.log(`Photon miss for: "${query}". Falling back to OSM Nominatim...`);
      await delay(1005); // Sleep to honor Nominatim usage policy

      const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      const nomResponse = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': '3D-Travel-Diary-App/1.0 (contact: travel-diary@example.com)',
        },
      });

      if (nomResponse.ok) {
        const nomData = await nomResponse.json();
        if (nomData && nomData.length > 0) {
          const lat = parseFloat(nomData[0].lat);
          const lng = parseFloat(nomData[0].lon);
          cache.set(query, { lat, lng });
          continue;
        }
      }

      // 3.3. Last Ditch: Query just the placeLocation (e.g. city/country name only)
      const loc = normalizedLocations.find(l => l.query === query);
      if (loc && loc.placeLocation && loc.placeLocation.trim() !== '' && loc.placeLocation !== ', ') {
        console.log(`Full query miss. Trying location fallback: "${loc.placeLocation}"`);
        await delay(1005);

        const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc.placeLocation)}&format=json&limit=1`;
        const fbResponse = await fetch(fallbackUrl, {
          headers: {
            'User-Agent': '3D-Travel-Diary-App/1.0 (contact: travel-diary@example.com)',
          },
        });

        if (fbResponse.ok) {
          const fbData = await fbResponse.json();
          if (fbData && fbData.length > 0) {
            const lat = parseFloat(fbData[0].lat);
            const lng = parseFloat(fbData[0].lon);
            cache.set(query, { lat, lng });
          }
        }
      }

    } catch (err) {
      console.error(`Error geocoding unique query "${query}":`, err);
    }
  }

  // 4. Map coordinates back to the full list of parsed entries
  const results: GeocodeResult[] = [];
  for (const loc of normalizedLocations) {
    if (loc.query && cache.has(loc.query)) {
      const coords = cache.get(loc.query)!;
      results.push({
        timestamp: loc.timestamp,
        placeName: loc.placeName,
        placeLocation: loc.placeLocation,
        latitude: coords.lat,
        longitude: coords.lng,
      });
    }
  }

  return results;
}
