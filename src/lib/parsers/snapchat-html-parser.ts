export interface ParsedSnapchatLocation {
  timestamp: string;
  placeName: string;
  placeLocation: string;
}

/**
 * Parses Snapchat's snap_map_places_history.html format.
 * Extracts: Date, Place Name, and Place Location.
 */
export function parseSnapchatHtml(htmlContent: string): ParsedSnapchatLocation[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  const rows = doc.querySelectorAll('table tr');
  const results: ParsedSnapchatLocation[] = [];

  // Skip the header row (i = 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cells = row.querySelectorAll('td');
    
    // Ensure we have at least: Date, Place, Place location
    if (cells.length >= 3) {
      const timestamp = cells[0].textContent?.trim() || '';
      const placeName = cells[1].textContent?.trim() || '';
      const placeLocation = cells[2].textContent?.trim() || '';

      // Validate: need at least a timestamp, and either a place name or a location
      if (timestamp && (placeName || placeLocation)) {
        // Filter out records that are completely empty places (some entries are empty string or placeholders)
        if (placeName === "" && (placeLocation === "" || placeLocation === ", ")) {
          continue;
        }

        results.push({
          timestamp,
          placeName: placeName || 'Unknown Place',
          placeLocation: placeLocation || '',
        });
      }
    }
  }

  return results;
}
