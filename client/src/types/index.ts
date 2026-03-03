export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'analyst' | 'viewer';
}

export interface Project {
  id: string;
  name: string;
  created_at: string;
}

export interface Upload {
  id: string;
  project_id: string;
  created_at: string;
  files: Array<{ filename: string; blob_path: string }>;
}

export type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';

export interface Job {
  id: string;
  project_id: string;
  project_name: string | null;
  upload_id: string | null;
  status: JobStatus;
  started_at: string | null;
  completed_at: string | null;
  logs: string[];
  outputs: Record<string, string | null> | null;
  qc_flags: QCFlag[] | null;
  gis_outputs: string[] | null;
}

export interface QCFlag {
  flag_type: string;
  reason: string;
  veldbezoek_id?: string;
  status?: 'OPEN' | 'APPROVED' | 'OVERRIDDEN';
  comment?: string | null;
  resolved_by?: string | null;
  resolved_at?: string | null;
}

export interface Artifact {
  id: string;
  job_id: string;
  artifact_type: string;
  blob_path: string;
  format: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
