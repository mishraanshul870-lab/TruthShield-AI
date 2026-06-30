# TruthShield AI – AI-Based Fake News & Deepfake Detection Platform

[![Status](https://img.shields.io/badge/Status-Production--Ready-brightgreen.svg)]() 
[![Version](https://img.shields.io/badge/Version-v2.0.0-blue.svg)]() 
[![License](https://img.shields.io/badge/License-MIT-orange.svg)]()

TruthShield AI is a full-stack, AI-powered digital forensics and cybersecurity portfolio platform that audits the authenticity of text documents, URLs, images, and video media. It leverages dual-channel classification structures to identify fake news bias, synthetic image generator signatures (GANs/diffusion outputs), and temporal mesh video anomalies.

---

## 1. Project Overview

### What it Does
TruthShield AI scans multi-format media resources—ranging from plaintext snippets, online URLs, and photo uploads, to frame-by-frame video streams—calculating deepfake probability indices, ELA alteration maps, and acoustic/visual sync ratings.

### Why it was Built
With the exponential rise of synthetic generation engines, online trust is heavily compromised. TruthShield was built as an audit standard for researchers, investigators, and verification specialists to analyze files using advanced deep learning classification with zero complex setup overhead.

### Real-World Use Cases
*   **Media & Journalism**: Cross-checking user-submitted images, transcripts, or video interviews for face-swap traces or linguistic manipulation.
*   **Trust and Safety Audits**: Validating incoming URLs against DNS registry metrics and fact-check repositories.
*   **Digital Forensic Analysis**: Inspecting photos for compression artifacts and downloading structured threat dossiers.

---

## 2. Key Features

*   **AI Image Investigation**: Process image files (PNG/JPG/WEBP) for local Error Level Analysis (ELA) and GAN generation traces.
*   **AI Video Investigation**: Parse MP4/MKV video tracks frame-by-frame for facial boundary alignment, temporal consistency, and audio-to-mouth sync.
*   **AI Text/PDF Investigation**: Parse text documents or PDF files to index emotional bias density, clickbait triggers, and plagiarism scores.
*   **AI URL Verification**: Resolve domains against live DNS registers, WHOIS entries, and SSL certificate diagnostic lists.
*   **Reports Dashboard**: View key statistics, scanner activity graphs, and threat history events.
*   **History Management**: Search, filter, page, and delete past scan records cleanly.
*   **Authentication**: Secure session management using bcrypt-hashed credentials and JWT tokens.
*   **Profile Management**: Inspect profile statistics and update secure login parameters.
*   **API Key Management**: Custom client override settings for user-provided API credentials.
*   **English/Hindi Localization**: Completely translated pages, menus, navigation sidebars, and input labels.
*   **Dynamic Language Switching**: Toggle application language instantly at runtime with zero page refreshes or state loss.
*   **Localized AI Results**: AI findings, checklists, explanations, and advice text render dynamically in the active locale.
*   **Localized PDF Reports**: PDF report downloads automatically generate in the selected language layout.
*   **Browser Extension**: Scan active tab URLs instantly using a Manifest V3 browser extension panel.
*   **Secure Backend**: Rate-limiters, payload size restrictions, and secure headers protect the API.
*   **Production Ready**: Configured for high availability, fallback databases, and offline mock support.

---

## 3. Technology Stack

### Frontend
*   **Framework**: React (Vite)
*   **Styles**: Tailwind CSS v3 (Neon Cyberpunk Theme)
*   **Icons**: Lucide Icons
*   **Routing**: React Router DOM
*   **Localization**: react-i18next

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **File Handling**: Multer
*   **Security Headers**: Helmet & CORS

### Database
*   **Primary Database**: MongoDB (via Mongoose)
*   **Zero-Config Fallback**: Local file-based JSON store (`backend/database.json`) when `MONGO_URI` is absent.

### AI Engine
*   **Primary API**: Google Gemini AI
*   **Inference API**: OpenAI (Fallback)

### System Services
*   **PDF Compiler**: PDFKit
*   **Extraciton Engine**: PDF-Parse & Fluent-FFmpeg
*   **Browser Extension**: Chrome Extension Manifest V3 APIs

---

## 4. Project Architecture

```
       [ Browser Extension ]
                 │
                 ▼
       [ React Frontend ]  ◄── (react-i18next Switcher)
                 │
                 ▼
       [ Express Backend ] ◄── (pdfKit / Multer filters)
                 │
        ┌────────┴────────┐
        ▼                 ▼
  [ AI Services ]    [ MongoDB / JSON Fallback ]
```

---

## 5. Folder Structure

```
truthshield-ai/
├── backend/
│   ├── config/            # DB configuration & database models
│   ├── controllers/       # Auth & Scan business logic controllers
│   ├── middleware/        # JWT Authentication, Multer file filters, rate limiters
│   ├── uploads/           # Secured directory for transient scans
│   ├── utils/             # PDF text parser, localized PDF report generator
│   ├── package.json       # Backend configurations & node modules
│   └── server.js          # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── components/    # Navigation, Language Switcher, Result Cards, Indicators
│   │   ├── pages/         # Dashboard, Scanners, history, settings panels
│   │   ├── i18n/          # Locales translations resources bundles (en/hi)
│   │   └── index.css      # Custom neon cyberpunk styles
│   ├── package.json       # Frontend configurations & packages
│   └── vite.config.js     # Vite configuration parameters
└── extension/
    ├── manifest.json      # Chrome V3 Extension config
    ├── popup.html/.js     # Extension popup layout and API triggers
    └── styles.css         # Cyber neon stylesheet
```

---

## 6. Installation & Setup

### Prerequisites
*   **Node.js**: v18.0.0 or higher
*   **NPM**: v9.0.0 or higher
*   **FFmpeg**: Static FFmpeg binaries are automatically configured in the code structure.

### Clone the Repository
```bash
git clone https://github.com/your-username/truthshield-ai.git
cd truthshield-ai
```

### Setup the Backend Server
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment parameters:
    Copy `.env.example` to `.env`:
    ```bash
    cp .env.example .env
    ```
4.  Run the development backend server:
    ```bash
    npm run dev
    ```
    *Note: If no `MONGO_URI` is provided, the server falls back to the zero-config local `database.json` store.*

### Setup the Frontend client
1.  In a new terminal window, navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the local dev server:
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to `http://localhost:5173`.

### Load the Chrome Extension popup
1.  Open Google Chrome and navigate to `chrome://extensions/`.
2.  Enable **Developer mode** in the top-right corner.
3.  Click **Load unpacked** in the top-left corner.
4.  Select the `extension/` folder in the project root.
5.  Copy your secure JWT credentials token from the Profile Settings tab inside the web portal, expand the **Credential Settings** menu in the extension panel, paste the token, and click save.

---

## 7. Environment Variables

Create and configure your `.env` variables under `backend/.env`.

```ini
# Server Port Configuration
PORT=5000

# MongoDB URI (leave blank to run in-memory / JSON database fallback)
MONGO_URI=mongodb://localhost:27017/truthshield

# JSON Web Token Secret key
JWT_SECRET=your_jwt_secret_here

# AI Credentials (leave blank to run mock diagnostic pipelines)
OPENAI_API_KEY=your_openai_api_key_here
HUGGINGFACE_API_KEY=your_huggingface_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 8. Usage Guide

1.  **Clearance Access**: Register a new profile or log in with test credentials on the authentication screen.
2.  **Initialize Scan**:
    *   **Text/PDF Scanner**: Paste news articles or upload a PDF document.
    *   **Image face-swap Scanner**: Drag and drop any image file.
    *   **Video integrity Scanner**: Upload video tracks to extract frames and verify mouth synchronization.
    *   **URL Scan**: Enter online links to check DNS registries and SSL encryption metrics.
3.  **Audit Diagnostic details**: Inspect threat level indicators, timeline graphs, and visual anomalies.
4.  **Download PDF Dossier**: Click **Download PDF Dossier** on any scan page or scan history record.
5.  **Toggle Language**: Click the **Language Switcher** in the navigation header to translate all controls, AI findings, and exported reports instantly.

---

## 9. Security Implementations

*   **Helmet Headers Configuration**: Express runs Helmet security middleware to prevent clickjacking, MIME-sniffing, and cross-origin resource leaks.
*   **Strict CORS Policy**: CORS limits origin validation specifically to allowed client ports and extension instances.
*   **Request & Payload Limits**: Restricts body parsing to a maximum size of `'1mb'` to prevent DoS attempts. Upload scanners enforce safe size boundaries (e.g. 10MB PDF, 15MB Image, 100MB Video).
*   **MIME-type Enforcements**: Discards user-submitted filenames in disk storage, utilizing randomized timestamps to prevent script traversal or executable execution.

---

## 10. Localization Framework

TruthShield features a completely localized architecture utilizing `react-i18next` on the client and custom locales loading middleware on the backend:
*   **Supported Languages**: English (`en`) and Hindi (`hi`).
*   **Client Localization**: All side navigation trees, form placeholders, loaders, badges, and alerts render in the active language.
*   **Dossier Localization**: Backend PDF Generators compile canvas labels, compliant signatures, and disclaimers dynamically matching the query language parameter `?lang=`.

---

## 11. Screenshots Placeholder

*   **Landing Page**: `[Screenshot: Portal Entry & Features Panel]`
*   **Dashboard View**: `[Screenshot: Scan Statistics and Activity Log charts]`
*   **Image alteration Analysis**: `[Screenshot: Error Level Analysis and alter indicators]`
*   **Video mesh Analysis**: `[Screenshot: Frames timeline inspection & lip sync]`
*   **Text veracity Scanners**: `[Screenshot: Claims veracity checks & bias ratings]`
*   **URL verification panel**: `[Screenshot: SSL diagnostic lists & DNS lookup status]`
*   **Dossiers history list**: `[Screenshot: Scans search, status filters, and page controls]`
*   **API Configuration settings**: `[Screenshot: General, Profiles settings, and custom credentials inputs]`

---

## 12. Future Enhancements

*   **Additional Languages**: Incorporate additional localizations like Spanish, German, and Japanese.
*   **Performance Optimizations**: Multi-threading for local ELA and FFmpeg frame extractions.
*   **Cloud Deployments**: Configuration mappings for automated Dockerized staging.
*   **AI Model Expansions**: Support for customized local inference setups.

---

## 13. License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 14. Authors & Maintenance

Created and maintained by the TruthShield AI Core Engineering team.
