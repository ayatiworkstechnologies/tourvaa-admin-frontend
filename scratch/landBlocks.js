// Accurate world map dots generator
const fs = require('fs');

// We define continent polygons on an 800 x 420 canvas
// Grid: stepX = 10, stepY = 10
// Columns: 80, Rows: 42

const landBlocks = [
  // Alaska & North America
  { minX: 30, maxX: 90, minY: 70, maxY: 120 }, // Alaska
  { minX: 80, maxX: 230, minY: 50, maxY: 140 }, // Canada
  { minX: 90, maxX: 220, minY: 130, maxY: 190 }, // USA
  { minX: 110, maxX: 170, minY: 180, maxY: 230 }, // Mexico
  { minX: 140, maxX: 180, minY: 220, maxY: 250 }, // Central America
  { minX: 200, maxX: 220, minY: 180, maxY: 210 }, // Florida
  { minX: 220, maxX: 280, minY: 40, maxY: 90 }, // Greenland
  
  // South America
  { minX: 170, maxX: 250, minY: 250, maxY: 290 }, // Colombia/Venezuela
  { minX: 180, maxX: 280, minY: 280, maxY: 330 }, // Brazil/Peru/Bolivia
  { minX: 190, maxX: 260, minY: 320, maxY: 370 }, // Argentina/Chile North
  { minX: 200, maxX: 230, minY: 360, maxY: 400 }, // Chile/Argentina South
  
  // Europe
  { minX: 340, maxX: 370, minY: 90, maxY: 130 }, // UK & Ireland
  { minX: 380, maxX: 430, minY: 60, maxY: 110 }, // Scandinavia
  { minX: 360, maxX: 440, minY: 110, maxY: 160 }, // Western/Central Europe
  { minX: 340, maxX: 380, minY: 150, maxY: 180 }, // Spain/Portugal
  { minX: 390, maxX: 420, minY: 150, maxY: 180 }, // Italy/Balkans
  
  // Africa
  { minX: 340, maxX: 460, minY: 170, maxY: 220 }, // North Africa
  { minX: 330, maxX: 430, minY: 210, maxY: 260 }, // West Africa
  { minX: 380, maxX: 460, minY: 230, maxY: 280 }, // Central Africa / Horn
  { minX: 390, maxX: 450, minY: 280, maxY: 330 }, // Southern Africa
  { minX: 410, maxX: 440, minY: 330, maxY: 360 }, // South Africa
  { minX: 460, maxX: 480, minY: 290, maxY: 330 }, // Madagascar
  
  // Asia
  { minX: 430, maxX: 650, minY: 50, maxY: 120 }, // Russia / Siberia West & Central
  { minX: 630, maxX: 750, minY: 50, maxY: 120 }, // Russia / Siberia East
  { minX: 430, maxX: 540, minY: 120, maxY: 170 }, // Central Asia
  { minX: 410, maxX: 470, minY: 170, maxY: 220 }, // Middle East / Arabia
  { minX: 500, maxX: 570, minY: 170, maxY: 240 }, // India
  { minX: 525, maxX: 545, minY: 235, maxY: 260 }, // Sri Lanka
  { minX: 530, maxX: 660, minY: 120, maxY: 190 }, // China / Mongolia
  { minX: 650, maxX: 685, minY: 130, maxY: 180 }, // Japan / Korea
  { minX: 550, maxX: 620, minY: 190, maxY: 240 }, // Southeast Asia
  { minX: 560, maxX: 670, minY: 240, maxY: 280 }, // Indonesia / Philippines
  
  // Australia & New Zealand
  { minX: 620, maxX: 720, minY: 280, maxY: 350 }, // Australia
  { minX: 660, maxX: 690, minY: 350, maxY: 370 }, // Tasmania
  { minX: 725, maxX: 755, minY: 340, maxY: 380 }, // New Zealand
];

console.log("Land blocks ready");
