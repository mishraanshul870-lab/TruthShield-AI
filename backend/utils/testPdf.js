import '../config/loadEnv.js';
import { generatePDFReport } from './pdfGenerator.js';
import { PassThrough } from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const dbPath = path.join(__dirname, '..', 'database.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const allScans = db.scans || db;
  
  // Test image scan
  const scan = allScans.find(s => s.type === 'image');
  if (!scan) { console.log('No image scan found'); process.exit(1); }
  
  console.log(`Testing PDF for: ${scan._id} (${scan.type})`);
  
  const chunks = [];
  let headers = {};
  const mockRes = new PassThrough();
  mockRes.setHeader = (k, v) => { headers[k] = v; };
  mockRes.on('data', chunk => chunks.push(chunk));
  
  await new Promise((resolve, reject) => {
    mockRes.on('end', resolve);
    mockRes.on('error', reject);
    try { generatePDFReport(scan, mockRes); } catch(e) { reject(e); }
  });
  
  const buffer = Buffer.concat(chunks);
  
  // Save to file for inspection
  const outPath = path.join(__dirname, 'test_output.pdf');
  fs.writeFileSync(outPath, buffer);
  console.log(`Saved to: ${outPath} (${(buffer.length/1024).toFixed(1)} KB)`);
  
  // Count pages more carefully
  const str = buffer.toString('latin1');
  
  // Method 1: /Type /Page (not /Pages)
  const m1 = str.match(/\/Type\s*\/Page\b(?!s)/g);
  console.log(`Method 1 (/Type /Page not /Pages): ${m1 ? m1.length : 0}`);
  
  // Method 2: /Type/Page
  const m2 = str.match(/\/Type\s*\/Page\s/g);
  console.log(`Method 2 (/Type /Page<space>): ${m2 ? m2.length : 0}`);
  
  // Method 3: Count "Page X / 3" in footer
  const m3 = str.match(/PAGE \d+ \/ 3/g);
  console.log(`Method 3 (PAGE X / 3 footers): ${m3 ? m3.length : 0}`, m3);
  
  // Method 4: Look for page object references like "0 0 595.28 841.89"
  const m4 = str.match(/595\.28 841\.89/g);
  console.log(`Method 4 (A4 dimensions): ${m4 ? m4.length : 0}`);
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
