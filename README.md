<p align="center">
  <img src="docs/assets/banner.png" alt="TruthShield AI Banner" width="100%">
</p>

<p align="center">
  <img src="docs/assets/logo.png" alt="TruthShield AI Logo" width="120">
</p>

<h1 align="center">🛡️ TruthShield AI</h1>
<p align="center"><strong>AI-Powered Fake News & Deepfake Detection Platform</strong></p>
<p align="center"><em>Detect • Verify • Explain • Protect</em></p>

<p align="center">
  <a href="https://truthshield-frontend.onrender.com"><img src="https://img.shields.io/badge/Live%20Demo-Visit%20Platform-00E676?style=for-the-badge&logo=render&logoColor=white" alt="Live Demo"></a>
  <a href="https://github.com/mishraanshul870-lab/TruthShield-AI"><img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repo"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-orange.svg?style=for-the-badge" alt="License"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Google%20Gemini-4285F4?style=flat-square&logo=google&logoColor=white" alt="Gemini">
  <img src="https://img.shields.io/badge/JWT-black?style=flat-square&logo=json-web-tokens&logoColor=B375F9" alt="JWT">
  <img src="https://img.shields.io/badge/TailwindCSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="TailwindCSS">
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite">
</p>

---

## 📍 Quick Navigation

