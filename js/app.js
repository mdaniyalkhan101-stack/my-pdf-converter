/**
 * My PDF Converter – Main Application Logic
 *
 * Handles file selection (browse + drag & drop), preview,
 * conversion to PDF, and download.
 *
 * Libraries used (loaded via CDN in index.html):
 *   - jsPDF       : PDF generation
 *   - mammoth.js  : .docx → HTML extraction
 *   - html2canvas : HTML/image rendering to canvas
 */

/* ============================================================
   DOM References
   ============================================================ */
const dropZone            = document.getElementById('drop-zone');
const fileInput           = document.getElementById('file-input');
const browseBtn           = document.getElementById('browse-btn');
const filePreview         = document.getElementById('file-preview');
const fileName            = document.getElementById('file-name');
const fileSize            = document.getElementById('file-size');
const fileTypeIcon        = document.getElementById('file-type-icon');
const imagePreviewContainer = document.getElementById('image-preview-container');
const imagePreviewEl      = document.getElementById('image-preview');
const removeFileBtn       = document.getElementById('remove-file-btn');
const convertBtn          = document.getElementById('convert-btn');
const progressContainer   = document.getElementById('progress-container');
const progressBar         = document.getElementById('progress-bar');
const progressText        = document.getElementById('progress-text');
const statusMessage       = document.getElementById('status-message');
const downloadSection     = document.getElementById('download-section');
const downloadBtn         = document.getElementById('download-btn');
const convertAnotherBtn   = document.getElementById('convert-another-btn');

/* ============================================================
   State
   ============================================================ */
let selectedFile = null;       // the current File object
let generatedPdfBlob = null;   // Blob produced after conversion

/* Accepted MIME types / extensions */
const ACCEPTED_EXTENSIONS = ['.docx', '.txt', '.html', '.png', '.jpg', '.jpeg'];
const IMAGE_EXTENSIONS    = ['.png', '.jpg', '.jpeg'];

/* ============================================================
   Utility Helpers
   ============================================================ */

/** Format bytes into a human-readable string (KB / MB). */
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Return the lowercase file extension (e.g. ".docx"). */
function getExtension(file) {
  return '.' + file.name.split('.').pop().toLowerCase();
}

/** Check whether a file is one of the supported types. */
function isValidFile(file) {
  return ACCEPTED_EXTENSIONS.includes(getExtension(file));
}

/** Show a status message banner. type = 'success' | 'error' | 'info' */
function showStatus(type, html) {
  statusMessage.innerHTML = html;
  statusMessage.className = type;
  statusMessage.style.display = 'flex';
}

/** Hide the status banner. */
function hideStatus() {
  statusMessage.style.display = 'none';
}

/** Update the progress bar (0–100). */
function setProgress(value, label) {
  progressBar.style.width = `${value}%`;
  if (label) progressText.textContent = label;
}

/* ============================================================
   File Selection & Preview
   ============================================================ */

