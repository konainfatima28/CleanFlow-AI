# Project Name
$project = "cleanflow-ai"

# Folder Structure
$folders = @(
    "$project",
    "$project/backend",
    "$project/backend/app",
    "$project/backend/app/api",
    "$project/backend/app/api/routes",
    "$project/backend/app/core",
    "$project/backend/app/services",
    "$project/backend/app/models",
    "$project/backend/app/utils",
    "$project/backend/tests",

    "$project/frontend",
    "$project/frontend/src",
    "$project/frontend/src/components",
    "$project/frontend/src/pages",
    "$project/frontend/src/hooks",
    "$project/frontend/src/services",
    "$project/frontend/src/store",
    "$project/frontend/src/types",
    "$project/frontend/src/utils"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

# Files
$files = @(
    "$project/backend/main.py",
    "$project/backend/requirements.txt",

    "$project/frontend/index.html",
    "$project/frontend/package.json",

    "$project/README.md"
)

foreach ($file in $files) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

Write-Host ""
Write-Host "✅ CleanFlow-AI project structure created successfully!" -ForegroundColor Green