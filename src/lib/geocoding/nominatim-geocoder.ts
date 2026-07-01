export interface GeocodeResult {
  timestamp: string;
  placeName: string;
  placeLocation: string;
  latitude: number;
  longitude: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Geocodes an array of parsed Snapchat places using the OpenStreetMap Nominatim API.
 * Follows the 1 request per second policy and caches duplicate queries.
 */
export async function geocodeLocations(
  locations: { timestamp: string; placeName: string; placeLocation: string }[],
  onProgress: (currentIndex: number, total: number, currentPlace: string) => void
): Promise<GeocodeResult[]> {
  const results: GeocodeResult[] = [];
  const cache = new Map<string, { lat: number; lng: number }>();

  for (let i = 0; i < locations.length; i++) {
    const loc = locations[i];
    
    // Clean up query terms
    const queryParts = [loc.placeName, loc.placeLocation]
      .map(part => part.trim())
      .filter(part => part && part !== ',');
      
    const query = queryParts.join(', ');
    
    onProgress(i + 1, locations.length, query || loc.placeLocation);

    if (!query) {
      continue;
    }

    // Check cache
    if (cache.has(query)) {
      const coords = cache.get(query)!;
      results.push({
        ...loc,
        latitude: coords.lat,
        longitude: coords.lng,
      });
      continue;
    }

    try {
      // Nominatim requires max 1 request/sec. Sleep 1000ms if not cached.
      if (i > 0) {
        await delay(1005); // slightly over 1 second to be safe
      }

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': '3D-Travel-Diary-App/1.0 (contact: travel-diary@example.com)',
        },
      });

      if (!response.ok) {
        console.error(`Nominatim API returned error status: ${response.status}`);
        continue;
      }

      const data = await response.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        
        cache.set(query, { lat, lng });
        results.push({
          ...loc,
          latitude: lat,
          longitude: lng,
        });
      } else {
        // Fallback: Query just the placeLocation (e.g. "Udaipur, Rajasthan") instead of the full place name
        if (loc.placeName && loc.placeLocation && loc.placeLocation !== ', ') {
          await delay(1005);
          const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(loc.placeLocation)}&format=json&limit=1`;
          const fallbackResponse = await fetch(fallbackUrl, {
            headers: {
              'User-Agent': '3D-Travel-Diary-App/1.0 (contact: travel-diary@example.com)',
            },
          });
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData && fallbackData.length > 0) {
              const lat = parseFloat(fallbackData[0].lat);
              const lng = parseFloat(fallbackData[0].lon);
              
              cache.set(query, { lat, lng });
              results.push({
                ...loc,
                latitude: lat,
                longitude: lng,
              });
              continue;
            }
          }
        }
        console.warn(`Could not geocode location: ${query}`);
      }
    } catch (error) {
      console.error(`Error geocoding ${query}:`, error);
    }
  }

  return results;
}
