import { readFileSync, existsSync } from 'fs';
import { DOMParser } from '@xmldom/xmldom';

export interface ParsedPlacemark {
  name: string;
  description?: string;
  location?: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[] | number[][] | number[][][];
  };
  address?: string;
  extendedData?: Record<string, string>;
  styleUrl?: string;
}

// Parse Google KML export
export function parseGoogleKML(filePath: string): ParsedPlacemark[] {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const content = readFileSync(filePath, 'utf8');
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'text/xml');

  // Check for parsing errors
  const parseError = xmlDoc.getElementsByTagName('parsererror')[0];
  if (parseError) {
    throw new Error(`Failed to parse KML file: ${parseError.textContent}`);
  }

  const placemarks = xmlDoc.getElementsByTagName('Placemark');
  const data: ParsedPlacemark[] = [];

  for (let i = 0; i < placemarks.length; i++) {
    const placemark = placemarks[i];
    const item: ParsedPlacemark = {
      name: '',
    };

    // Extract name
    const nameEl = placemark.getElementsByTagName('name')[0];
    if (nameEl) {
      item.name = nameEl.textContent?.trim() || `Location ${i + 1}`;
    } else {
      item.name = `Location ${i + 1}`;
    }

    // Extract address tag if available
    const addressEl = placemark.getElementsByTagName('address')[0];
    if (addressEl) {
      item.address = addressEl.textContent?.trim() || '';
    }

    // Extract description (often contains HTML in Google exports)
    const descEl = placemark.getElementsByTagName('description')[0];
    if (descEl) {
      const desc = descEl.textContent?.trim() || '';
      item.description = desc;
    }

    // Extract coordinates - handle Point, LineString, and Polygon
    const point = placemark.getElementsByTagName('Point')[0];
    const lineString = placemark.getElementsByTagName('LineString')[0];
    const polygon = placemark.getElementsByTagName('Polygon')[0];

    if (point) {
      const coordsEl = point.getElementsByTagName('coordinates')[0];
      if (coordsEl) {
        const coords = coordsEl.textContent?.trim().split(',') || [];
        if (coords.length >= 2) {
          item.location = {
            type: 'Point',
            coordinates: [parseFloat(coords[0]), parseFloat(coords[1])], // [longitude, latitude]
          };
        }
      }
    } else if (lineString) {
      const coordsEl = lineString.getElementsByTagName('coordinates')[0];
      if (coordsEl) {
        const coordPairs = coordsEl.textContent?.trim().split(/\s+/);
        item.location = {
          type: 'LineString',
          coordinates: coordPairs
            .map((pair) => {
              const [lon, lat] = pair.split(',');
              return [parseFloat(lon), parseFloat(lat)];
            })
            .filter(([lon, lat]) => !isNaN(lon) && !isNaN(lat)),
        };
      }
    } else if (polygon) {
      const outerBoundary = polygon.getElementsByTagName('outerBoundaryIs')[0];
      if (outerBoundary) {
        const linearRing = outerBoundary.getElementsByTagName('LinearRing')[0];
        const coordsEl = linearRing.getElementsByTagName('coordinates')[0];
        if (coordsEl) {
          const coordPairs = coordsEl.textContent?.trim().split(/\s+/);
          item.location = {
            type: 'Polygon',
            coordinates: [
              coordPairs
                .map((pair) => {
                  const [lon, lat] = pair.split(',');
                  return [parseFloat(lon), parseFloat(lat)];
                })
                .filter(([lon, lat]) => !isNaN(lon) && !isNaN(lat)),
            ],
          };
        }
      }
    }

    // Extract style information
    const styleUrl = placemark.getElementsByTagName('styleUrl')[0];
    if (styleUrl) {
      item.styleUrl = styleUrl.textContent?.trim();
    }

    // Extract extended data
    const extendedData = placemark.getElementsByTagName('ExtendedData')[0];
    if (extendedData) {
      const dataElements = extendedData.getElementsByTagName('Data');
      const extended: Record<string, string> = {};

      for (let j = 0; j < dataElements.length; j++) {
        const dataEl = dataElements[j];
        const name = dataEl.getAttribute('name');
        const valueEl = dataEl.getElementsByTagName('value')[0];
        if (name && valueEl) {
          extended[name] = valueEl.textContent?.trim() || '';
        }
      }

      if (Object.keys(extended).length > 0) {
        item.extendedData = extended;
      }
    }

    // Add items with Point coordinates OR with an address (can be geocoded later)
    if ((item.location && item.location.type === 'Point') || item.address) {
      data.push(item);
    }
  }

  return data;
}

// Clean HTML from description text
export function cleanHtmlDescription(html: string): string {
  if (!html) return '';
  
  // Remove CDATA wrapper if present
  let cleaned = html.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1');
  
  // Remove HTML tags but preserve line breaks
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/<\/p>/gi, '\n');
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  
  // Decode HTML entities
  cleaned = cleaned
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Clean up whitespace
  cleaned = cleaned.replace(/\n\s*\n/g, '\n').trim();
  
  return cleaned;
}

// Parse Bijzonderheid (special notes) to extract facility keywords
export function parseFacilitiesFromBijzonderheid(bijzonderheid: string): string[] {
  if (!bijzonderheid) return [];
  
  const facilities: string[] = [];
  const lower = bijzonderheid.toLowerCase();
  
  // Map Dutch keywords to facility values
  if (lower.includes('binnen') || lower.includes('indoor')) {
    facilities.push('indoor');
  }
  if (lower.includes('buiten') || lower.includes('outdoor')) {
    facilities.push('outdoor');
  }
  if (lower.includes('24/7') || lower.includes('24 uur') || lower.includes('altijd')) {
    facilities.push('24_7_access');
  }
  if (lower.includes('rolstoel') || lower.includes('toegankelijk') || lower.includes('wheelchair')) {
    facilities.push('wheelchair_accessible');
  }
  if (lower.includes('parkeer') || lower.includes('parking')) {
    facilities.push('parking');
  }
  if (lower.includes('overdekt') || lower.includes('shelter')) {
    facilities.push('sheltered');
  }
  if (lower.includes('verlicht') || lower.includes('licht') || lower.includes('lighting')) {
    facilities.push('lighting');
  }
  if (lower.includes('gratis') || lower.includes('free')) {
    facilities.push('free_access');
  }
  
  return facilities;
}