/** Called whenever a new file is selected (browse or drop). */
function handleFileSelected(file) {
  if (!isValidFile(file)) {
    showStatus('error',
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>Unsupported file type. Please upload .docx, .txt, .html, .png, .jpg, or .jpeg.</span>`
    );
    return;
  }

  hideStatus();
  selectedFile = file;
  generatedPdfBlob = null;
  downloadSection.style.display = 'none';

  // -- File info card --
  const ext = getExtension(file);
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);

  // Set icon label and colour class
  fileTypeIcon.className = 'file-type-icon';
  if (ext === '.docx') {
    fileTypeIcon.textContent = 'DOCX';
    fileTypeIcon.classList.add('docx');
  } else if (ext === '.txt') {
    fileTypeIcon.textContent = 'TXT';
    fileTypeIcon.classList.add('txt');
  } else if (ext === '.html') {
    fileTypeIcon.textContent = 'HTML';
    fileTypeIcon.classList.add('html');
  } else {
    fileTypeIcon.textContent = 'IMG';
    fileTypeIcon.classList.add('image');
  }

  filePreview.style.display = 'block';
  convertBtn.disabled = false;

  // -- Image thumbnail --
  if (IMAGE_EXTENSIONS.includes(ext)) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreviewEl.src = e.target.result;
      imagePreviewContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
  } else {
    imagePreviewContainer.style.display = 'none';
    imagePreviewEl.src = '';
  }
}

/** Reset the UI to the initial "choose a file" state. */
function resetUI() {
  selectedFile = null;
  generatedPdfBlob = null;
  fileInput.value = '';
  filePreview.style.display = 'none';
  imagePreviewContainer.style.display = 'none';
  imagePreviewEl.src = '';
  progressContainer.style.display = 'none';
  downloadSection.style.display = 'none';
  convertBtn.disabled = true;
  hideStatus();
}

/* ============================================================
   Event Listeners – Browse / Drop Zone
   ============================================================ */

browseBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  if (fileInput.files && fileInput.files[0]) {
    handleFileSelected(fileInput.files[0]);
  }
});

removeFileBtn.addEventListener('click', resetUI);

// Allow clicking anywhere on the drop-zone to open browser
dropZone.addEventListener('click', (e) => {
  // Avoid double-trigger if the click was on the browse button inside
  if (e.target === browseBtn || browseBtn.contains(e.target)) return;
  fileInput.click();
});

// Drag & Drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', (e) => {
  if (!dropZone.contains(e.relatedTarget)) {
    dropZone.classList.remove('drag-over');
  }
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const files = e.dataTransfer.files;
  if (files && files[0]) {
    handleFileSelected(files[0]);
  }
});

/* ============================================================
   Conversion Logic
   ============================================================ */

convertBtn.addEventListener('click', convertFile);

async function convertFile() {
  if (!selectedFile) return;

  const ext = getExtension(selectedFile);

  // Show progress UI
  convertBtn.disabled = true;
  convertBtn.innerHTML = '<span class="spinner"></span> Converting…';
  progressContainer.style.display = 'block';
  downloadSection.style.display = 'none';
  hideStatus();
  setProgress(5, 'Starting conversion…');

  try {
    let pdfBlob;

    if (ext === '.docx') {
      pdfBlob = await convertDocx(selectedFile);
    } else if (ext === '.txt') {
      pdfBlob = await convertTxt(selectedFile);
    } else if (ext === '.html') {
      pdfBlob = await convertHtml(selectedFile);
    } else if (IMAGE_EXTENSIONS.includes(ext)) {
      pdfBlob = await convertImage(selectedFile);
    } else {
      throw new Error('Unsupported file type.');
    }

    generatedPdfBlob = pdfBlob;
    setProgress(100, 'Done!');
    showDownloadSection();
    showStatus('success',
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <span>Conversion successful! Your PDF is ready to download.</span>`
    );
  } catch (err) {
    console.error('Conversion error:', err);
    setProgress(0, '');
    progressContainer.style.display = 'none';
    showStatus('error',
      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>Conversion failed: ${err.message || 'Unknown error'}. Please try again.</span>`
    );
  } finally {
    convertBtn.disabled = false;
    convertBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
      Convert to PDF`;
  }
}

/* ---- Individual converters ---- */

/**
 * Convert a .docx file to PDF.
 * Extracts HTML via mammoth.js, renders to canvas via html2canvas,
 * then embeds into jsPDF.
 */
async function convertDocx(file) {
  setProgress(15, 'Reading DOCX file…');

  const arrayBuffer = await file.arrayBuffer();
  setProgress(30, 'Extracting document content…');

  const result = await mammoth.convertToHtml({ arrayBuffer });
  const rawHtml = result.value;

  setProgress(50, 'Rendering content…');
  return htmlStringToPdf(rawHtml);
}

/**
 * Convert a plain-text .txt file to PDF using jsPDF directly.
 */
async function convertTxt(file) {
  setProgress(20, 'Reading text file…');

  const text = await file.text();
  setProgress(50, 'Generating PDF…');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin     = 50;
  const maxWidth   = pageWidth - margin * 2;
  const lineHeight = 15;
  const fontSize   = 11;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);

  const lines = doc.splitTextToSize(text, maxWidth);
  let y = margin + 20;

  for (let i = 0; i < lines.length; i++) {
    if (y + lineHeight > pageHeight - margin) {
      doc.addPage();
      y = margin + 20;
    }
    doc.text(lines[i], margin, y);
    y += lineHeight;
    setProgress(50 + Math.round((i / lines.length) * 40), 'Generating PDF…');
  }

  setProgress(95, 'Finalising…');
  return doc.output('blob');
}

/**
 * Convert an .html file to PDF.
 * Reads the HTML source and renders it via html2canvas → jsPDF.
 */
async function convertHtml(file) {
  setProgress(20, 'Reading HTML file…');

  const htmlText = await file.text();
  setProgress(40, 'Rendering HTML…');

  return htmlStringToPdf(htmlText);
}

