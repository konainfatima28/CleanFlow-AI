# CleanFlow AI — AI-Powered Data Cleaning Platform

<div align="center">

![CleanFlow AI Banner](https://img.shields.io/badge/CleanFlow-AI-6366f1?style=for-the-badge&logo=sparkles&logoColor=white)

**Transform messy datasets into ML-ready data in seconds — no Python required.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python)](https://python.org)
[![Pandas](https://img.shields.io/badge/Pandas-2.2-150458?style=flat-square&logo=pandas)](https://pandas.pydata.org)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![Render](https://img.shields.io/badge/API-Render-46E3B7?style=flat-square&logo=render)](https://render.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[🚀 Live Demo](#) &nbsp;·&nbsp; [📖 API Docs](#api-documentation) &nbsp;·&nbsp; [🐛 Report Bug](issues) &nbsp;·&nbsp; [✨ Request Feature](issues)

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
- [Performance](#-performance)
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
| `.xlsx` | Auto-formatted Excel with column widths |
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
| Python | 3.11 | Core language |
| Pandas | 2.2 | Data processing engine |
| NumPy | 1.26 | Numeric operations |
| OpenPyXL | 3.1 | Excel read/write |
| Uvicorn | 0.29 | ASGI server |

### Deployment

| Service | Purpose |
|---------|---------|
| Vercel | Frontend hosting + CDN |
| Render | Backend API hosting |

---

## 🏗 Architecture
