import type {
  Project, Job, Artifact, QCFlag,
  AOProject, Employee, ReportRequest, PreviewResponse, GenerateResponse,
  GrippFilesGrouped,
} from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

function authHeaders(): Record<string, string> {
  const pwd = localStorage.getItem('api_password') || '';
  return pwd ? { 'X-API-Password': pwd } : {};
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options?.headers,
    },
  });

  if (response.status === 401) {
    localStorage.removeItem('api_password');
    localStorage.removeItem('auth_user');
    window.location.href = '/login';
    throw new Error('Not authenticated');
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (password: string): Promise<{ ok: boolean; api_password: string }> =>
      fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      }).then(async r => {
        if (!r.ok) throw new Error(`Login failed: ${r.status}`);
        return r.json();
      }),
  },

  projects: {
    list:   (): Promise<Project[]> => request('/projects'),
    get:    (id: string): Promise<Project> => request(`/projects/${id}`),
    create: (name: string): Promise<Project> =>
      request(`/projects?name=${encodeURIComponent(name)}`, { method: 'POST' }),
    update: (id: string, name: string): Promise<Project> =>
      request(`/projects/${id}?name=${encodeURIComponent(name)}`, { method: 'PUT' }),
  },

  uploads: {
    upload: async (projectId: string, files: File[]): Promise<{ upload_id: string }> => {
      const formData = new FormData();
      formData.append('project_id', projectId);
      files.forEach(f => formData.append('files', f));
      const r = await fetch(`${API_BASE}/uploads`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      if (!r.ok) throw new Error(`Upload error ${r.status}: ${await r.text()}`);
      return r.json();
    },
  },

  jobs: {
    list:         (projectId?: string): Promise<Job[]> =>
      request(`/jobs${projectId ? `?projectId=${projectId}` : ''}`),
    get:          (id: string): Promise<Job> => request(`/jobs/${id}`),
    create:       (projectId: string, projectName: string, uploadId?: string): Promise<Job> => {
      const params = new URLSearchParams({ projectId, projectName });
      if (uploadId) params.append('upload_id', uploadId);
      return request(`/jobs?${params.toString()}`, { method: 'POST' });
    },
    rerun:        (id: string): Promise<Job> => request(`/jobs/${id}/rerun`, { method: 'POST' }),
    getResults:   (jobId: string): Promise<Record<string, string | null>> => request(`/jobs/${jobId}/results`),
    getQCFlags:   (jobId: string): Promise<QCFlag[]> => request(`/jobs/${jobId}/qc-flags`),
    getGISOutputs:(jobId: string): Promise<string[]> => request(`/jobs/${jobId}/gis`),
  },

  reports: {
    generate: (jobId: string): Promise<{ artifact_id: string; blob_path: string }> =>
      request(`/reports/${jobId}`, { method: 'POST' }),
    list: (): Promise<Artifact[]> => request('/reports'),
  },

  aoReport: {
    listProjects:    (): Promise<AOProject[]> => request('/ao-report/projects'),
    listEmployees:   (): Promise<Employee[]>  => request('/ao-report/employees'),
    getProject:      (quotaId: number): Promise<Record<string, unknown>> =>
                       request(`/ao-report/projects/${quotaId}`),
    preview:         (req: ReportRequest): Promise<PreviewResponse> =>
                       request('/ao-report/preview',  { method: 'POST', body: JSON.stringify(req) }),
    generate:        (req: ReportRequest): Promise<GenerateResponse> =>
                       request('/ao-report/generate', { method: 'POST', body: JSON.stringify(req) }),
    downloadUrl:     (artifactId: string): string =>
                       `${API_BASE}/ao-report/download/${artifactId}`,
    invalidateCache: (): Promise<{ detail: string }> =>
                       request('/ao-report/cache/invalidate', { method: 'DELETE' }),
  },

  grippAdmin: {
    listFiles:  (): Promise<GrippFilesGrouped> => request('/gripp-admin/files'),
    upload: async (files: File[]): Promise<{ saved: unknown[]; errors: unknown[] }> => {
      const fd = new FormData();
      files.forEach(f => fd.append('files', f));
      const r = await fetch(`${API_BASE}/gripp-admin/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });
      if (!r.ok) throw new Error(`Upload error ${r.status}: ${await r.text()}`);
      return r.json();
    },
    deleteFile: (blobName: string): Promise<{ deleted: string }> =>
      request(`/gripp-admin/files/${encodeURIComponent(blobName)}`, { method: 'DELETE' }),
  },
};
