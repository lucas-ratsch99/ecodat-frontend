# EcoData Platform - Ecology Data Processing

## Overview
A production-quality frontend web application for an ecology data-processing platform. The application provides a complete workflow for managing ecological surveys, processing observation data, running QC checks, and generating GIS outputs. Connects to a real Python FastAPI backend.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: wouter
- **Maps**: react-leaflet + Leaflet
- **State**: React Context + TanStack Query
- **Backend (Python, separate repo)**: FastAPI + SQLAlchemy + Azure Blob Storage

## Architecture
The frontend is a standalone SPA that communicates with a Python FastAPI backend. In development, Express stub routes mimic the backend responses. In production (Azure), `VITE_API_BASE_URL` points to the real Python backend.

### Backend API Endpoints (Python FastAPI)
- `GET /projects` - List projects
- `POST /projects?name=...` - Create project (query params, not JSON body)
- `PUT /projects/:id?name=...` - Update project
- `POST /uploads` - Upload CSV files (FormData: project_id, files[])
- `GET /jobs?projectId=...` - List jobs (optional project filter)
- `POST /jobs?projectId=...&projectName=...&upload_id=...` - Create job
- `POST /jobs/:id/rerun` - Rerun a failed job
- `GET /jobs/:id/results` - Get job output files
- `GET /jobs/:id/qc-flags` - Get QC flags
- `GET /jobs/:id/gis` - Get GIS output paths
- `POST /reports/:jobId` - Generate DOCX report
- `GET /reports` - List report artifacts

### Data Model (snake_case, matching Python backend)
- **Project**: `id`, `name`, `created_at`
- **Upload**: `id`, `project_id`, `created_at`, `files`
- **Job**: `id`, `project_id`, `project_name`, `upload_id`, `status` (PENDING|RUNNING|SUCCEEDED|FAILED), `started_at`, `completed_at`, `logs`, `outputs`, `qc_flags`, `gis_outputs`
- **Artifact**: `id`, `job_id`, `artifact_type`, `blob_path`, `format`, `metadata`, `created_at`
- **QCFlag** (embedded in Job): `flag_type`, `reason`, `veldbezoek_id`, `status`, `comment`

### Auth
Authentication is client-side only (localStorage). The Python backend does not have auth endpoints. Future work: add Azure AD / JWT auth.

## Project Structure
```
client/src/
├── api/
│   └── client.ts          # API client (real backend HTTP calls)
├── components/
│   └── layout/
│       ├── AppSidebar.tsx  # Main navigation sidebar
│       └── Topbar.tsx      # Top header with project selector
├── context/
│   ├── AuthContext.tsx     # Authentication state (client-side)
│   └── ProjectContext.tsx  # Active project state
├── pages/
│   ├── Login.tsx           # Login page
│   ├── Projects.tsx        # Project management
│   ├── UploadRun.tsx       # File upload & pipeline runner
│   ├── Jobs.tsx            # Job history list
│   ├── Results.tsx         # Job results with output files
│   ├── QC.tsx              # QC flag review
│   ├── GIS.tsx             # Map preview with Leaflet
│   ├── Reports.tsx         # Report generation
│   └── Admin.tsx           # System administration
├── types/
│   └── index.ts            # TypeScript interfaces (snake_case matching backend)
└── utils/
    └── safeName.ts         # Utility functions
server/
├── index.ts                # Express server entry
├── routes.ts               # Dev stub routes (mimic Python backend)
├── vite.ts                 # Vite dev server middleware
└── storage.ts              # Storage interface (unused in dev)
```

## Environment Variables
- `VITE_API_BASE_URL` - Backend API base URL (empty in dev = same-origin Express stubs; in production = Python backend URL)

## Routes
- `/login` - Authentication
- `/projects` - Project list and management
- `/upload-run` - Upload CSV files and run pipeline
- `/jobs` - View all pipeline jobs
- `/results/:jobId` - Job results with output file listing
- `/qc/:jobId` - QC flag review
- `/gis/:jobId` - Interactive map preview
- `/reports` - Generate and download reports
- `/admin` - System health and settings

## Running the Application
```bash
npm run dev
```

## User Preferences
- Professional, data-dense UI suitable for scientific workflows
- Blue color scheme (#2563eb) for primary actions
- Dark sidebar navigation
- Inter font for UI, JetBrains Mono for code/data
- Material Design 3 aesthetic
