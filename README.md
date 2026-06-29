# 🚀 CleanFlow AI

<div align="center">

![Python](https://img.shields.io/badge/Python-3.12-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite)
![Pandas](https://img.shields.io/badge/Pandas-Data%20Processing-150458?style=for-the-badge&logo=pandas)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

### AI-powered Data Cleaning & Analytics Platform

Upload any CSV or Excel dataset, automatically detect data quality issues, apply intelligent cleaning operations, visualize analytics, and export cleaned datasets with reproducible Python scripts.

</div>

---

# ✨ Features

## 📂 Dataset Upload

- Upload CSV and Excel files
- Large dataset support
- Secure session-based processing
- Automatic schema detection

---

## 📊 Dataset Profiling

Generate a complete dataset profile including:

- Dataset dimensions
- Data types
- Missing values
- Duplicate rows
- Memory usage
- Completeness score
- Quality score
- Numeric statistics
- Top categorical values

---

## 🤖 AI Cleaning Suggestions

Automatically detects:

- Missing values
- Duplicate rows
- Empty columns
- Empty rows
- Mixed data types
- Invalid numeric values
- Date inconsistencies
- Capitalization issues
- Whitespace problems
- Outliers
- Duplicate column names

Each suggestion includes:

- Priority
- Reason
- Expected impact
- Preview
- Rows affected

---

## 🧹 One-Click Cleaning

Supports automatic cleaning operations:

- Fill missing values
- Remove duplicates
- Trim whitespace
- Standardize text
- Convert data types
- Remove empty rows
- Remove empty columns
- Rename duplicate columns
- Handle outliers
- Format dates
- Normalize categorical values

---

## 📈 Interactive Analytics

Includes beautiful dashboards powered by Recharts.

### Dataset Distribution

- Histograms
- Bar charts
- Numeric summaries

### Missing Value Heatmap

- Missing cells visualization
- Missing values by column

### Correlation Matrix

- Pearson correlation
- Heatmap visualization

### Outlier Analysis

- IQR detection
- Outlier percentage
- Lower & upper bounds

### Before vs After Comparison

- Quality score
- Missing values fixed
- Memory saved
- Duplicate removal
- Completeness improvement

---

## 📤 Export Options

Export cleaned data as:

- CSV
- Excel (.xlsx)
- JSON
- Auto-generated Pandas Script
- Markdown Cleaning Report

---

# 🛠 Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- Axios

---

## Backend

- FastAPI
- Pandas
- NumPy
- OpenPyXL
- Uvicorn

---

# 📁 Project Structure

```
CleanFlow-AI/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── services/
│   │   ├── models/
│   │   ├── utils/
│   │   └── core/
│   │
│   ├── main.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

# ⚙ Installation

## 1. Clone Repository

```bash
git clone https://github.com/yourusername/cleanflow-ai.git

cd cleanflow-ai
```

---

## 2. Backend Setup

```bash
cd backend

python -m venv venv
```

Windows

```bash
venv\Scripts\activate
```

Linux/Mac

```bash
source venv/bin/activate
```

Install packages

```bash
pip install -r requirements.txt
```

Run backend

```bash
uvicorn main:app --reload
```

Backend runs at

```
http://localhost:8000
```

---

## 3. Frontend Setup

```bash
cd frontend

npm install
```

Run

```bash
npm run dev
```

Frontend runs at

```
http://localhost:5173
```

---

# 📸 Screenshots

Add screenshots here.

Example:

```
screenshots/

upload.png

profile.png

cleaning.png

analytics.png

export.png
```

---

# 🚀 Deployment

## Frontend

Deploy on

- Vercel
- Netlify

## Backend

Deploy on

- Render
- Railway
- Fly.io

---

# 📊 Example Workflow

```
Upload Dataset
        │
        ▼
Profile Dataset
        │
        ▼
Generate AI Suggestions
        │
        ▼
Apply Cleaning
        │
        ▼
View Analytics
        │
        ▼
Export Clean Dataset
```

---

# 🎯 Future Improvements

- AI-powered cleaning recommendations using LLMs
- PDF profiling
- SQL database support
- Cloud storage integration
- Dataset versioning
- Team collaboration
- Automated ML preprocessing
- Data validation rules
- Pipeline builder
- Scheduled cleaning jobs

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository

2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit changes

```bash
git commit -m "Added new feature"
```

4. Push

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Konain Fatima**

B.Tech AI & ML Student

Building AI-powered developer tools and data engineering solutions.

GitHub: https://github.com/yourusername

LinkedIn: https://linkedin.com/in/yourprofile

---

# ⭐ Support

If you found this project useful,

⭐ Star the repository

🍴 Fork it

💡 Open Issues

🚀 Share with others

---

<div align="center">

### Built with ❤️ using FastAPI, React & Pandas

**CleanFlow AI**

AI-powered data cleaning made simple.

</div>
