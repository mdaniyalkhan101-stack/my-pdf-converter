# My PDF Converter

A modern, fully client-side **Document-to-PDF Converter** that runs entirely in your browser — no server, no uploads, 100% private.

![My PDF Converter screenshot](screenshot.png)

---

## ✨ Features

- 📄 Convert **.docx** (Word documents) to PDF
- 📝 Convert **.txt** (plain text) to PDF
- 🌐 Convert **.html** files to PDF
- 🖼️ Embed **.png / .jpg / .jpeg** images into a PDF
- 🖱️ **Drag & Drop** or browse-button file upload
- 👁️ **Preview** the selected file name, type, and size before converting
- 📷 Inline thumbnail preview for uploaded images
- ⏳ Progress bar with live status updates during conversion
- ✅ Success / ❌ error feedback banners
- 💾 One-click **Download PDF** after conversion
- 📱 Fully **responsive** (mobile, tablet, desktop)
- 🔒 **100% client-side** — your files never leave your device

---

## 🗂️ File Structure

```
my-pdf-converter/
├── index.html      ← Main page (upload UI + conversion logic)
├── css/
│   └── style.css   ← Stylesheet (modern design, flexbox/grid, animations)
├── js/
│   └── app.js      ← JavaScript logic (file handling, conversion, download)
└── README.md       ← This file
```

---

## 🚀 How to Use

1. **Open** `index.html` in any modern browser (Chrome, Firefox, Edge, Safari).
2. **Upload** a file by dragging it onto the drop zone or clicking **Browse File**.
3. Click **Convert to PDF** and wait for the progress bar to complete.
4. Click **Download PDF** to save the result to your device.
5. Click **Convert Another File** to start over.

> No installation or build step required — just open the file and go!

---

## 🌐 Deploying to GitHub Pages

1. Push the repository to GitHub.
2. Go to **Settings → Pages** and set the source to the `main` branch, root folder.
3. GitHub Pages will serve `index.html` automatically.

---

## 🛠️ Technologies Used

| Library | Purpose | CDN |
|---|---|---|
| [jsPDF](https://parall.ax/products/jspdf) | PDF generation | cdnjs |
| [mammoth.js](https://github.com/mwilliamson/mammoth.js) | `.docx` → HTML extraction | cdnjs |
| [html2canvas](https://html2canvas.hertzen.com/) | DOM/HTML → canvas rendering | cdnjs |

Built with plain **HTML5**, **CSS3**, and **Vanilla JavaScript** — no build tools required.

---

## 📋 Supported Formats

| Format | Extension | Notes |
|---|---|---|
| Word Document | `.docx` | Text + basic formatting |
| Plain Text | `.txt` | Preserves line breaks |
| HTML File | `.html` | Renders the HTML visually |
| Image | `.png` | Embedded full-page |
| Image | `.jpg` / `.jpeg` | Embedded full-page |

---

## 📄 License

This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).
