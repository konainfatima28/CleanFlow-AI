# CleanFlow AI — AI-Powered Data Cleaning Platform

<div align="center">

<img src="https://raw.githubusercontent.com/konainfatima28/CleanFlow-AI/main/frontend/src/assets/cleanflow.png" alt="CleanFlow AI" width="200"/>

**Transform messy datasets into ML-ready data in seconds — no Python required.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org)
[![Pandas](https://img.shields.io/badge/Pandas-2.2-150458?style=flat-square&logo=pandas)](https://pandas.pydata.org)
[![XlsxWriter](https://img.shields.io/badge/XlsxWriter-Stream-blue?style=flat-square)](https://xlsxwriter.readthedocs.io/)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/API-Render-46E3B7?style=flat-square&logo=render)](https://render.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[🚀 Live Demo](https://do-cleanflow-ai.vercel.app/) &nbsp;·&nbsp; [📖 API Docs](#api-documentation) &nbsp;·&nbsp; [🐛 Report Bug](issues) &nbsp;·&nbsp; [✨ Request Feature](issues)

</div>

---

## 📌 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Screenshots](#-screenshots)
- [Performance & Optimisations](#-performance--optimisations)
- [Deployment](#-deployment)
- [Future Scope](#-future-scope)
- [Skills Demonstrated](#-skills-demonstrated)
- [Author](#-author)

---

## 🧠 Overview

**CleanFlow AI** is a full-stack, browser-based data preparation platform built with **React**, **TypeScript**, and **FastAPI**. It automates the most tedious part of any data science or machine learning workflow — data cleaning.

Upload a CSV or Excel file and get:

- An instant **data quality score** (0–100)
- Ranked **cleaning suggestions** with one-click apply
- **Visual analytics** — distributions, heatmaps, correlation matrix, outlier detection
- A **before/after comparison** of every metric
- Downloadable exports in **CSV, XLSX, JSON**, plus an **auto-generated Pandas script** that reproduces every operation

> Built as a final-year B.Tech CSE (AI/ML) capstone project at Jagannath University (2022–2026).

---

## ✨ Features

### 📂 Dataset Upload
- Drag & drop or browse for **CSV** and **XLSX** files
- Upload progress animation with state transitions
- Files up to **50 MB** supported
- Privacy-first: data processed in memory, never stored

### 📊 Automatic Data Profiling
| Metric | Description |
|--------|-------------|
| Quality Score | 0–100 composite score across 3 dimensions |
| Missing Values | Count + percentage per column |
| Duplicate Rows | Exact row match detection |
| Memory Usage | Real-time in-memory footprint |
| Column Types | Auto-detected: numeric, string, datetime, boolean |
| Completeness | Per-column and dataset-wide |

### 🤖 AI Cleaning Suggestions (13 operations)
Each suggestion includes a problem description, reason, impact level (High / Medium / Low), affected row count, and sample values.

| Operation | Description |
|-----------|-------------|
| Remove Duplicates | Exact row deduplication |
| Fill Missing Values | Mean / Median / Mode / Forward fill / Custom |
| Trim Whitespace | Leading and trailing space removal |
| Standardise Case | Title / Lower / Upper / Sentence |
| Convert Types | Numeric, datetime, boolean, string coercion |
| Remove Empty Rows/Cols | Fully null row and column removal |
| Flag Outliers | IQR-based detection with flag column |
| Validate Emails | Regex-based email format validation |
| Rename Duplicate Columns | Auto-suffix conflicting column names |
| Remove Constant Columns | Zero-variance column detection |

### 📈 Visual Analytics
- **Distributions** — Histograms (numeric) + frequency bars (categorical), paginated
- **Missing Heatmap** — Pixel grid showing exactly which cells are null
- **Correlation Matrix** — Pearson r coloured from red (−1) to green (+1)
- **Outlier Summary** — IQR bounds, outlier count, and safe range per column
- **Before/After** — Radar chart overlay + metric diff table (only after cleaning)

### 📤 Export Options
| Format | Description |
|--------|-------------|
| `.csv` | Universal flat file |
| `.xlsx` | High-speed structured Excel sheet without formatting blocks |
| `.json` | Records array for APIs and databases |
| `.py` | Auto-generated Pandas script reproducing every step |
| `.md` | Markdown cleaning report with before/after stats |

---

## 🛠 Tech Stack

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| TypeScript | 5 | Type safety |
| Vite | 5 | Build tool |
| Tailwind CSS | 3 | Utility styling |
| Framer Motion | 11 | Animations |
| Recharts | 2 | Data visualisation |
| TanStack Table | 8 | Column table with sorting/filtering |
| React Dropzone | 14 | File upload UX |
| Axios | 1 | HTTP client |

### Backend
| Tool | Version | Purpose |
|------|---------|---------|
| FastAPI | 0.111 | REST API framework |
| Python | 3.11 / 3.14 | Core language engine |
| Pandas | 2.2 / 3.0+ | Data processing engine |
| NumPy | 1.26 | Numeric operations |
| XlsxWriter | Latest | Low-memory stream Excel compiler |
| OpenPyXL | 3.1 | Core workbook workbook interface |
| Uvicorn | 0.29 | ASGI server |

### Deployment
| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting + CDN |
| Render | Backend API hosting |

---

## 🏗 Architecture

Browser (React + TypeScript)
│
│  HTTP / REST
▼
FastAPI Application (Uvicorn)
│
┌────┴─────────────────────┐
│                          │
▼                          ▼
Route Layer               Session Store
/upload                  (in-memory)
/profile                     │
/suggestions             DataFrame
/clean                  per session
/analytics                   │
/export                      ▼
│                    Service Layer
└──────────────────►  profiler.py
suggestions.py
cleaner.py
analytics.py
exporter.py


### Data Flow

Upload CSV/XLSX
│
▼
Parse → Store in session (UUID)
│
▼
Profile → Quality score + column stats
│
▼
Suggestions → Ranked list of issues
│
▼
Clean → Apply operations → New session
│
▼
Analytics → Charts data (distributions, correlation, outliers)
│
▼
Export → CSV / XLSX / JSON / .py / .md


---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- npm or yarn

### 1. Clone the repository
```bash
git clone [https://github.com/konainfatima28/cleanflow-ai.git](https://github.com/konainfatima28/cleanflow-ai.git)
cd cleanflow-ai
2. Backend setup
Bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload
# API running at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
3. Frontend setup
Bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:8000/api" > .env.development

# Start dev server
npm run dev
# App running at http://localhost:5173
4. Open the app
Navigate to http://localhost:5173 and upload any CSV or XLSX file.
```

📁 Project Structure
cleanflow-ai/
│
├── backend/
│   ├── main.py                        # FastAPI app + CORS + route registration
│   ├── requirements.txt
│   ├── render.yaml                    # Render deployment config
│   └── app/
│       ├── api/
│       │   └── routes/
│       │       ├── upload.py          # POST /api/upload/
│       │       ├── profile.py         # GET  /api/profile/{session_id}
│       │       ├── suggestions.py     # GET  /api/suggestions/{session_id}
│       │       ├── clean.py           # POST /api/clean/{session_id}
│       │       ├── analytics.py       # GET  /api/analytics/{session_id}
│       │       └── export.py          # GET  /api/export/{session_id}
│       ├── core/
│       │   └── session.py             # In-memory session store
│       └── services/
│           ├── profiler.py            # Data quality scoring + column stats
│           ├── suggestions.py         # 13 issue detectors
│           ├── cleaner.py             # Operation executor + audit log
│           ├── analytics.py           # Chart data generators
│           └── exporter.py            # CSV/XLSX/JSON/Pandas/.md exporters
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── vercel.json                    # SPA rewrite rule
    └── src/
        ├── App.tsx                    # Router
        ├── main.tsx
        ├── index.css
        ├── pages/
        │   ├── Landing.tsx            # Marketing page with live demo grid
        │   └── Dashboard.tsx          # Main app shell + sidebar nav
        │   ├── FileUploader.tsx       # Drag & drop with 4 animated states
        │   ├── ProfilePanel.tsx       # Quality ring + KPI cards + column table
        │   ├── CleaningPanel.tsx      # Suggestion cards + bulk apply + log
        │   ├── AnalyticsPanel.tsx     # 5-tab visual analytics dashboard
        │   └── ExportPanel.tsx        # 5-format download panel
        └── services/
            └── api.ts                 # Axios API client

📖 API Documentation
Full interactive docs available at /docs (Swagger) and /redoc when running locally.

Endpoints
Method	Endpoint	Description
GET	/health	Health check
POST	/api/upload/	Upload CSV or XLSX file
GET	/api/profile/{session_id}	Get data quality profile
GET	/api/suggestions/{session_id}	Get ranked cleaning suggestions
POST	/api/clean/{session_id}	Apply cleaning operations
GET	/api/analytics/{session_id}	Get chart data
GET	/api/analytics/compare/{orig}/{cleaned}	Before/after comparison
GET	/api/export/{session_id}?format=csv	Download cleaned file
POST	/api/export/script/{session_id}	Download Pandas script
POST	/api/export/report/{session_id}	Download Markdown report
Example — Upload

```Bash
curl -X POST http://localhost:8000/api/upload/ \
  -F "file=@dataset.csv"
JSON
{
  "session_id": "973b47ef-cae7-4f39-8d46-d5d1035526d6",
  "filename": "dataset.csv",
  "rows": 8807,
  "columns": 12
}
Example — Apply cleaning
Bash
curl -X POST http://localhost:8000/api/clean/973b47ef... \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"type": "remove_duplicates"},
      {"type": "trim_whitespace"},
      {"type": "fill_missing", "column": "country", "strategy": "mode"}
    ]
  }'
```
📸 Screenshots
Upload your own screenshots to /assets/ and update the paths below.

Landing Page	Dashboard — Profile

Cleaning Suggestions	Visual Analytics

⚡ Performance & Optimisations
Large Dataset Engineering (100k+ Rows)
Scaling an application on free cloud computing architectures introduces tight memory and processing runtime constraints. During the optimization of large matrix conversions (such as the standard 119k+ row Hotel Booking Demand dataset), several full-stack infrastructure enhancements were made:

Multipart Boundary Alignment: Configured standard automated frontend file boundary mappings inside Axios, eliminating 422 Unprocessable Entity validation loops caused by hardcoded headers conflicting with multi-part stream blocks.

Sequential Row Streaming (xlsxwriter): Solved 502 Bad Gateway and 500 Internal Server Error crashes caused by openpyxl exceeding memory limitations. Rebuilt the route layout to utilize xlsxwriter in sequential text-flushing mode (constant_memory: True), lowering the active server container RAM footprint to a flat baseline regardless of row count.

Data Type Normalization Layer: Configured an in-memory sanitizer loop that drops complex numpy representations, replaces infinite metrics (inf/-inf), and maps object categories to text before passing sheets to XML compressors.

Statistical Profiling Caps: Embedded runtime sampling logic to route large matrices through an accurate 15,000 row representative slice during heavy markdown statistical generation, ensuring responses return in under 2 seconds and avoiding hard platform timeout drops.

Operational Phase	Speed Performance	Scale Boundary
Upload + Parsing	< 2s	Up to 50 MB
Profile Scoring	< 500ms	100,000+ Rows
Rule Evaluation	< 300ms	32+ Attributes
Compressed Export	< 1s	Stream-based

🌐 Deployment
Frontend — Vercel
Bash
cd frontend
# Set production API URL
echo "VITE_API_URL=[https://your-api.onrender.com/api](https://your-api.onrender.com/api)" > .env.production

# Push to GitHub, then connect repo on vercel.com
# Set Root Directory = frontend
Backend — Render
Bash
# Push backend/ to GitHub
# On render.com: New Web Service → connect repo
# Root Directory: backend
# Build Command: pip install -r requirements.txt
# Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT

# Add environment variable:
# ALLOWED_ORIGINS = [https://your-app.vercel.app](https://your-app.vercel.app)
🔭 Future Scope
[ ] Natural language cleaning commands ("Remove rows where Age < 18")

[ ] AI-powered anomaly detection using Isolation Forest

[ ] Automatic feature engineering suggestions

[ ] Dataset versioning and history

[ ] User authentication and saved sessions

[ ] Cloud storage integration (S3, Google Drive)

[ ] Background processing for 1M+ row datasets

[ ] Support for Parquet, Feather, XML, SQL formats

[ ] Real-time collaboration

[ ] Scheduled cleaning jobs via REST API

[ ] GPU-accelerated processing

[ ] Enterprise dashboard with team workspaces

🎯 Skills Demonstrated
Full-Stack Development     ████████████████████  React + FastAPI
Data Engineering           ████████████████████  Pandas + NumPy
REST API Design            ████████████████████  FastAPI + Pydantic
TypeScript                 ████████████████████  Strict typing
Data Visualisation         ██████████████████░░  Recharts
UI/UX Engineering          ████████████████████  Tailwind + Framer Motion
Python                     ████████████████████  Services + algorithms
Deployment                 █████████████████░░░  Vercel + Render
Performance Optimisation   ████████████████████  Stream writers + Chunking
Software Architecture      ████████████████████  Clean separation of concerns
👩‍💻 Author
Konain Fatima
B.Tech CSE (AI/ML) — Jagannath University

Specialising in Agentic AI, RAG systems, LangGraph, and production ML pipelines.

📄 License
This project is licensed under the MIT License — see the LICENSE file for details.

If this project helped you, please consider giving it a ⭐

Built with ❤️ using React, FastAPI, and Pandas
