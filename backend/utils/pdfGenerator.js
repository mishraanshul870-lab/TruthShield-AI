import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * TruthShield Enterprise PDF Report Generator
 * Generates exactly 3 pages per report with compact, dense content layout.
 * Uses PDFKit with autoFirstPage:false and all text constrained to prevent auto-pagination.
 */
export const generatePDFReport = (scan, res, lang = 'en') => {
  const localesPath = path.join(__dirname, '../../frontend/src/i18n/locales');
  let translations = {};
  try {
    const filePath = path.join(localesPath, lang === 'hi' ? 'hi' : 'en', 'reportResults.json');
    if (fs.existsSync(filePath)) {
      translations = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error('Failed to load translations in pdfGenerator:', err);
  }

  const t = (key) => {
    if (!key) return '';
    const str = String(key);
    
    // Split by newlines/paragraphs to translate sections individually
    const paragraphs = str.split('\n\n');
    const translated = paragraphs.map(p => {
      const lines = p.split('\n');
      const transLines = lines.map(line => {
        const clean = line.trim().replace(/\s+/g, ' ');
        if (!clean) return '';
        return translations[clean] || line;
      });
      return transLines.filter(Boolean).join('\n');
    });
    return translated.filter(Boolean).join('\n\n');
  };

  const doc = new PDFDocument({
    size: 'A4',
    autoFirstPage: false,
    bufferPages: true,
    margins: { top: 40, bottom: 40, left: 25, right: 25 }
  });

  const fontRegularPath = path.join(__dirname, '../assets/fonts/NotoSansDevanagari-Regular.ttf');
  const fontBoldPath = path.join(__dirname, '../assets/fonts/NotoSansDevanagari-Bold.ttf');
  const hasRegular = fs.existsSync(fontRegularPath);
  const hasBold = fs.existsSync(fontBoldPath);

  if (hasRegular) {
    doc.registerFont('NotoSansDevanagari', fontRegularPath);
  }
  if (hasBold) {
    doc.registerFont('NotoSansDevanagari-Bold', fontBoldPath);
  }

  const FONT_REGULAR = (lang === 'hi' && hasRegular) ? 'NotoSansDevanagari' : 'Helvetica';
  const FONT_BOLD = (lang === 'hi' && hasBold) ? 'NotoSansDevanagari-Bold' : 'Helvetica-Bold';
  const FONT_OBLIQUE = (lang === 'hi' && hasRegular) ? 'NotoSansDevanagari' : 'Helvetica-Oblique';

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="TruthShield_Report_${scan._id || 'scan'}.pdf"`);
  doc.pipe(res);

  // --- Palette ---
  const C = {
    bg: '#0B0F1A', card: '#121829', border: '#1E293B',
    white: '#F8FAFC', muted: '#94A3B8', purple: '#7C3AED', cyan: '#00C2FF',
    green: '#10B981', amber: '#F59E0B', red: '#EF4444', darkRed: '#DC2626',
  };
  const riskCol = { Low: C.green, Medium: C.amber, High: C.red, Critical: C.darkRed };
  const statusColor = riskCol[scan.riskLevel] || C.cyan;

  let scanTitle = t('FORENSICS DOSSIER');
  if (scan.type === 'text') scanTitle = t('TEXT VERACITY DOSSIER');
  else if (scan.type === 'image') scanTitle = t('IMAGE FORENSICS DOSSIER');
  else if (scan.type === 'video') scanTitle = t('VIDEO FORENSICS DOSSIER');

  // Layout constants
  const TOP = 44, BOT = 800, LEFT = 25, WIDTH = 545;
  let Y = TOP;

  // All text helper — wraps doc.text with lineBreak:false by default for single-line text
  const txt = (str, x, y, opts = {}) => {
    doc.text(String(str || ''), x, y, { lineBreak: false, ...opts });
  };

  // Multi-line text with height constraint
  const mtxt = (str, x, y, w, maxH, opts = {}) => {
    doc.text(String(str || ''), x, y, { width: w, height: maxH, lineBreak: true, ellipsis: true, ...opts });
  };

  // --- Page management ---
  const newPage = (pageNo) => {
    doc.addPage({ size: 'A4', margins: { top: 40, bottom: 40, left: 25, right: 25 } });
    // Header
    doc.rect(0, 0, 595.28, 5).fill(C.purple);
    doc.rect(0, 5, 595.28, 30).fill(C.bg);
    doc.fillColor(C.white).font(FONT_BOLD).fontSize(8);
    txt(t('TRUTHSHIELD AI'), 25, 14);
    doc.fillColor(C.muted).font(FONT_REGULAR).fontSize(7.5);
    txt(scanTitle, 130, 14);
    // Footer
    doc.rect(0, 810, 595.28, 31).fill(C.bg);
    doc.fillColor(C.muted).font(FONT_REGULAR).fontSize(7);
    txt(t('CONFIDENTIAL // FORENSIC AUDIT LOG'), 25, 818);
    doc.fillColor(C.white).font(FONT_BOLD).fontSize(7);
    txt(`${t('PAGE')} ${pageNo} / 3`, 530, 818);
    Y = TOP;
  };

  // --- Drawing Primitives ---
  const progressBar = (x, y, w, h, score, label, color) => {
    doc.fillColor(C.muted).font(FONT_BOLD).fontSize(6.5);
    txt(t(label).toUpperCase(), x, y);
    doc.fillColor(C.border).rect(x, y + 9, w, h).fill();
    const fw = Math.max(0, Math.min(w, ((score || 0) / 100) * w));
    if (fw > 0) doc.fillColor(color).rect(x, y + 9, fw, h).fill();
    doc.fillColor(C.white).font(FONT_BOLD).fontSize(6.5);
    txt(`${Math.round(score || 0)}%`, x + w - 22, y);
  };

  const miniCard = (x, y, w, h, label, val) => {
    doc.fillColor(C.card).rect(x, y, w, h).fill();
    doc.rect(x, y, w, h).lineWidth(0.4).stroke(C.border);
    doc.fillColor(C.muted).font(FONT_BOLD).fontSize(5.5);
    txt(t(label).toUpperCase(), x + 4, y + 3);
    doc.fillColor(C.white).font(FONT_REGULAR).fontSize(6.5);
    mtxt(t(String(val || 'N/A')), x + 4, y + 11, w - 8, h - 14);
  };

  const sectionTitle = (title) => {
    doc.fillColor(C.white).font(FONT_BOLD).fontSize(8.5);
    txt(t(title).toUpperCase(), LEFT, Y);
    Y += 11;
    doc.rect(LEFT, Y, WIDTH, 0.8).fill(C.purple);
    Y += 5;
  };

  const cardBlock = (title, content, color = C.cyan) => {
    // Measure content height (capped to prevent overflow)
    const maxContent = Math.min(BOT - Y - 30, 150);
    if (maxContent < 20) return; // no space
    const titleH = title ? 11 : 0;
    const contentH = Math.min(maxContent - titleH - 10, doc.heightOfString(t(content || ''), { width: WIDTH - 20, fontSize: 7, lineGap: 1.2 }));
    const h = titleH + contentH + 10;
    doc.fillColor(C.card).rect(LEFT, Y, WIDTH, h).fill();
    doc.rect(LEFT, Y, WIDTH, h).lineWidth(0.5).stroke(C.border);
    let cy = Y + 5;
    if (title) {
      doc.fillColor(color).font(FONT_BOLD).fontSize(7);
      txt(t(title).toUpperCase(), LEFT + 8, cy);
      cy += 11;
    }
    doc.fillColor(C.white).font(FONT_REGULAR).fontSize(7);
    mtxt(t(content || ''), LEFT + 8, cy, WIDTH - 20, contentH, { lineGap: 1.2 });
    Y += h + 4;
  };

  const metaGrid = (fields, cols = 3) => {
    const gap = 6;
    const cw = Math.floor((WIDTH - gap * (cols - 1)) / cols);
    const rh = 22;
    for (let i = 0; i < fields.length; i += cols) {
      if (Y + rh > BOT) break;
      for (let c = 0; c < cols; c++) {
        const f = fields[i + c];
        if (!f) break;
        miniCard(LEFT + c * (cw + gap), Y, cw, rh, f.k, f.v);
      }
      Y += rh + 3;
    }
  };

  const drawTable = (headers, rows, widths, aligns) => {
    const hh = 13;
    if (Y + hh > BOT) return;
    doc.rect(LEFT, Y, WIDTH, hh).fill(C.border);
    let x = LEFT;
    headers.forEach((h, i) => {
      doc.fillColor(C.white).font(FONT_BOLD).fontSize(6);
      mtxt(t(h), x + 3, Y + 3, widths[i] - 6, 10, { align: aligns?.[i] || 'left' });
      x += widths[i];
    });
    Y += hh;

    // Compute row height to fit remaining space
    const maxRows = rows.length;
    const availH = BOT - Y;
    const rh = Math.max(10, Math.min(16, Math.floor(availH / Math.max(1, maxRows))));

    rows.forEach((row, ri) => {
      if (Y + rh > BOT) return; // hard stop
      doc.rect(LEFT, Y, WIDTH, rh).fill(ri % 2 === 0 ? C.card : C.bg);
      let rx = LEFT;
      row.forEach((cell, ci) => {
        const s = t(String(cell || ''));
        let col = C.white, bold = false;
        const su = s.toUpperCase();
        if (['FLAGGED','FAKE','HIGH','CRITICAL','DEBUNKED','ध्वजांकित','नकली','उच्च','गंभीर','खंडित'].includes(su)) { col = C.red; bold = true; }
        else if (['PASSED','VERIFIED','LOW','AUTHENTIC (PASSED)','उत्तीर्ण','सत्यापित','कम','प्रामाणिक'].includes(su)) { col = C.green; bold = true; }
        else if (['MEDIUM','WARNING','MIXED','SUSPICIOUS','मध्यम','चेतावनी','मिश्रित','संदेहास्पद'].includes(su)) { col = C.amber; bold = true; }
        else if (ci === 0) bold = true;
        doc.fillColor(col).font(bold ? FONT_BOLD : FONT_REGULAR).fontSize(5.5);
        mtxt(s, rx + 3, Y + 2, widths[ci] - 6, rh - 3, { align: aligns?.[ci] || 'left' });
        rx += widths[ci];
      });
      Y += rh;
    });
    Y += 4;
  };

  const disclaimer = (text) => {
    if (Y + 30 > BOT) return;
    const h = 30;
    doc.fillColor('#7C2D12').rect(LEFT, Y, WIDTH, h).fill();
    doc.rect(LEFT, Y, WIDTH, h).lineWidth(0.5).stroke('#EA580C');
    doc.fillColor('#FFEDD5').font(FONT_BOLD).fontSize(6.5);
    txt(t('SECURITY DISCLOSURE'), LEFT + 8, Y + 4);
    doc.fillColor('#FFEDD5').font(FONT_REGULAR).fontSize(5.5);
    mtxt(t(text), LEFT + 8, Y + 13, WIDTH - 16, 14);
  };

  const b64buf = (uri) => {
    if (!uri) return null;
    try { return Buffer.from(uri.replace(/^data:image\/\w+;base64,/, ''), 'base64'); }
    catch { return null; }
  };

  // ============================================================
  // IMAGE REPORT — 3 pages
  // ============================================================
  if (scan.type === 'image' && scan.factCheckReport) {
    const R = scan.factCheckReport;

    // ---- PAGE 1: Verdict + Summary + Timeline + Risk ----
    newPage(1);

    const bh = 100;
    doc.fillColor(C.card).rect(LEFT, Y, WIDTH, bh).fill();
    doc.rect(LEFT, Y, WIDTH, bh).lineWidth(0.8).stroke(C.border);
    const img = b64buf(R.originalImageBase64 || R.thumbnail);
    if (img) { try { doc.image(img, LEFT + 8, Y + 8, { width: 110, height: 82 }); } catch {} }
    else doc.fillColor(C.bg).rect(LEFT + 8, Y + 8, 110, 82).fill();
    const vx = 150;
    doc.fillColor(statusColor).font(FONT_BOLD).fontSize(12);
    txt(`${t('VERDICT')}: ${t(R.verdict || scan.prediction || 'Unknown').toUpperCase()}`, vx, Y + 10);
    progressBar(vx, Y + 32, 340, 5, R.trustScore ?? 50, t('Authenticity Score'), statusColor);
    progressBar(vx, Y + 56, 340, 5, R.confidenceScore || 50, t('AI Confidence'), C.purple);
    doc.fillColor(C.muted).font(FONT_REGULAR).fontSize(6.5);
    txt(`${t('ID')}: ${scan._id}  |  ${t('Model')}: ${scan.provider || 'Gemini'} ${R.model || ''}  |  ${t('Risk')}: ${t(scan.riskLevel) || 'N/A'}`, vx, Y + 80);
    Y += bh + 6;

    cardBlock('Executive Forensic Statement', R.executiveSummary || R.explanation || scan.explanation || '');

    const tl = R.timeline || scan.timeline || [];
    if (tl.length > 0) {
      sectionTitle('Investigation Timeline');
      drawTable(
        ['Step', 'Status', 'Conf.', 'Description'],
        tl.map((e, i) => [`${i + 1}. ${e.title}`, (e.status || '').toUpperCase(), `${e.confidence || 0}%`, e.description || '']),
        [130, 80, 45, 290], ['left', 'center', 'center', 'left']
      );
    }

    sectionTitle('Risk Assessment');
    metaGrid([
      { k: 'Trust Score', v: `${R.trustScore ?? 50}/100` },
      { k: 'Manipulation', v: `${R.manipulationScore ?? 0}/100` },
      { k: 'AI Prob.', v: `${R.aiProbability ?? 0}%` },
      { k: 'Risk Level', v: scan.riskLevel || 'N/A' },
      { k: 'Credibility', v: `${scan.credibilityScore || 50}/100` },
      { k: 'Provider', v: scan.provider || 'Gemini' },
    ]);

    // ---- PAGE 2: Metadata + Evidence Matrix ----
    newPage(2);

    sectionTitle('EXIF Metadata');
    const md = R.metadata || {};
    metaGrid([
      { k: 'Camera Make', v: md.cameraMake }, { k: 'Camera Model', v: md.cameraModel },
      { k: 'Lens', v: md.lensModel }, { k: 'Bit Depth', v: md.bitDepth },
      { k: 'Color Space', v: md.colorSpace }, { k: 'Orientation', v: md.orientation },
      { k: 'File Size', v: md.fileSize ? `${(md.fileSize/1024).toFixed(1)} KB` : 'N/A' },
      { k: 'Compression', v: md.compressionFormat }, { k: 'Software', v: md.editingSoftware },
      { k: 'OS', v: md.operatingSystem }, { k: 'GPS', v: md.gpsCoordinates },
      { k: 'Created', v: md.dateCreated ? new Date(md.dateCreated).toLocaleDateString() : 'N/A' },
    ], 4);

    const anomalies = R.metadataAnomalies || [];
    if (anomalies.length > 0) {
      cardBlock('Metadata Anomalies', anomalies.map(a => `• ${a.title}: ${a.explanation} [${a.severity}]`).join('\n'), C.amber);
    }

    sectionTitle('Forensic Evidence Matrix');
    const indicators = [
      'Face inconsistencies', 'Eye reflections', 'Lighting inconsistencies',
      'Skin texture anomalies', 'Compression artifacts', 'GAN generation traces',
      'Boundary artifacts', 'Background editing', 'Shadow inconsistencies',
      'Noise inconsistency', 'Upscaling artifacts', 'Perspective mismatch', 'Color inconsistency'
    ];
    drawTable(
      ['Metric', 'Status', 'Conf.', 'Severity', 'Finding'],
      indicators.map(ind => {
        const f = R.findings?.find(x => x.title?.toLowerCase() === ind.toLowerCase()) || {};
        const flagged = f.severity && f.severity !== 'None';
        return [ind, flagged ? 'FLAGGED' : 'PASSED', `${f.confidence || 0}%`, f.severity || 'None', f.explanation || 'No anomalies.'];
      }),
      [105, 55, 40, 50, 295], ['left', 'center', 'center', 'center', 'left']
    );

    // ---- PAGE 3: Localization + XAI + Recommendations ----
    newPage(3);

    const regions = R.manipulatedRegions || [];
    if (regions.length > 0) {
      sectionTitle('Manipulation Localization');
      const elaImg = b64buf(R.elaImage);
      const heatImg = b64buf(R.heatmapImage);
      if (elaImg || heatImg) {
        try {
          if (elaImg) doc.image(elaImg, LEFT, Y, { width: 260, height: 120 });
          if (heatImg) doc.image(heatImg, LEFT + 275, Y, { width: 260, height: 120 });
        } catch {}
        Y += 125;
      }
      drawTable(
        ['Region', 'Type', 'Conf/Prob', 'Severity', 'Evidence'],
        regions.map((r, i) => [r.regionId || `R${i+1}`, r.label || 'N/A', `${r.confidence||0}/${r.probability||0}%`, r.severity || 'N/A', `${r.reason || ''} ${r.evidence || ''}`]),
        [45, 80, 65, 55, 300], ['center', 'left', 'center', 'center', 'left']
      );
    }

    sectionTitle('Explainable AI Analysis');
    cardBlock('Reasoning', R.reasoning || 'No anomaly indicators registered.', C.purple);

    const recs = R.recommendations || [];
    if (recs.length > 0) cardBlock('Recommendations', recs.map(r => `• ${r}`).join('\n'), C.cyan);

    disclaimer('This forensic dossier is generated using CNN, ELA, and spatial transformer analysis. Outputs are advisory and do not constitute legal assertions.');
  }

  // ============================================================
  // TEXT REPORT — 3 pages
  // ============================================================
  else if (scan.type === 'text' && scan.factCheckReport) {
    const R = scan.factCheckReport;

    newPage(1);
    const bh = 95;
    doc.fillColor(C.card).rect(LEFT, Y, WIDTH, bh).fill();
    doc.rect(LEFT, Y, WIDTH, bh).lineWidth(0.8).stroke(C.border);
    doc.fillColor(statusColor).font(FONT_BOLD).fontSize(12);
    txt(`${t('VERDICT')}: ${t(R.prediction || scan.prediction || 'Mixed').toUpperCase()}`, LEFT + 15, Y + 10);
    progressBar(LEFT + 15, Y + 32, 230, 5, R.trustScore ?? 50, t('Trust Score'), statusColor);
    progressBar(LEFT + 15, Y + 56, 230, 5, R.confidenceScore || 50, t('Confidence'), C.purple);
    doc.fillColor(C.muted).font(FONT_REGULAR).fontSize(6.5);
    txt(`${t('ID')}: ${scan._id}`, 300, Y + 14);
    txt(`${t('Provider')}: ${scan.provider || 'Gemini'} (${R.model || 'Flash'})`, 300, Y + 28);
    txt(`${t('Latency')}: ${scan.processingTime ? (scan.processingTime/1000).toFixed(2)+'s' : 'N/A'}`, 300, Y + 42);
    txt(`${t('Date')}: ${R.timestamp ? new Date(R.timestamp).toLocaleString() : new Date(scan.createdAt).toLocaleString()}`, 300, Y + 56);
    Y += bh + 6;

    cardBlock('Executive Summary', R.executiveSummary || R.explanation || scan.explanation || '');
    const reasoning = R.reasoning || {};
    cardBlock('Reasoning', `${t('Anomalies')}: ${t(reasoning.whySuspicious) || t('None.')}\n${t('Conclusion')}: ${t(reasoning.whyConclusion) || 'N/A'}`, C.purple);

    newPage(2);
    const claims = R.claims || [];
    if (claims.length > 0) {
      sectionTitle('Claims Veracity Matrix');
      drawTable(
        ['#', 'Claim', 'Status', 'Conf.', 'Reason'],
        claims.map((c, i) => [`C${i+1}`, c.claim || 'N/A', c.status || '?', `${c.confidence ?? 50}%`, c.reason || 'N/A']),
        [30, 190, 65, 45, 215], ['center', 'left', 'center', 'center', 'left']
      );
    }

    newPage(3);
    sectionTitle('Contextual Indicators');
    metaGrid([
      { k: 'Source Credibility', v: R.sourceCredibility ? `${R.sourceCredibility.score}/100 - ${R.sourceCredibility.verdict}` : 'N/A' },
      { k: 'Political Bias', v: R.biasIndex ? `${R.biasIndex.score}/100 - ${R.biasIndex.verdict}` : 'N/A' },
      { k: 'Readability', v: R.readability ? `${R.readability.grade} (${R.readability.verdict})` : 'N/A' },
      { k: 'Formatting', v: R.formatting ? `${R.formatting.score}/100 - ${R.formatting.verdict}` : 'N/A' },
      { k: 'Clickbait', v: R.clickbait ? `${R.clickbait.score}/100 - ${R.clickbait.verdict}` : 'N/A' },
      { k: 'Risk Level', v: scan.riskLevel || 'N/A' },
    ]);
    const recs = R.recommendations || [];
    if (recs.length > 0) cardBlock('Recovery Protocols', recs.map(r => `• ${r}`).join('\n'), C.cyan);
    disclaimer('This veracity dossier uses linguistic analysis and heuristics. Outputs are advisory only.');
  }

  // ============================================================
  // VIDEO REPORT — 3 pages (Step 8 Premium Design)
  // ============================================================
  else if (scan.type === 'video' && scan.factCheckReport) {
    const R = scan.factCheckReport;
    const riskAssessment = R.riskAssessment || {};

    // ---- PAGE 1: Executive Summary, File Metadata & Scores ----
    newPage(1);
    
    // Title Banner
    doc.fillColor(C.purple).font(FONT_BOLD).fontSize(14);
    txt(t('TRUTHSHIELD AI'), LEFT, Y);
    doc.fillColor(C.muted).font(FONT_REGULAR).fontSize(8);
    txt(t('VIDEO FORENSIC INTEGRITY DOSSIER'), LEFT + 125, Y + 4);
    doc.fillColor(C.white).font(FONT_OBLIQUE).fontSize(8);
    txt(`${t('ID')}: ${scan._id || 'N/A'}`, LEFT + 380, Y + 4);
    
    Y += 20;
    doc.rect(LEFT, Y, WIDTH, 1).fill(C.border);
    Y += 12;

    const thumbY = Y;
    const imgBuf = b64buf(R.thumbnail || R.originalImageBase64);
    if (imgBuf) {
      try { doc.image(imgBuf, LEFT, thumbY, { width: 220, height: 124 }); }
      catch {
        doc.fillColor(C.card).rect(LEFT, thumbY, 220, 124).fill();
        doc.fillColor(C.muted).font(FONT_BOLD).fontSize(8);
        txt(t('VIDEO FRAME THUMBNAIL'), LEFT + 50, thumbY + 58);
      }
    } else {
      doc.fillColor(C.card).rect(LEFT, thumbY, 220, 124).fill();
      doc.fillColor(C.muted).font(FONT_BOLD).fontSize(8);
      txt(t('VIDEO FRAME THUMBNAIL'), LEFT + 50, thumbY + 58);
    }

    // Properties list next to Thumbnail
    const px = 260;
    const pw = 290;
    doc.fillColor(C.white).font(FONT_BOLD).fontSize(8.5);
    txt(t('FILE METADATA IDENTIFIERS'), px, thumbY);
    
    const m = R.metadata || {};
    const properties = [
      { k: 'Filename', v: scan.content || 'N/A' },
      { k: 'Duration', v: m.duration ? `${Number(m.duration).toFixed(2)}s` : 'N/A' },
      { k: 'Resolution', v: (m.width && m.height) ? `${m.width}x${m.height}` : 'N/A' },
      { k: 'Frame Rate', v: m.fps ? `${m.fps} fps` : 'N/A' },
      { k: 'Video Codec', v: m.codec || 'N/A' },
      { k: 'Audio Codec', v: m.audioCodec || 'None' },
      { k: 'File Size', v: m.fileSize ? `${(m.fileSize / (1024 * 1024)).toFixed(2)} MB` : 'N/A' },
      { k: 'SHA-256 Hash', v: m.fileHash || 'N/A' }
    ];

    let py = thumbY + 12;
    properties.forEach((p) => {
      doc.fillColor(C.muted).font(FONT_BOLD).fontSize(6.5);
      txt(t(p.k).toUpperCase(), px, py);
      doc.fillColor(C.white).font(FONT_REGULAR).fontSize(6.5);
      mtxt(t(p.v), px + 65, py, pw - 65, 8);
      py += 11;
    });

    Y = thumbY + 132;

    sectionTitle('Security Classification & Verdict');
    
    // Renders Trust and Confidence bars next to each other
    progressBar(LEFT, Y, 260, 6, riskAssessment.trustScore || 50, t('Master Trust Score'), statusColor);
    progressBar(LEFT + 285, Y, 260, 6, riskAssessment.confidence || 50, t('Confidence Level'), C.purple);
    Y += 28;

    // Render 4 metric miniCards below progress bars
    const cardW = Math.floor((WIDTH - 15) / 4);
    const cardH = 22;
    miniCard(LEFT, Y, cardW, cardH, 'Authenticity', `${riskAssessment.authenticity || 50}%`);
    miniCard(LEFT + cardW + 5, Y, cardW, cardH, 'Manipulation', `${riskAssessment.manipulation || 0}%`);
    miniCard(LEFT + (cardW + 5) * 2, Y, cardW, cardH, 'AI Probability', `${riskAssessment.aiProbability || 0}%`);
    miniCard(LEFT + (cardW + 5) * 3, Y, cardW, cardH, 'Human Prob', `${riskAssessment.humanProbability || 100}%`);
    Y += cardH + 10;

    // Big Verdict Banner Card
    const verdictBannerH = 26;
    doc.fillColor(C.card).rect(LEFT, Y, WIDTH, verdictBannerH).fill();
    doc.rect(LEFT, Y, WIDTH, verdictBannerH).lineWidth(0.6).stroke(C.border);
    doc.fillColor(C.muted).font(FONT_BOLD).fontSize(7);
    txt(t('MASTER EXECUTIVE VERDICT'), LEFT + 8, Y + 4);
    doc.fillColor(statusColor).font(FONT_BOLD).fontSize(9.5);
    txt(t(riskAssessment.verdict || scan.prediction || 'Unknown').toUpperCase(), LEFT + 8, Y + 13);
    
    doc.fillColor(C.muted).font(FONT_BOLD).fontSize(7);
    txt(t('RISK PROFILE STATUS'), LEFT + 380, Y + 4);
    doc.fillColor(statusColor).font(FONT_BOLD).fontSize(9.5);
    txt(t(riskAssessment.risk || 'Low').toUpperCase(), LEFT + 380, Y + 13);
    
    Y += verdictBannerH + 10;

    cardBlock('Executive Forensic Statement Summary', riskAssessment.forensicSummary || scan.explanation || 'No summary description available.', statusColor);


    // ---- PAGE 2: Ratings Matrix, Evidence Table, Acoustic Metrics, Findings ----
    newPage(2);

    sectionTitle('Unified Forensics Matrix & Sub-Module Ratings');
    metaGrid([
      { k: 'Metadata integrity', v: `${riskAssessment.scores?.metadata || 95}%` },
      { k: 'Frame Authenticity', v: `${riskAssessment.scores?.frames || 95}%` },
      { k: 'Audio Quality', v: riskAssessment.active?.audio ? `${riskAssessment.scores?.audio || 90}%` : 'N/A' },
      { k: 'Lip Sync Alignment', v: riskAssessment.active?.lipsync ? `${riskAssessment.scores?.lipsync || 90}%` : 'N/A' },
      { k: 'Speaker voiceprint', v: riskAssessment.active?.speaker ? `${riskAssessment.scores?.speaker || 90}%` : 'N/A' },
      { k: 'Timeline consistency', v: `${riskAssessment.scores?.timeline || 90}%` }
    ], 3);

    sectionTitle('Forensic Risk Aggregation Evidence Matrix');
    const matrixRows = riskAssessment.evidenceMatrix || [];
    drawTable(
      ['Forensic Indicator Category', 'Score', 'Weight', 'Status', 'Absolute Contribution'],
      matrixRows.map(row => [
        row.indicator,
        row.score > 0 ? `${row.score}%` : 'N/A',
        `${row.weight}%`,
        row.status,
        `${row.contribution}%`
      ]),
      [180, 70, 60, 95, 140], ['left', 'center', 'center', 'center', 'center']
    );

    const audioM = R.audioForensics?.metrics || {};
    const lipM = R.lipSync || {};
    const speakM = R.speakerAuthenticity || {};

    sectionTitle('Acoustic, Viseme & Voiceprint Diagnostics');
    metaGrid([
      { k: 'Audio Sample Rate', v: audioM.sampleRate ? `${audioM.sampleRate} Hz` : 'N/A' },
      { k: 'Audio Channels', v: audioM.channels !== undefined ? audioM.channels : 'N/A' },
      { k: 'Audio Bitrate', v: audioM.bitrate ? `${audioM.bitrate} kbps` : 'N/A' },
      { k: 'Lip-Sync Latency', v: lipM.delayMs !== undefined ? `${lipM.delayMs} ms` : 'N/A' },
      { k: 'Viseme Consistency', v: lipM.mouthTracking ? `${lipM.mouthTracking}%` : 'N/A' },
      { k: 'Jaw Movement Sync', v: lipM.jawSync ? `${lipM.jawSync}%` : 'N/A' },
      { k: 'Pitch Stability', v: speakM.pitchConsistency ? `${speakM.pitchConsistency}%` : 'N/A' },
      { k: 'Vocal Naturalness', v: speakM.voiceNaturalness ? `${speakM.voiceNaturalness}%` : 'N/A' },
      { k: 'Voice Clone Prob', v: speakM.voiceCloneProbability !== undefined ? `${speakM.voiceCloneProbability}%` : 'N/A' }
    ], 3);

    const str = riskAssessment.strengths || [];
    const wk = riskAssessment.weaknesses || [];
    const findingsList = [
      `${t('STRENGTHS')}:\n${str.map(s => `• ${t(s)}`).join('\n') || `• ${t('No distinct strengths noted.')}`}`,
      `${t('WEAKNESSES')}:\n${wk.map(w => `• ${t(w)}`).join('\n') || `• ${t('No distinct weaknesses noted.')}`}`
    ].join('\n\n');
    cardBlock('Forensic Findings & Key indicators', findingsList, C.cyan);


    // ---- PAGE 3: Explainable AI, Recommendations, Timeline Table, Signatures ----
    newPage(3);

    sectionTitle('Explainable AI & Forensic Recommendations');
    cardBlock('Explainable AI (XAI) System Logic', riskAssessment.explainableAI || 'No XAI reasoning registered.', C.purple);
    
    const recs = riskAssessment.recommendations || [];
    if (recs.length > 0) {
      cardBlock('Forensic Advisory Recommendations', recs.map(r => `• ${r}`).join('\n'), C.cyan);
    }

    const tl = R.timeline || scan.timeline || [];
    if (tl.length > 0) {
      sectionTitle('Dossier Audit Timeline Events');
      drawTable(
        ['Stage Title', 'Status', 'Confidence', 'Audit Logs Description'],
        tl.map(e => [e.title, e.status.toUpperCase(), `${e.confidence || 0}%`, e.description]),
        [110, 60, 50, 325], ['left', 'center', 'center', 'left']
      );
    }

    // Official Compliance Signature Block
    Y += 15;
    if (Y + 50 <= BOT) {
      doc.rect(LEFT, Y, WIDTH, 0.8).fill(C.border);
      Y += 8;
      
      doc.fillColor(C.muted).font(FONT_BOLD).fontSize(5.5);
      txt(t('OFFICIAL DIGITAL FORENSICS RECORD'), LEFT, Y);
      txt(t('SYSTEM COMPLIANCE SIGNATURE'), LEFT + 380, Y);
      
      Y += 10;
      doc.fillColor(C.white).font(FONT_BOLD).fontSize(6.5);
      txt(t('TRUTHSHIELD AI FOR/VID SEC SUITE'), LEFT, Y);
      txt(`${t('SIGNATURE TIMESTAMP')}: ${new Date().toISOString()}`, LEFT + 320, Y);
      
      Y += 10;
      doc.fillColor(C.muted).font(FONT_REGULAR).fontSize(6);
      txt(`${t('SHA-256 INTEGRITY BLOCK ID')}: ${m.fileHash || 'N/A'}`, LEFT, Y);
    }
    
    disclaimer('This forensic dossier is generated using neural classification, acoustic tracking and visual-auditory delay networks. Results are advisory and do not constitute legal declarations.');
  }

  // ============================================================
  // FALLBACK — 3 pages
  // ============================================================
  else {
    newPage(1);
    const bh = 80;
    doc.fillColor(C.card).rect(LEFT, Y, WIDTH, bh).fill();
    doc.rect(LEFT, Y, WIDTH, bh).lineWidth(0.8).stroke(C.border);
    doc.fillColor(statusColor).font(FONT_BOLD).fontSize(12);
    txt(`${t('VERDICT')}: ${t(scan.prediction || 'Unknown').toUpperCase()}`, LEFT + 15, Y + 10);
    progressBar(LEFT + 15, Y + 35, 230, 5, scan.confidenceScore || 50, t('Confidence'), statusColor);
    doc.fillColor(C.muted).font(FONT_REGULAR).fontSize(6.5);
    txt(`${t('ID')}: ${scan._id}  |  ${t('Type')}: ${t(scan.type || 'unknown').toUpperCase()}  |  ${t('Provider')}: ${scan.provider || 'Gemini'}`, LEFT + 15, Y + 58);
    Y += bh + 6;

    metaGrid([
      { k: 'Content', v: scan.content || 'N/A' },
      { k: 'Risk', v: scan.riskLevel || 'N/A' },
      { k: 'Credibility', v: `${scan.credibilityScore || 50}/100` },
    ]);
    cardBlock('Analysis', scan.explanation || 'No explanation available.');

    newPage(2);
    if (scan.factCheckReport) {
      const R = scan.factCheckReport;
      cardBlock('Executive Summary', R.executiveSummary || R.explanation || '');
      const recs = R.recommendations || [];
      if (recs.length > 0) cardBlock('Recommendations', recs.map(r => `• ${r}`).join('\n'));
    } else {
      cardBlock('Extended Analysis', 'No extended report data available for this scan type.');
    }

    newPage(3);
    cardBlock('Audit Trail', `${t('Scan ID')}: ${scan._id}\n${t('Type')}: ${t(scan.type || 'unknown').toUpperCase()}\n${t('Timestamp')}: ${new Date(scan.createdAt).toLocaleString()}\n${t('Provider')}: ${scan.provider || 'Gemini'}\n${t('Status')}: ${t(scan.status || 'success')}`, C.purple);
    disclaimer('This dossier is generated using neural classification models. Outputs are advisory only.');
  }

  doc.end();
};
