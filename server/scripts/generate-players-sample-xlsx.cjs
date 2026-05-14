/**
 * Generates client/src/assets/samples/players-upload-sample.xlsx
 * Run from repo: node server/scripts/generate-players-sample-xlsx.cjs
 */
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const rows = [
  { name: 'Sample Player One', category: 'BATSMAN', base_price: 100, country: 'India' },
  { name: 'Sample Player Two', category: 'BOWLER', base_price: 150, country: 'India' },
  { name: 'Sample Player Three', category: 'ALLROUNDER', base_price: 120, country: '' },
  { name: 'Sample Player Four', category: 'WICKETKEEPER', base_price: 80, country: 'Australia' }
];

const outDir = path.join(__dirname, '../../client/src/assets/samples');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'players-upload-sample.xlsx');

const ws = XLSX.utils.json_to_sheet(rows);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Players');
XLSX.writeFile(wb, outPath);
console.log('Wrote', outPath);