- [📖 Project Overview](#-project-overview)
- [🎯 Why TruthShield AI](#-why-truthshield-ai)
- [✨ Key Features](#-key-features)
- [🛠️ Technology Stack](#️-technology-stack)
- [🏗️ System Architecture](#️-system-architecture)
- [🔄 Investigation Workflow](#-investigation-workflow)
- [📸 Screenshot Gallery](#-screenshot-gallery)
- [⚙️ Installation & Setup](#️-installation--setup)
- [🔑 Environment Variables](#-environment-variables)
- [📂 Folder Structure](#-folder-structure)
- [🔌 API Overview](#-api-overview)
- [🧩 Browser Extension](#-browser-extension)
- [🤖 Explainable AI](#-explainable-ai)
- [🌍 Localization](#-localization)
- [🚀 Future Roadmap](#-future-roadmap)
- [🤝 Contributing](#-contributing)
- [👨‍💻 Developer](#-developer)
- [📜 License](#-license)

---

## 📖 Project Overview

**TruthShield AI** is an advanced, production-grade digital forensics and
cybersecurity platform designed to audit and verify digital content integrity.
By combining modern artificial intelligence models with robust media processing
utilities, the platform analyzes multi-format content including news articles,
uploaded PDF files, static images, video streams, and online web domains.

The platform empowers researchers, verification specialists, and investigators
by producing comprehensive risk profiles, tampering maps, and natural-language
explainable dossiers to actively expose misinformation campaigns, synthetic
generation, and deepfakes.

---

## 🎯 Why TruthShield AI

In the modern digital era, the rapid rise of generative AI has created severe
trust and security challenges. Fabricated news, face-swaps, synthetic media,
and phishing links spread quickly, compromising public trust.

**TruthShield AI** addresses this crisis by offering an open-source, unified
verification portal that replaces typical black-box model predictions with
transparent, evidence-based reasoning. This allows users to inspect digital
content critically with zero configuration or setup overhead.

---

## ✨ Key Features

- 📰 **Fake News Detection**: Audits text blocks or PDF uploads, grading claim
  veracity, emotional bias density, and clickbait anomalies.
- 🖼️ **Image Deepfake Detection**: Inspects image metadata and applies Error
  Level Analysis (ELA) to expose generative signatures or local alterations.
- 🎥 **Video Deepfake Detection**: Examines sequential frames for boundary
  jitters, facial mesh alignments, and audio-to-mouth sync anomalies.
- 🌐 **URL Verification**: Resolves web domains against live SSL registries,
  DNS records, and WHOIS entries to prevent phishing.
- 🤖 **Explainable AI**: Accompanies all investigation verdicts with clear,
  detailed, and logical text explanations of the model's reasoning.
- 📄 **PDF Reports**: Automatically compiles verified findings into a
  professional, downloadable forensic PDF dossier.
- 📊 **Interactive Dashboard**: Displays real-time intelligence logs, platform
  diagnostics counters, and recent activity graphs.
- 📂 **Dossier History**: Features search, deletion, and query filters to
  catalog past scan records.
- 🔐 **Session Authentication**: Secures routing and credential registries
  using JWT tokens and bcrypt hashing.
- 🔌 **Browser Extension**: A Manifest V3 panel facilitating instant URL
  verification directly from active browser tabs.
- 🌍 **Hindi Localization**: Offers a complete dual-language experience,
  translating menus, inputs, dashboards, and PDF reports dynamically.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Implementation Details |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, react-i18next | Interactive, cyberpunk neon theme UI with runtime language toggling |
| **Backend** | Node.js, Express.js, Multer, Helmet | REST API secured with rate-limiters, payload restrictions, and custom headers |
| **Database** | MongoDB Atlas, Mongoose | Relational cloud database featuring a zero-config fallback local JSON database |
| **AI Integration**| Google Gemini API (gemini-2.5-flash) | Drives explainable reasoning engines and claim validation workflows |
| **Media Processing**| PDFKit, PDF-parse, Fluent-FFmpeg | Compiles PDF reports, parses PDF uploads, and handles frame extraction |

---

## 🏗️ System Architecture

```text
                               ┌──────────────────────────────┐
                               │     Chrome V3 Extension      │
                               └──────────────┬───────────────┘
                                              │
                                              ▼
                               ┌──────────────────────────────┐
                               │    React (Vite) Frontend     │
                               └──────────────┬───────────────┘
                                              │
                                         REST API Calls
                                              │
                                              ▼
                               ┌──────────────────────────────┐
                               │    Express Backend Server    │
                               └──────────────┬───────────────┘
                                              │
                     ┌────────────────────────┼────────────────────────┐
                     ▼                        ▼                        ▼
              [Google Gemini AI]      [MongoDB / JSON]        [JWT Authentication]
             (Explainable Models)    (Dossier Database)      (Secure Session Access)
```

- **Frontend client**: Built with React 19 and structured components. Styles
  are compiled using Tailwind CSS (Neon Cyberpunk theme).
- **Backend gateway**: Powered by Express.js, providing file storage logic,
  security wrappers, and interfaces for AI APIs.
- **Database engines**: Interfaced via Mongoose to MongoDB Atlas. Falls back
  to a local JSON file if cloud parameters are omitted.
- **AI processors**: Connects directly to Google Gemini APIs to output
  explainable reasoning and credibility indexes.

---

## 🔄 Investigation Workflow

1. **Submission**: User inputs text, URL, PDF, image, or video file into the
   specific scanner panel.
2. **Metadata Extraction**: Backend reads EXIF headers, registrar WHOIS
   entries, or codec configurations.
3. **Forensics Run**: Local routines compute Error Level Analysis (ELA) on
   images or decode frame sequences from videos.
4. **AI Inference**: The system invokes Google Gemini to validate statements,
   analyze claims, and assess semantic structures.
5. **Dossier Compilation**: System consolidates indicators, confidence
   ratings, and warnings into a unified state.
6. **Report Export**: Users view the live result dashboard or generate a
   print-ready PDF document in the selected language.

---

## 📸 Screenshot Gallery

### Authentication
<table>
  <tr>
    <td width="50%" align="center"><strong>Login Gate</strong><br><img src="docs/screenshots/login.png" width="100%"></td>
    <td width="50%" align="center"><strong>Shield Registry</strong><br><img src="docs/screenshots/register.png" width="100%"></td>
  </tr>
</table>

### Dashboard
<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="Dashboard" width="100%">
</p>

### Fake News
<table>
  <tr>
    <td width="50%" align="center"><strong>Text Analysis Panel</strong><br><img src="docs/screenshots/text-detection.png" width="100%"></td>
    <td width="50%" align="center"><strong>Credibility Report</strong><br><img src="docs/screenshots/text-report.png" width="100%"></td>
  </tr>
</table>

### Image Detection
<table>
  <tr>
    <td width="50%" align="center"><strong>Image Analysis Panel</strong><br><img src="docs/screenshots/image-detection.png" width="100%"></td>
    <td width="50%" align="center"><strong>Forensics Dossier</strong><br><img src="docs/screenshots/image-report.png" width="100%"></td>
  </tr>
</table>

### Video Detection
<table>
  <tr>
    <td width="50%" align="center"><strong>Video Analysis Portal</strong><br><img src="docs/screenshots/video-detection.png" width="100%"></td>
    <td width="50%" align="center"><strong>A/V Forensics Report</strong><br><img src="docs/screenshots/video-report.png" width="100%"></td>
  </tr>
</table>

### URL Verification
<table>
  <tr>
    <td width="50%" align="center"><strong>Domain Reputation Panel</strong><br><img src="docs/screenshots/url-verification.png" width="100%"></td>
    <td width="50%" align="center"><strong>Reputation Dossier</strong><br><img src="docs/screenshots/url-report.png" width="100%"></td>
  </tr>
</table>

### Reports & History
<table>
  <tr>
    <td width="50%" align="center"><strong>Verification Reports</strong><br><img src="docs/screenshots/reports.png" width="100%"></td>
    <td width="50%" align="center"><strong>Historical Integrity Logs</strong><br><img src="docs/screenshots/history.png" width="100%"></td>
  </tr>
</table>

### Profile & Settings
<table>
  <tr>
    <td width="50%" align="center"><strong>General Configuration</strong><br><img src="docs/screenshots/settings.png" width="100%"></td>
    <td width="50%" align="center"><strong>Agent Profile Details</strong><br><img src="docs/screenshots/profile.png" width="100%"></td>
  </tr>
</table>

<p align="center">
  <strong>Credential & Security Center</strong><br>
  <img src="docs/screenshots/security.png" width="100%">
</p>

### Hindi UI
<table>
  <tr>
    <td width="50%" align="center"><strong>हिंदी डैशबोर्ड (Hindi Dashboard)</strong><br><img src="docs/screenshots/hindi-dashboard.png" width="100%"></td>
    <td width="50%" align="center"><strong>इतिहास लॉग (Hindi History)</strong><br><img src="docs/screenshots/hindi-history.png" width="100%"></td>
  </tr>
  <tr>
    <td width="50%" align="center"><strong>सत्यापन रिपोर्ट (Hindi Reports)</strong><br><img src="docs/screenshots/hindi-reports.png" width="100%"></td>
    <td width="50%" align="center"><strong>सामान्य सेटिंग्स (Hindi Settings)</strong><br><img src="docs/screenshots/hindi-settings.png" width="100%"></td>
  </tr>
</table>
<p align="center">
  <strong>हिंदी प्रोफाइल (Hindi Profile)</strong><br>
  <img src="docs/screenshots/hindi-profile.png" width="60%">
</p>

---

## ⚙️ Installation & Setup

### Prerequisites
Before deploying the platform, ensure you have the following prerequisites
installed on your local development machine:
- **Node.js**: Version 18.0.0 or higher
- **NPM**: Version 9.0.0 or higher
- **MongoDB Connection Parameter**: Access to a MongoDB Atlas cluster or a
  local MongoDB community service

### Setup Instructions

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/mishraanshul870-lab/TruthShield-AI.git
   cd TruthShield-AI
   ```

2. **Backend Setup**:
   Navigate to the backend directory, install dependencies, configure environment
   parameters, and launch the service:
   ```bash
   cd backend
   npm install
   # Create and fill in your .env file using env variables guide
   npm run dev
   ```
   *Note: If no MONGODB_URI is provided, the backend falls back to local database-free JSON store modes.*

3. **Frontend Setup**:
   Open a separate terminal shell, navigate to the frontend directory, install
   dependencies, and launch:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Once loaded, open your browser and navigate to `http://localhost:5173`.

---

## 🔑 Environment Variables

Create and configure a backend `.env` file under `backend/.env`:
```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_jwt_token_secret
GEMINI_API_KEY=your_google_gemini_api_key_credentials
CLIENT_URL=http://localhost:5173
```
> **⚠️ Security Warning:** Never commit your `.env` file or API credential
> parameters to public repositories.

---

## 📂 Folder Structure

```text
TruthShield-AI/
├── backend/
│   ├── config/            # Database configurations & schema definitions
│   ├── controllers/       # Route handlers and core controllers
│   ├── middleware/        # JWT verifiers, Multer file filters, and rate-limiters
│   ├── uploads/           # Secured directory for temporary scan files
│   ├── utils/             # ELA logic, static frame extractors, and PDF generators
│   └── server.js          # Express server initialization gateway
├── frontend/
│   ├── public/            # Static assets and site index parameters
│   ├── src/
│   │   ├── components/    # Reusable UI widgets, navigation bars, and inputs
│   │   ├── i18n/          # Locales translations resource files (English & Hindi)
│   │   └── pages/         # Core pages (Dashboard, Scanners, Settings)
│   └── vite.config.js     # Vite configuration parameters
└── extension/             # Chrome Manifest V3 browser extension
```

---

## 🔌 API Overview

### Authentication Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Registers a new agent profile |
| **POST** | `/api/auth/login` | Validates credentials and returns a secure JWT token |
| **GET** | `/api/auth/profile` | Yields the active logged-in agent profile details |

### Investigation Endpoints
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **POST** | `/api/analyze/text` | Audits plaintext blocks and PDF uploads for credibility |
| **POST** | `/api/analyze/image` | Runs Error Level Analysis (ELA) and checks metadata |
| **POST** | `/api/analyze/video` | Decodes video streams for facial boundary alignment |
| **POST** | `/api/analyze/url` | Resolves WHOIS registers, SSL status, and reputations |

---

## 🧩 Browser Extension

**TruthShield AI** includes a Manifest V3 Chrome browser extension designed for
rapid domain credibility auditing. 

Users can save their active web portal JWT credentials inside the extension settings
panel. When browsing, a single click extracts the tab's current domain and verifies it
against the live TruthShield API registry, returning immediate trust ratings, warnings,
and safety indexes directly to the popup UI.

---

## 🤖 Explainable AI

The platform computes a detailed diagnostic reasoning block for every analysis.
By mapping claims against factual knowledge bases, metadata patterns, and forensic
alterations (such as image error levels or video boundary jitters), Google Gemini
compiles a natural-language description explaining the factors behind the verdict,
ensuring transparent audits.

---

## 🌍 Localization

The application features full dual-language translation support for English and
Hindi managed dynamically through `react-i18next`. 

Localization goes beyond basic interface elements, extending to dynamic loader prompts,
scan confidence scales, explainable AI dossiers, and compiled PDF downloads. This
ensures that users receive identical investigation reports in their chosen language.

---

## 🚀 Future Roadmap

- [ ] 🎙️ **Audio Forensics**: Add audio track processing to locate voice cloning signatures.
- [ ] ☁️ **Cloud Storage**: Migrate temporary file storage to secure AWS S3 buckets.
- [ ] 🌐 **Additional Languages**: Integrate support for Spanish, German, and Arabic.
- [ ] 📈 **Performance Workers**: Utilize worker threads to speed up Error Level Analysis.

---

## 🤝 Contributing

We welcome structural improvements, translations, and bugs alerts. Please read
`CONTRIBUTING.md` for guidelines on submitting issues, feature requests, or pull requests. 

1. Fork the Repository
2. Create a Feature Branch (`git checkout -b feature/new-module`)
3. Commit your changes (`git commit -m 'Add new scanner engine'`)
4. Push to origin (`git push origin feature/new-module`)
5. Open a Pull Request for code review

---

## 👨‍💻 Developer

<div align="center">
  <img src="docs/assets/logo.png" width="80" alt="TruthShield AI Logo">
  <h3>Anshul Mishra</h3>
  <p><strong>B.Tech Computer Science Engineering</strong></p>
  <p><em>AI • Cybersecurity • Full Stack Developer</em></p>
  <p>💼 Open to Internship and Placement Opportunities</p>
</div>

---

## 📜 License

This project is licensed under the MIT License. See `LICENSE` for complete details.

---

## 📊 GitHub Statistics

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=mishraanshul870-lab&show_icons=true&theme=radical" alt="GitHub Stats" width="48%">
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=mishraanshul870-lab&layout=compact&theme=radical" alt="Top Langs" width="48%">
</p>
<p align="center">
  <img src="https://github-readme-streak-stats.herokuapp.com/?user=mishraanshul870-lab&theme=radical" alt="GitHub Streak" width="97%">
</p>

---

## 📈 Visitor Counter

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=mishraanshul870-lab&color=blueviolet&style=flat-square" alt="Visitor Counter">
</p>

---

<div align="center">
  <p>⭐ If you like this project, please consider giving it a Star.</p>
  <p>Made with ❤️ by <strong>Anshul Mishra</strong></p>
</div>