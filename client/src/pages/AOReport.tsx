import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { ReportRequest, PreviewResponse, GenerateResponse, SnippetOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { FileText, Eye, Download, AlertTriangle, RefreshCw } from 'lucide-react';

const CUSTOM_KEY = '__custom__';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultReportNumber(): string {
  return `${new Date().getFullYear()}_130000_00_AO_01`;
}

const emptyForm = (): ReportRequest => ({
  quota_id: 0,
  ao_author_id: 0,
  ao_reviewer_id: 0,
  ao_report_number: defaultReportNumber(),
  ao_report_date: today(),
  aantal_deelgebieden: 1,
  aantal_grondgebonden_woningen: null,
  aantal_gestapelde_woningen: null,
  ecopotenties_panden: null,
  ecopotenties_binnenomgeving: null,
  ecopotenties_buitenomgeving: null,
  qs_rapport_bedrijf: null,
  qs_rapport_datum: null,
  species_vrijstelling_provincie: null,
  omgeving_key: null,
  omgeving_custom: null,
  ingreep_key: null,
  ingreep_custom: null,
});

/* ------------------------------------------------------------------ */
/* Reusable snippet-dropdown component                                  */
/* ------------------------------------------------------------------ */
interface SnippetFieldProps {
  label: string;
  snippets: SnippetOption[] | undefined;
  isLoading: boolean;
  selectedKey: string | null | undefined;
  customText: string | null | undefined;
  onKeyChange: (key: string | null) => void;
  onCustomChange: (text: string | null) => void;
  testIdPrefix: string;
}

function SnippetField({
  label,
  snippets,
  isLoading,
  selectedKey,
  customText,
  onKeyChange,
  onCustomChange,
  testIdPrefix,
}: SnippetFieldProps) {
  const isCustom = selectedKey === null && customText !== null;
  const selectValue = isCustom ? CUSTOM_KEY : (selectedKey ?? '');
  const fullText = snippets?.find(s => s.key === selectedKey)?.text;

  function handleSelect(value: string) {
    if (value === CUSTOM_KEY) {
      onKeyChange(null);
      onCustomChange(customText ?? '');
    } else {
      onKeyChange(value);
      onCustomChange(null);
    }
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {isLoading ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <Select value={selectValue} onValueChange={handleSelect}>
          <SelectTrigger data-testid={`${testIdPrefix}-trigger`}>
            <SelectValue placeholder="Pick a description…" />
          </SelectTrigger>
          <SelectContent className="max-w-lg">
            {snippets?.map(s => (
              <SelectItem key={s.key} value={s.key}>
                <div className="flex flex-col gap-0.5 py-0.5">
                  <span className="font-medium">{s.key}</span>
                  <span className="text-xs text-muted-foreground line-clamp-2">{s.preview}</span>
                </div>
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM_KEY}>
              <span className="italic text-muted-foreground">Custom (type your own)…</span>
            </SelectItem>
          </SelectContent>
        </Select>
      )}
      <p className="text-xs text-muted-foreground">
        Pick a standard description, or choose 'Custom' to write your own.
      </p>

      {/* Show full text preview when a standard option is selected */}
      {fullText && !isCustom && (
        <div className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
          {fullText}
        </div>
      )}

      {/* Custom textarea */}
      {isCustom && (
        <Textarea
          rows={4}
          placeholder="Write your custom description here…"
          value={customText ?? ''}
          onChange={e => onCustomChange(e.target.value || null)}
          data-testid={`${testIdPrefix}-custom-textarea`}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* UnfilledBadges                                                       */
/* ------------------------------------------------------------------ */
function UnfilledBadges({ placeholders }: { placeholders: string[] }) {
  if (placeholders.length === 0) return null;
  return (
    <div className="rounded-md border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800 p-3">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
          {placeholders.length} unfilled placeholder{placeholders.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-wrap gap-1">
        {placeholders.map(p => (
          <Badge key={p} variant="outline" className="text-xs border-yellow-400 text-yellow-700 dark:text-yellow-400">
            {p}
          </Badge>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main page                                                            */
/* ------------------------------------------------------------------ */
export default function AOReport() {
  const { toast } = useToast();
  const [form, setForm] = useState<ReportRequest>(emptyForm());
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [generated, setGenerated] = useState<GenerateResponse | null>(null);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/ao-report/projects'],
    queryFn: () => api.aoReport.listProjects(),
  });

  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['/ao-report/employees'],
    queryFn: () => api.aoReport.listEmployees(),
  });

  const { data: omgevingSnippets, isLoading: omgevingLoading } = useQuery({
    queryKey: ['/ao-report/snippets/omgeving'],
    queryFn: () => api.aoReport.listOmgevingSnippets(),
  });

  const { data: ingreepSnippets, isLoading: ingreepLoading } = useQuery({
    queryKey: ['/ao-report/snippets/ingreep'],
    queryFn: () => api.aoReport.listIngreepSnippets(),
  });

  const { data: ecopotentiesSample } = useQuery({
    queryKey: ['/ao-report/snippets/ecopotenties-sample'],
    queryFn: () => api.aoReport.getEcopotentiesSample(),
  });

  const projectDetailMutation = useMutation({
    mutationFn: (quotaId: number) => api.aoReport.getProject(quotaId),
    onSuccess: (data) => {
      setForm(prev => ({
        ...prev,
        ecopotenties_panden: (data.huidigesituatie as string) ?? prev.ecopotenties_panden,
        ecopotenties_buitenomgeving: (data.toekomstigesituatie as string) ?? prev.ecopotenties_buitenomgeving,
      }));
    },
  });

  const previewMutation = useMutation({
    mutationFn: (req: ReportRequest) => api.aoReport.preview(req),
    onSuccess: (data) => {
      setPreview(data);
      setGenerated(null);
    },
    onError: (err: Error) => {
      toast({ title: 'Preview failed', description: err.message, variant: 'destructive' });
    },
  });

  const generateMutation = useMutation({
    mutationFn: (req: ReportRequest) => api.aoReport.generate(req),
    onSuccess: (data) => {
      setGenerated(data);
      toast({ title: 'Report generated', description: 'Your DOCX report is ready for download.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Generation failed', description: err.message, variant: 'destructive' });
    },
  });

  const invalidateMutation = useMutation({
    mutationFn: () => api.aoReport.invalidateCache(),
    onSuccess: (data) => {
      toast({ title: 'Cache invalidated', description: data.detail });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  function setField<K extends keyof ReportRequest>(key: K, value: ReportRequest[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleProjectSelect(quotaIdStr: string) {
    const quotaId = parseInt(quotaIdStr, 10);
    setField('quota_id', quotaId);
    projectDetailMutation.mutate(quotaId);
  }

  function handleSubmitPreview(e: React.FormEvent) {
    e.preventDefault();
    if (!form.quota_id || !form.ao_author_id || !form.ao_reviewer_id) {
      toast({ title: 'Validation', description: 'Select a project, author and reviewer first.', variant: 'destructive' });
      return;
    }
    previewMutation.mutate(form);
  }

  function handleGenerate() {
    if (!form.quota_id || !form.ao_author_id || !form.ao_reviewer_id) {
      toast({ title: 'Validation', description: 'Select a project, author and reviewer first.', variant: 'destructive' });
      return;
    }
    generateMutation.mutate(form);
  }

  const isLoading = projectsLoading || employeesLoading;

  return (
    <div className="flex h-full gap-0">
      {/* ── Form panel ── */}
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">AO Report</h1>
              <p className="text-sm text-muted-foreground">Generate an Activiteiten-overzicht report</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => invalidateMutation.mutate()}
            disabled={invalidateMutation.isPending}
            data-testid="button-invalidate-cache"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${invalidateMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh Gripp data
          </Button>
        </div>

        <form onSubmit={handleSubmitPreview} className="space-y-6">

          {/* ── Project & People ── */}
          <Card>
            <CardHeader><CardTitle className="text-base">Project & People</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Project</Label>
                {isLoading ? <Skeleton className="h-9 w-full" /> : (
                  <Select
                    value={form.quota_id ? String(form.quota_id) : ''}
                    onValueChange={handleProjectSelect}
                  >
                    <SelectTrigger data-testid="select-project-trigger">
                      <SelectValue placeholder="Select a project…" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map(p => (
                        <SelectItem key={p.quota_id} value={String(p.quota_id)}>
                          {p.project_name} — {p.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Author</Label>
                  {isLoading ? <Skeleton className="h-9 w-full" /> : (
                    <Select
                      value={form.ao_author_id ? String(form.ao_author_id) : ''}
                      onValueChange={v => setField('ao_author_id', parseInt(v, 10))}
                    >
                      <SelectTrigger data-testid="select-author-trigger">
                        <SelectValue placeholder="Select author…" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.map(e => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Reviewer</Label>
                  {isLoading ? <Skeleton className="h-9 w-full" /> : (
                    <Select
                      value={form.ao_reviewer_id ? String(form.ao_reviewer_id) : ''}
                      onValueChange={v => setField('ao_reviewer_id', parseInt(v, 10))}
                    >
                      <SelectTrigger data-testid="select-reviewer-trigger">
                        <SelectValue placeholder="Select reviewer…" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees?.map(e => (
                          <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Report Metadata ── */}
          <Card>
            <CardHeader><CardTitle className="text-base">Report Metadata</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-number">Report number</Label>
                  <Input
                    id="report-number"
                    value={form.ao_report_number}
                    onChange={e => setField('ao_report_number', e.target.value)}
                    data-testid="input-report-number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="report-date">Report date</Label>
                  <Input
                    id="report-date"
                    type="date"
                    value={form.ao_report_date ?? ''}
                    onChange={e => setField('ao_report_date', e.target.value)}
                    data-testid="input-report-date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deelgebieden">Aantal deelgebieden</Label>
                  <Input
                    id="deelgebieden"
                    type="number"
                    min={1}
                    value={form.aantal_deelgebieden}
                    onChange={e => setField('aantal_deelgebieden', parseInt(e.target.value, 10) || 1)}
                    data-testid="input-deelgebieden"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grondgebonden">Grondgebonden woningen</Label>
                  <Input
                    id="grondgebonden"
                    type="number"
                    min={0}
                    placeholder="optional"
                    value={form.aantal_grondgebonden_woningen ?? ''}
                    onChange={e => setField('aantal_grondgebonden_woningen', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    data-testid="input-grondgebonden"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gestapeld">Gestapelde woningen</Label>
                  <Input
                    id="gestapeld"
                    type="number"
                    min={0}
                    placeholder="optional"
                    value={form.aantal_gestapelde_woningen ?? ''}
                    onChange={e => setField('aantal_gestapelde_woningen', e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    data-testid="input-gestapeld"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Chapter 2 — Omgeving & Ingreep (snippet dropdowns) ── */}
          <Card>
            <CardHeader><CardTitle className="text-base">Omgeving &amp; Ingreep</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <SnippetField
                label="Omgeving projectgebied"
                snippets={omgevingSnippets}
                isLoading={omgevingLoading}
                selectedKey={form.omgeving_key}
                customText={form.omgeving_custom}
                onKeyChange={key => setForm(prev => ({ ...prev, omgeving_key: key, omgeving_custom: null }))}
                onCustomChange={text => setForm(prev => ({ ...prev, omgeving_key: null, omgeving_custom: text }))}
                testIdPrefix="omgeving"
              />
              <SnippetField
                label="Ingreep toelichting"
                snippets={ingreepSnippets}
                isLoading={ingreepLoading}
                selectedKey={form.ingreep_key}
                customText={form.ingreep_custom}
                onKeyChange={key => setForm(prev => ({ ...prev, ingreep_key: key, ingreep_custom: null }))}
                onCustomChange={text => setForm(prev => ({ ...prev, ingreep_key: null, ingreep_custom: text }))}
                testIdPrefix="ingreep"
              />
            </CardContent>
          </Card>

          {/* ── Ecopotenties ── */}
          <Card>
            <CardHeader><CardTitle className="text-base">Ecopotenties</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="eco-panden">Panden</Label>
                <Textarea
                  id="eco-panden"
                  rows={3}
                  placeholder={ecopotentiesSample?.sample ?? 'Ecopotenties panden…'}
                  value={form.ecopotenties_panden ?? ''}
                  onChange={e => setField('ecopotenties_panden', e.target.value || null)}
                  data-testid="textarea-eco-panden"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eco-binnen">Binnenomgeving</Label>
                <Textarea
                  id="eco-binnen"
                  rows={3}
                  placeholder="Ecopotenties binnenomgeving…"
                  value={form.ecopotenties_binnenomgeving ?? ''}
                  onChange={e => setField('ecopotenties_binnenomgeving', e.target.value || null)}
                  data-testid="textarea-eco-binnen"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eco-buiten">Buitenomgeving</Label>
                <Textarea
                  id="eco-buiten"
                  rows={3}
                  placeholder="Ecopotenties buitenomgeving…"
                  value={form.ecopotenties_buitenomgeving ?? ''}
                  onChange={e => setField('ecopotenties_buitenomgeving', e.target.value || null)}
                  data-testid="textarea-eco-buiten"
                />
              </div>
            </CardContent>
          </Card>

          {/* ── QS Rapport & Species ── */}
          <Card>
            <CardHeader><CardTitle className="text-base">QS Rapport & Species</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qs-bedrijf">QS rapport bedrijf</Label>
                  <Input
                    id="qs-bedrijf"
                    placeholder="optional"
                    value={form.qs_rapport_bedrijf ?? ''}
                    onChange={e => setField('qs_rapport_bedrijf', e.target.value || null)}
                    data-testid="input-qs-bedrijf"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qs-datum">QS rapport datum</Label>
                  <Input
                    id="qs-datum"
                    type="date"
                    value={form.qs_rapport_datum ?? ''}
                    onChange={e => setField('qs_rapport_datum', e.target.value || null)}
                    data-testid="input-qs-datum"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="species">Species vrijstelling provincie</Label>
                <Input
                  id="species"
                  placeholder="optional"
                  value={form.species_vrijstelling_provincie ?? ''}
                  onChange={e => setField('species_vrijstelling_provincie', e.target.value || null)}
                  data-testid="input-species"
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Actions ── */}
          <div className="flex gap-3">
            <Button
              type="submit"
              variant="outline"
              disabled={previewMutation.isPending}
              data-testid="button-preview"
            >
              <Eye className="mr-2 h-4 w-4" />
              {previewMutation.isPending ? 'Loading preview…' : 'Preview'}
            </Button>
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generateMutation.isPending}
              data-testid="button-generate"
            >
              <FileText className="mr-2 h-4 w-4" />
              {generateMutation.isPending ? 'Generating…' : 'Generate report'}
            </Button>
          </div>
        </form>
      </div>

      {/* ── Side panel ── */}
      <div className="w-96 shrink-0 border-l overflow-auto p-6 bg-muted/20">
        <h2 className="mb-4 text-base font-semibold">Preview / Output</h2>

        {!preview && !generated && !previewMutation.isPending && (
          <p className="text-sm text-muted-foreground">
            Fill in the form and click <strong>Preview</strong> to see resolved template values, or click <strong>Generate report</strong> to create the DOCX directly.
          </p>
        )}

        {previewMutation.isPending && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        )}

        {preview && (
          <div className="space-y-4">
            <UnfilledBadges placeholders={preview.unfilled_placeholders} />
            <div>
              <h3 className="text-sm font-medium mb-2">Resolved values</h3>
              <div className="space-y-1 rounded-md border bg-background p-3 text-xs font-mono">
                {Object.entries(preview.context).map(([k, v]) => (
                  <div key={k} className="flex gap-2 overflow-hidden">
                    <span className="shrink-0 text-muted-foreground">{k}:</span>
                    <span className="truncate">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {generated && (
          <div className="space-y-4">
            <UnfilledBadges placeholders={generated.unfilled_placeholders} />
            <div className="rounded-md border bg-background p-4 text-center">
              <FileText className="mx-auto mb-2 h-8 w-8 text-primary" />
              <p className="mb-3 text-sm font-medium">Report ready</p>
              <Button asChild size="sm" data-testid="button-download">
                <a
                  href={api.aoReport.downloadUrl(generated.artifact_id)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download DOCX
                </a>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
