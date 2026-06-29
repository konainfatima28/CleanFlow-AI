<div align="center">

# 🚀 CleanFlow AI

### Intelligent Data Cleaning & Analytics Platform

Transform messy datasets into clean, analysis-ready data using automated profiling, intelligent cleaning recommendations, interactive visual analytics, and reproducible export pipelines.

<p>

<img src="https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python"/>
<img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi"/>
<img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react"/>
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript"/>
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite"/>
<img src="https://img.shields.io/badge/Pandas-150458?style=for-the-badge&logo=pandas"/>
<img src="https://img.shields.io/badge/License-MIT-success?style=for-the-badge"/>

</p>

**Live Demo:** *(Coming Soon)*

**Documentation:** *(Coming Soon)*

**Report Issues:** GitHub Issues

</div>

---

# 📖 Overview

CleanFlow AI is an end-to-end data preprocessing platform designed to automate one of the most time-consuming stages of every data science, machine learning, and analytics project: **data cleaning**.

Real-world datasets are rarely clean. They often contain missing values, duplicate rows, inconsistent formatting, invalid data types, whitespace issues, outliers, and other quality problems that directly impact downstream analysis and model performance.

CleanFlow AI provides an intelligent workflow that enables users to:

- Upload CSV and Excel datasets
- Generate detailed data quality profiles
- Detect common data quality issues automatically
- Receive AI-inspired cleaning recommendations
- Apply one-click cleaning operations
- Compare dataset quality before and after cleaning
- Visualize distributions, missing values, correlations, and outliers
- Export cleaned datasets and reproducible Python scripts

The platform combines a modern React frontend with a FastAPI backend and the Pandas ecosystem to provide a responsive, interactive, and scalable data cleaning experience.

---

# ✨ Why CleanFlow AI?

Data preparation typically consumes **60–80%** of the total time spent on data science projects.

Instead of manually writing preprocessing scripts, analysts can upload a dataset and allow CleanFlow AI to:

✔ Profile the data

✔ Detect quality issues

✔ Recommend cleaning operations

✔ Execute transformations

✔ Generate analytics

✔ Export reproducible cleaning pipelines

This significantly reduces manual effort while improving transparency and reproducibility.

---

# 🎯 Key Features

## 📂 Smart Dataset Upload

CleanFlow AI supports both CSV and Microsoft Excel datasets.

Features include:

- Drag-and-drop upload
- Session-based processing
- Large dataset handling
- Automatic schema detection
- File validation
- Secure temporary storage

---

## 📊 Intelligent Dataset Profiling

Immediately after upload, the platform generates a comprehensive profile containing:

- Number of rows
- Number of columns
- Memory usage
- Missing values
- Missing percentage
- Duplicate rows
- Numeric vs categorical columns
- Data completeness
- Overall quality score
- Per-column statistics

For numerical data:

- Minimum
- Maximum
- Mean
- Median
- Standard deviation

For categorical data:

- Unique values
- Top occurring values
- Frequency distribution

---

## 🤖 AI Cleaning Suggestions

Instead of blindly cleaning the dataset, CleanFlow AI first analyzes it and generates ranked recommendations.

Each recommendation contains:

- Problem detected
- Reason
- Expected impact
- Number of affected rows
- Preview examples
- Suggested cleaning operation

Current supported recommendations include:

- Missing values
- Duplicate rows
- Duplicate columns
- Empty columns
- Empty rows
- Invalid numeric values
- Invalid dates
- Mixed capitalization
- Whitespace inconsistencies
- Outlier detection
- Type conversion
- Memory optimization

---

## 🧹 One-Click Cleaning

Users may apply:

- Individual operations
- Multiple operations
- Entire cleaning pipeline

Each operation is logged and can later be exported as a reproducible Pandas script.

---

## 📈 Interactive Analytics Dashboard

The analytics engine transforms cleaned datasets into visual insights.

Available visualizations include:

- Histograms
- Frequency distributions
- Missing-value heatmaps
- Correlation matrix
- Outlier summary
- Before/After comparison
- Dataset quality improvements

---

## 📤 Multi-format Export

Every cleaned dataset can be exported as:

- CSV
- XLSX
- JSON
- Markdown Report
- Auto-generated Pandas Script

This allows every cleaning operation to be reproduced outside the application.

---

# 🏗 System Architecture

```text
                    +----------------------+
                    |      React UI        |
                    |   (Vite + TS)        |
                    +----------+-----------+
                               |
                               |
                     REST API (Axios)
                               |
                               ▼
                  +------------------------+
                  |     FastAPI Server     |
                  +-----------+------------+
                              |
      +-----------------------+----------------------+
      |                       |                      |
      ▼                       ▼                      ▼
 Data Profiling        Cleaning Engine      Analytics Engine
      |                       |                      |
      +-----------+-----------+----------------------+
                  |
                  ▼
           Export Engine
                  |
      +-----------+-----------+
      |           |           |
      ▼           ▼           ▼
     CSV        Excel       JSON
                  |
                  ▼
      Markdown Report + Pandas Script
```

---

# 🔄 Complete Workflow

```text
Dataset Upload
      │
      ▼
Automatic Profiling
      │
      ▼
AI Suggestions
      │
      ▼
Cleaning Pipeline
      │
      ▼
Analytics Dashboard
      │
      ▼
Export Results
```

---

# 📸 Screenshots

> Add screenshots after deployment.

| Page | Preview |
|------|---------|
| Landing Page | `/screenshots/landing.png` |
| Upload | `/screenshots/upload.png` |
| Dataset Profile | `/screenshots/profile.png` |
| Cleaning Suggestions | `/screenshots/cleaning.png` |
| Analytics | `/screenshots/analytics.png` |
| Export | `/screenshots/export.png` |

---
