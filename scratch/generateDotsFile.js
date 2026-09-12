// Script to generate a complete, high-quality dotted world map dataset
const fs = require('fs');

// We define continent polygons on an 800 x 420 canvas
// Grid: stepX = 10, stepY = 10
// Columns: 80, Rows: 42

function generateDots() {
  const dots = [];
  
  // Helper to add rectangular/curved regions of dots
  function addBlock(minCol, maxCol, minRow, maxRow, filterFn) {
    for (let c = minCol; c <= maxCol; c++) {
      for (let r = minRow; r <= maxRow; r++) {
        if (!filterFn || filterFn(c, r)) {
          dots.push([c * 9.5 + 25, r * 9.5 + 25]);
        }
      }
    }
  }

  // 1. North America (Alaska, Canada, USA, Mexico, Greenland)
  // Greenland
  addBlock(24, 28, 4, 7, (c, r) => !(c === 24 && r === 7) && !(c === 28 && r === 4));
  // Alaska
  addBlock(3, 8, 7, 10, (c, r) => !(c === 3 && r === 10));
  // Canada & Northern US
  addBlock(7, 23, 6, 12, (c, r) => {
    if (c > 20 && r < 9) return false;
    if (c < 9 && r < 8) return false;
    return true;
  });
  // Continental USA
  addBlock(8, 22, 12, 17, (c, r) => {
    if (c === 8 && r > 15) return false;
    if (c === 22 && r > 16) return false;
    return true;
  });
  // Florida
  addBlock(20, 21, 17, 19);
  // Mexico & Central America
  addBlock(10, 16, 18, 21, (c, r) => c >= 10 + (r - 18));
  addBlock(13, 17, 21, 23);
  addBlock(16, 18, 23, 24);

  // 2. South America
  addBlock(17, 24, 24, 28, (c, r) => c <= 17 + (r - 24) * 2);
  addBlock(18, 27, 27, 32, (c, r) => !(c > 25 && r > 30));
  addBlock(19, 25, 32, 36, (c, r) => c <= 25 - (r - 32));
  addBlock(20, 22, 36, 39);

  // 3. Europe
  // UK & Ireland
  addBlock(33, 35, 9, 12, (c, r) => !(c === 33 && r === 9));
  // Scandinavia
  addBlock(37, 41, 6, 10, (c, r) => !(c === 41 && r === 6));
  // Western & Central Europe
  addBlock(35, 43, 11, 15);
  // Iberian Peninsula
  addBlock(33, 36, 14, 16);
  // Italy
  addBlock(38, 39, 15, 17);
  // Greece & Balkans
  addBlock(40, 42, 15, 17);

  // 4. Africa
  // North Africa
  addBlock(34, 46, 17, 21);
  // West Africa bulge
  addBlock(33, 40, 21, 25);
  // Central & East Africa (Horn of Africa)
  addBlock(40, 48, 21, 26, (c, r) => !(c === 48 && r > 24));
  // Southern Africa
  addBlock(38, 44, 26, 31);
  // South Africa tip
  addBlock(39, 43, 31, 33);
  // Madagascar
  addBlock(46, 47, 28, 31);

  // 5. Asia
  // Russia / Siberia (North)
  addBlock(42, 69, 6, 11, (c, r) => !(c > 65 && r < 8));
  // Far East Russia
  addBlock(65, 73, 7, 11);
  // Central Asia / Middle East
  addBlock(44, 53, 12, 16);
  // Arabian Peninsula
  addBlock(45, 49, 17, 21, (c, r) => !(c === 45 && r === 21));
  // East Asia (China & Mongolia)
  addBlock(53, 67, 11, 17, (c, r) => !(c > 64 && r < 13));
  // Japan Archipelago
  addBlock(68, 70, 12, 16, (c, r) => c === 68 + (r - 12) % 2);
  // India Subcontinent
  addBlock(50, 56, 17, 21);
  addBlock(51, 55, 21, 23);
  addBlock(52, 54, 23, 24);
  // Sri Lanka
  addBlock(53, 53, 25, 25);
  // Southeast Asia (Indochina & Malaysia)
  addBlock(57, 63, 18, 23);
  // Philippines
  addBlock(65, 66, 20, 23);
  // Indonesia Archipelago
  addBlock(58, 68, 24, 26, (c, r) => (c + r) % 2 === 0);

  // 6. Australia & New Zealand
  // Australia Continent
  addBlock(64, 73, 27, 33, (c, r) => {
    if (c < 66 && r < 29) return false;
    if (c > 71 && r < 29) return false;
    return true;
  });
  // Tasmania
  addBlock(69, 70, 34, 34);
  // New Zealand (North & South Islands)
  addBlock(75, 76, 31, 32); // North Island (Auckland)
  addBlock(74, 75, 33, 34); // South Island

  return dots;
}

const dots = generateDots();
console.log(`Generated ${dots.length} authentic world map dots.`);

// Format as typescript file
const tsContent = `// Auto-generated precise world map dot coordinates
export const WORLD_MAP_DOTS: [number, number][] = ${JSON.stringify(dots, null, 2)};
`;

fs.writeFileSync('src/components/public/contact/worldMapDots.ts', tsContent);
console.log("Successfully wrote src/components/public/contact/worldMapDots.ts");
