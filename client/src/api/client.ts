import type { Project, Job, Artifact, QCFlag } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  return response.json();
}

export const api = {
  projects: {
    list: (): Promise<Project[]> => request('/projects'),

    get: (id: string): Promise<Project> => request(`/projects/${id}`),

    create: (name: string): Promise<Project> =>
      request(`/projects?name=${encodeURIComponent(name)}`, { method: 'POST' }),

    update: (id: string, name: string): Promise<Project> =>
      request(`/projects/${id}?name=${encodeURIComponent(name)}`, { method: 'PUT' }),
  },

  uploads: {
    upload: async (projectId: string, files: File[]): Promise<{ upload_id: string }> => {
      const formData = new FormData();
      formData.append('project_id', projectId);
      files.forEach((file) => formData.append('files', file));

      const url = `${API_BASE}/uploads`;
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Upload error ${response.status}: ${errorText}`);
      }

      return response.json();
    },
  },

  jobs: {
    list: (projectId?: string): Promise<Job[]> =>
      request(`/jobs${projectId ? `?projectId=${projectId}` : ''}`),

    get: (id: string): Promise<Job> => request(`/jobs/${id}`),

    create: (projectId: string, projectName: string, uploadId?: string): Promise<Job> => {
      const params = new URLSearchParams({ projectId, projectName });
      if (uploadId) params.append('upload_id', uploadId);
      return request(`/jobs?${params.toString()}`, { method: 'POST' });
    },

    rerun: (id: string): Promise<Job> =>
      request(`/jobs/${id}/rerun`, { method: 'POST' }),

    getResults: (jobId: string): Promise<Record<string, string | null>> =>
      request(`/jobs/${jobId}/results`),

    getQCFlags: (jobId: string): Promise<QCFlag[]> =>
      request(`/jobs/${jobId}/qc-flags`),

    getGISOutputs: (jobId: string): Promise<string[]> =>
      request(`/jobs/${jobId}/gis`),
  },

  reports: {
    generate: (jobId: string): Promise<{ artifact_id: string; blob_path: string }> =>
      request(`/reports/${jobId}`, { method: 'POST' }),

    list: (): Promise<Artifact[]> => request('/reports'),
  },
};
