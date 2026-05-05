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

export interface AOProject {
  quota_id: number;
  project_name: string;
  city: string;
  type_project: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
}

export interface ReportRequest {
  quota_id: number;
  ao_author_id: number;
  ao_reviewer_id: number;
  ao_report_number: string;
  ao_report_date?: string;
  aantal_deelgebieden: number;
  aantal_grondgebonden_woningen?: number | null;
  aantal_gestapelde_woningen?: number | null;
  ecopotenties_panden?: string | null;
  ecopotenties_binnenomgeving?: string | null;
  ecopotenties_buitenomgeving?: string | null;
  qs_rapport_bedrijf?: string | null;
  qs_rapport_datum?: string | null;
  species_vrijstelling_provincie?: string | null;
  omgeving_key?: string | null;
  omgeving_custom?: string | null;
  ingreep_key?: string | null;
  ingreep_custom?: string | null;
}

export interface SnippetOption {
  key: string;
  preview: string;
  text: string;
}

export interface PreviewResponse {
  context: Record<string, string>;
  unfilled_placeholders: string[];
}

export interface GenerateResponse {
  artifact_id: string;
  blob_path: string;
  unfilled_placeholders: string[];
}

export interface GrippFilesGrouped {
  project_info: string[];
  client_company: string[];
  client_contact: string[];
  employees: string[];
  other: string[];
}
