import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get('/projects', async (_req, res) => {
    res.json([]);
  });

  app.get('/projects/:id', async (req, res) => {
    res.status(404).json({ error: 'Project not found' });
  });

  app.post('/projects', async (req, res) => {
    const name = req.query.name as string || 'New Project';
    res.json({
      id: `proj-${Date.now()}`,
      name,
      created_at: new Date().toISOString(),
    });
  });

  app.put('/projects/:id', async (req, res) => {
    const name = req.query.name as string || '';
    res.json({
      id: req.params.id,
      name,
      created_at: new Date().toISOString(),
    });
  });

  app.post('/uploads', async (_req, res) => {
    res.json({
      upload_id: `upl-${Date.now()}`,
    });
  });

  app.get('/jobs', async (_req, res) => {
    res.json([]);
  });

  app.get('/jobs/:id', async (req, res) => {
    res.status(404).json({ error: 'Job not found' });
  });

  app.post('/jobs', async (req, res) => {
    const projectId = req.query.projectId as string;
    const projectName = req.query.projectName as string;
    const uploadId = req.query.upload_id as string;
    res.json({
      id: `job-${Date.now()}`,
      project_id: projectId,
      project_name: projectName || 'Project',
      upload_id: uploadId || null,
      status: 'PENDING',
      started_at: null,
      completed_at: null,
      logs: [],
      outputs: null,
      qc_flags: null,
      gis_outputs: null,
    });
  });

  app.post('/jobs/:id/rerun', async (req, res) => {
    res.json({
      id: req.params.id,
      project_id: null,
      project_name: null,
      upload_id: null,
      status: 'PENDING',
      started_at: null,
      completed_at: null,
      logs: [],
      outputs: null,
      qc_flags: null,
      gis_outputs: null,
    });
  });

  app.get('/jobs/:id/results', async (_req, res) => {
    res.json({});
  });

  app.get('/jobs/:id/qc-flags', async (_req, res) => {
    res.json([]);
  });

  app.get('/jobs/:id/gis', async (_req, res) => {
    res.json([]);
  });

  app.post('/reports/:jobId', async (req, res) => {
    res.json({
      artifact_id: `art-${Date.now()}`,
      blob_path: `reports/${req.params.jobId}/report.docx`,
    });
  });

  app.get('/reports', async (_req, res) => {
    res.json([]);
  });

  return httpServer;
}
