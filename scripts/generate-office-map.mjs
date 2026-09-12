import { writeFileSync } from 'node:fs';
import { getMapJSON } from 'dotted-map';

// Precompute the land grid so browsers only load the lightweight projection API.
const map = getMapJSON({
  width: 170,
  grid: 'diagonal',
  projection: { name: 'equirectangular' },
  region: { lat: { min: -58, max: 84 }, lng: { min: -180, max: 180 } },
});
writeFileSync(new URL('../src/components/public/contact/officeMapData.json', import.meta.url), map + '\n');
console.log('Generated office map with dotted-map.');
