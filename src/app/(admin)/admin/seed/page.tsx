'use client';

import { useState, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Upload,
  FileJson,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  Database,
} from 'lucide-react';

interface ImportResult {
  total: number;
  success: number;
  errors: number;
  errorMessages: string[];
}

export default function AdminSeedPage() {
  const supabase = createBrowserClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [jsonText, setJsonText] = useState('');
  const [parsedData, setParsedData] = useState<Record<string, any>[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);

  const parseJson = (text: string) => {
    setParseError(null);
    setParsedData(null);
    setResult(null);

    if (!text.trim()) {
      setParseError('Please paste JSON data or upload a file.');
      return;
    }

    try {
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        setParseError(
          'JSON must be an array of VC firm objects. Received: ' + typeof parsed
        );
        return;
      }

      if (parsed.length === 0) {
        setParseError('Array is empty. No data to import.');
        return;
      }

      const hasName = parsed.every(
        (item: any) => item.name && typeof item.name === 'string'
      );
      if (!hasName) {
        setParseError(
          'Every object must have a "name" field (string). Check your data.'
        );
        return;
      }

      setParsedData(parsed);
    } catch (err: any) {
      setParseError(`Invalid JSON: ${err.message}`);
    }
  };

  const handleTextChange = (text: string) => {
    setJsonText(text);
    if (text.trim()) {
      parseJson(text);
    } else {
      setParsedData(null);
      setParseError(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      parseJson(text);
    };
    reader.onerror = () => {
      setParseError('Failed to read file.');
    };
    reader.readAsText(file);

    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleLoadSample = async () => {
    setResult(null);
    try {
      const res = await fetch('/data/seed-vcs.json');
      if (!res.ok) {
        setParseError(
          'Failed to load sample data. Make sure /data/seed-vcs.json exists in your public folder.'
        );
        return;
      }
      const text = await res.text();
      setJsonText(text);
      parseJson(text);
    } catch (err: any) {
      setParseError(`Failed to load sample data: ${err.message}`);
    }
  };

  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleImport = async () => {
    if (!parsedData || parsedData.length === 0) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    const total = parsedData.length;
    let success = 0;
    let errors = 0;
    const errorMessages: string[] = [];

    // Process in batches of 20
    const batchSize = 20;

    for (let i = 0; i < total; i += batchSize) {
      const batch = parsedData.slice(i, i + batchSize);

      const records = batch.map((item) => ({
        name: item.name,
        slug: item.slug || slugify(item.name),
        website: item.website || null,
        description: item.description || null,
        type: item.type || null,
        investment_stages: item.investment_stages || null,
        sectors: item.sectors || null,
        geographies: item.geographies || null,
        check_size_min: item.check_size_min != null ? Number(item.check_size_min) : null,
        check_size_max: item.check_size_max != null ? Number(item.check_size_max) : null,
        fund_size: item.fund_size || null,
        portfolio_count: item.portfolio_count != null ? Number(item.portfolio_count) : null,
        founded_year: item.founded_year != null ? Number(item.founded_year) : null,
        headquarters: item.headquarters || null,
        email: item.email || null,
        linkedin_url: item.linkedin_url || null,
        twitter_url: item.twitter_url || null,
        crunchbase_url: item.crunchbase_url || null,
        is_active: item.is_active !== undefined ? item.is_active : true,
      }));

      const { data, error } = await supabase
        .from('vc_firms')
        .insert(records)
        .select('id');

      if (error) {
        errors += batch.length;
        errorMessages.push(
          `Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`
        );
      } else {
        success += data?.length ?? batch.length;
      }

      setProgress(Math.min(i + batchSize, total));
    }

    setResult({ total, success, errors, errorMessages });
    setImporting(false);
  };

  const samplePreview = parsedData?.slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Seed Data Import</h2>
        <p className="text-muted-foreground">
          Bulk import VC firms from JSON data.
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle>JSON Data</CardTitle>
          <CardDescription>
            Paste an array of VC firm objects or upload a JSON file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="json-input">JSON Array</Label>
            <Textarea
              id="json-input"
              value={jsonText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={`[\n  {\n    "name": "Example Ventures",\n    "type": "VC",\n    "headquarters": "San Francisco, CA",\n    "investment_stages": ["Seed", "Series A"],\n    "sectors": ["SaaS", "AI/ML"],\n    "check_size_min": 100000,\n    "check_size_max": 2000000\n  }\n]`}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Upload JSON File
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleLoadSample}
            >
              <Database className="h-4 w-4" />
              Load Sample Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parse Error */}
      {parseError && (
        <div className="rounded-lg border border-border bg-red-900/30 px-4 py-3 text-sm text-red-400">
          <div className="flex items-start gap-2">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{parseError}</span>
          </div>
        </div>
      )}

      {/* Preview Section */}
      {parsedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5" />
              Data Preview
            </CardTitle>
            <CardDescription>
              {parsedData.length} VC firm{parsedData.length !== 1 ? 's' : ''}{' '}
              parsed successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sample records */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Sample records (showing first {samplePreview?.length}):
              </p>
              <div className="space-y-2">
                {samplePreview?.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border bg-secondary p-3 text-sm"
                  >
                    <p className="font-medium">{item.name}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                      {item.type && <span>Type: {item.type}</span>}
                      {item.headquarters && <span>HQ: {item.headquarters}</span>}
                      {item.investment_stages?.length > 0 && (
                        <span>
                          Stages: {item.investment_stages.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {parsedData.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  ...and {parsedData.length - 3} more
                </p>
              )}
            </div>

            <Separator />

            {/* Import button */}
            <Button
              onClick={handleImport}
              disabled={importing}
              className="gap-2"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {importing
                ? `Importing... (${progress}/${parsedData.length})`
                : `Import ${parsedData.length} VC Firm${parsedData.length !== 1 ? 's' : ''}`}
            </Button>

            {/* Progress bar */}
            {importing && (
              <div className="space-y-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{
                      width: `${(progress / parsedData.length) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Processing {progress} of {parsedData.length} records...
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.errors === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-green-400" />
              ) : (
                <XCircle className="h-5 w-5 text-amber-600" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-secondary p-4 text-center">
                <p className="text-2xl font-bold">{result.total}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
              <div className="rounded-lg border border-border bg-green-900/30 p-4 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {result.success}
                </p>
                <p className="text-sm text-green-400">Successful</p>
              </div>
              <div className="rounded-lg border border-border bg-red-900/30 p-4 text-center">
                <p className="text-2xl font-bold text-red-400">
                  {result.errors}
                </p>
                <p className="text-sm text-red-400">Failed</p>
              </div>
            </div>

            {result.errorMessages.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-400">Errors:</p>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-red-900/30 p-3">
                  {result.errorMessages.map((msg, idx) => (
                    <p key={idx} className="text-sm text-red-400">
                      {msg}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {result.success > 0 && (
              <p className="text-sm text-green-400">
                Successfully imported {result.success} VC firm
                {result.success !== 1 ? 's' : ''} into the database.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