/**
 * Convert an image file (.png / .jpg / .jpeg) to a PDF page.
 */
async function convertImage(file) {
  setProgress(20, 'Loading image…');

  const dataUrl = await readFileAsDataURL(file);
  setProgress(50, 'Embedding image into PDF…');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin     = 40;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxW = pageWidth  - margin * 2;
      const maxH = pageHeight - margin * 2;

      let imgW = img.naturalWidth;
      let imgH = img.naturalHeight;

      // Scale to fit the page while preserving aspect ratio
      const scale = Math.min(maxW / imgW, maxH / imgH, 1);
      imgW *= scale;
      imgH *= scale;

      const x = margin + (maxW - imgW) / 2;
      const y = margin + (maxH - imgH) / 2;

      const ext = getExtension(file).replace('.', '').toUpperCase();
      const format = ext === 'JPG' ? 'JPEG' : ext;

      doc.addImage(dataUrl, format, x, y, imgW, imgH);
      setProgress(95, 'Finalising…');
      resolve(doc.output('blob'));
    };
    img.onerror = () => reject(new Error('Could not load image.'));
    img.src = dataUrl;
  });
}

/* ============================================================
   Shared Helper: HTML string → PDF blob
   ============================================================ */

/**
 * Render an arbitrary HTML string into a PDF using
 * a hidden off-screen container, html2canvas, and jsPDF.
 */
async function htmlStringToPdf(htmlString) {
  // Wrap in a styled container so the render looks reasonable
  const wrapper = document.createElement('div');
  wrapper.style.cssText = [
    'position:fixed',
    'top:-10000px',
    'left:0',
    'width:794px',   /* A4 width at 96 dpi */
    'background:#fff',
    'font-family:Arial,Helvetica,sans-serif',
    'font-size:13px',
    'line-height:1.7',
    'color:#111',
    'padding:50px 60px',
    'box-sizing:border-box',
  ].join(';');

  wrapper.innerHTML = htmlString;
  document.body.appendChild(wrapper);

  setProgress(65, 'Rendering to canvas…');

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 794,
    });

    setProgress(85, 'Building PDF pages…');

    const { jsPDF } = window.jspdf;
    const doc       = new jsPDF({ unit: 'pt', format: 'a4' });

    const pageWidth  = doc.internal.pageSize.getWidth();   // 595.28 pt
    const pageHeight = doc.internal.pageSize.getHeight();  // 841.89 pt
    const margin     = 0;

    const imgW   = pageWidth - margin * 2;
    const ratio  = canvas.width / imgW;
    const imgH   = canvas.height / ratio;

    // Split the canvas across multiple pages if needed
    let remaining = imgH;
    let srcY      = 0;

    while (remaining > 0) {
      const sliceH = Math.min(remaining, pageHeight);
      const slicePx = Math.round(sliceH * ratio);

      const slice = document.createElement('canvas');
      slice.width  = canvas.width;
      slice.height = slicePx;

      const ctx = slice.getContext('2d');
      ctx.drawImage(canvas, 0, srcY * ratio, canvas.width, slicePx, 0, 0, canvas.width, slicePx);

      const sliceData = slice.toDataURL('image/png');
      if (srcY > 0) doc.addPage();
      doc.addImage(sliceData, 'PNG', margin, margin, imgW, sliceH);

      srcY      += sliceH;
      remaining -= sliceH;
    }

    setProgress(95, 'Finalising…');
    return doc.output('blob');
  } finally {
    document.body.removeChild(wrapper);
  }
}

/* ============================================================
   Utility: FileReader promise wrapper
   ============================================================ */
function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = ()  => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
  });
}

/* ============================================================
   Download
   ============================================================ */

function showDownloadSection() {
  const baseName = selectedFile.name.replace(/\.[^/.]+$/, '');
  downloadBtn.setAttribute('data-filename', `${baseName}.pdf`);
  downloadSection.style.display = 'block';
}

downloadBtn.addEventListener('click', () => {
  if (!generatedPdfBlob) return;
  const url      = URL.createObjectURL(generatedPdfBlob);
  const link     = document.createElement('a');
  link.href      = url;
  link.download  = downloadBtn.getAttribute('data-filename') || 'converted.pdf';
  link.click();
  URL.revokeObjectURL(url);
});

convertAnotherBtn.addEventListener('click', resetUI);
