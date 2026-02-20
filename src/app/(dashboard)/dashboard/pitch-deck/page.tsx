'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  Trash2,
  BarChart3,
  Clock,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/components/ui/use-toast';

interface Analysis {
  id: string;
  file_name: string;
  file_url: string | null;
  score: number | null;
  strengths: string[] | null;
  improvements: string[] | null;
  missing_sections: string[] | null;
  suggestions: Record<string, string> | null;
  vc_readiness: string | null;
  created_at: string;
}

export default function PitchDeckPage() {
  const supabase = createBrowserClient();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeMessage, setAnalyzeMessage] = useState('');
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [previousAnalyses, setPreviousAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchPreviousAnalyses();
  }, []);

  async function fetchPreviousAnalyses() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('pitch_deck_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPreviousAnalyses(data as Analysis[]);
    }
    setLoading(false);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
    } else if (selected) {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
    }
  }

  async function handleAnalyze() {
    if (!file) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    setAnalyzeProgress(10);
    setAnalyzeMessage('Uploading pitch deck...');

    // Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('pitch-decks')
      .upload(fileName, file, { contentType: 'application/pdf' });

    if (uploadError) {
      toast({
        title: 'Upload failed',
        description: uploadError.message,
        variant: 'destructive',
      });
      setUploading(false);
      setAnalyzeProgress(0);
      setAnalyzeMessage('');
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('pitch-decks').getPublicUrl(fileName);

    setUploading(false);
    setAnalyzing(true);
    setAnalyzeProgress(30);
    setAnalyzeMessage('Analyzing your pitch deck with AI...');

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalyzeProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return 85;
        }
        return prev + Math.random() * 10;
      });
    }, 1500);

    const messages = [
      'Evaluating slide structure...',
      'Assessing market analysis...',
      'Reviewing financial projections...',
      'Checking narrative flow...',
      'Generating recommendations...',
    ];
    let msgIdx = 0;
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setAnalyzeMessage(messages[msgIdx]);
    }, 2500);

    try {
      const response = await fetch('/api/ai/analyze-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: publicUrl,
          file_name: file.name,
          user_id: user.id,
        }),
      });

      clearInterval(progressInterval);
      clearInterval(msgInterval);

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const result = await response.json();
      setAnalyzeProgress(100);
      setAnalyzeMessage('Analysis complete!');

      setCurrentAnalysis(result);
      setFile(null);

      // Refresh previous analyses
      fetchPreviousAnalyses();

      toast({
        title: 'Analysis Complete',
        description: `Your pitch deck scored ${result.score ?? result.overall_score ?? 0}/100.`,
      });
    } catch (err) {
      clearInterval(progressInterval);
      clearInterval(msgInterval);
      toast({
        title: 'Analysis failed',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }

    setAnalyzing(false);
    setTimeout(() => {
      setAnalyzeProgress(0);
      setAnalyzeMessage('');
    }, 2000);
  }

  function scoreColor(score: number): string {
    if (score >= 70) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-600';
  }

  function scoreBgColor(score: number): string {
    if (score >= 70) return 'bg-green-900/300';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  function renderAnalysis(analysis: Analysis) {
    return (
      <div className="space-y-6">
        {/* Score */}
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Overall Score
          </p>
          <p className={`text-6xl font-bold ${scoreColor(analysis.score ?? 0)}`}>
            {analysis.score ?? 0}
          </p>
          <p className="text-sm text-muted-foreground">/100</p>
          <div className="mt-3 w-full max-w-xs">
            <Progress
              value={analysis.score ?? 0}
              className="h-3"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Strengths */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(analysis.strengths ?? []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Improvements */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(analysis.improvements ?? []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Missing sections */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-red-700">
                <XCircle className="h-4 w-4" />
                Missing Sections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(analysis.missing_sections ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No missing sections detected.</p>
              ) : (
                <ul className="space-y-2">
                  {(analysis.missing_sections ?? []).map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      {s}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Section suggestions */}
        {analysis.suggestions &&
          Object.keys(analysis.suggestions).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Section-by-Section Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {Object.entries(analysis.suggestions).map(
                    ([section, suggestion]) => (
                      <AccordionItem key={section} value={section}>
                        <AccordionTrigger className="text-sm font-medium">
                          {section}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          {suggestion}
                        </AccordionContent>
                      </AccordionItem>
                    )
                  )}
                </Accordion>
              </CardContent>
            </Card>
          )}

        {/* VC Readiness */}
        {analysis.vc_readiness && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                VC Readiness Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {analysis.vc_readiness}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pitch Deck Analyzer</h1>
        <p className="mt-1 text-muted-foreground">
          Upload your pitch deck and get AI-powered feedback to improve your fundraising.
        </p>
      </div>

      {/* Upload area */}
      <Card>
        <CardContent className="p-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-colors ${
              dragOver
                ? 'border-indigo-400 bg-primary/10'
                : file
                ? 'border-green-300 bg-green-900/30'
                : 'border-border bg-secondary hover:border-primary/50'
            }`}
          >
            {file ? (
              <>
                <FileText className="h-12 w-12 text-green-500" />
                <p className="mt-3 font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Button onClick={handleAnalyze} disabled={uploading || analyzing}>
                    {uploading || analyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {analyzeMessage || 'Processing...'}
                      </>
                    ) : (
                      'Analyze Pitch Deck'
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    disabled={uploading || analyzing}
                  >
                    <Trash2 className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-12 w-12 text-muted-foreground" />
                <p className="mt-3 font-medium text-foreground">
                  Drag and drop your pitch deck here
                </p>
                <p className="text-sm text-muted-foreground">PDF files only, up to 20MB</p>
                <label className="mt-4">
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">
                      Browse Files
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileSelect}
                        className="sr-only"
                      />
                    </span>
                  </Button>
                </label>
              </>
            )}
          </div>

          {/* Progress bar */}
          {(uploading || analyzing) && analyzeProgress > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{analyzeMessage}</span>
                <span className="font-medium text-foreground">
                  {Math.round(analyzeProgress)}%
                </span>
              </div>
              <Progress value={analyzeProgress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current analysis results */}
      {currentAnalysis && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Latest Analysis: {currentAnalysis.file_name}
          </h2>
          {renderAnalysis(currentAnalysis)}
        </div>
      )}

      {/* Previous analyses */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">
          Previous Analyses
        </h2>

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="flex items-center gap-4 p-4">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!loading && previousAnalyses.length === 0 && !currentAnalysis && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-3 font-medium text-foreground">No analyses yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload your pitch deck above to get started.
              </p>
            </CardContent>
          </Card>
        )}

        {!loading && previousAnalyses.length > 0 && (
          <Accordion type="single" collapsible className="space-y-3">
            {previousAnalyses.map((analysis) => (
              <AccordionItem
                key={analysis.id}
                value={analysis.id}
                className="rounded-lg border bg-white px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-4 text-left">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold ${scoreBgColor(analysis.score ?? 0)}`}
                    >
                      {analysis.score ?? 0}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {analysis.file_name}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(analysis.created_at).toLocaleDateString()} at{' '}
                        {new Date(analysis.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  {renderAnalysis(analysis)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
