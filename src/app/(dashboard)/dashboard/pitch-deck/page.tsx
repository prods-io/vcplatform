'use client'

import { useEffect, useState } from 'react'
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trash2,
  BarChart3,
  Clock,
  TrendingUp,
  AlertOctagon,
  Target,
  Zap,
  Info,
} from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useToast } from '@/components/ui/use-toast'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import type { FullAnalysisResult } from '@/lib/ai/types'

interface LegacyAnalysis {
  id: string
  file_name: string
  file_url: string | null
  score: number | null
  strengths: string[] | null
  improvements: string[] | null
  missing_sections: string[] | null
  suggestions: Record<string, string> | null
  vc_readiness: string | null
  analysis_data: FullAnalysisResult | null
  created_at: string
}

function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-400'
  if (grade.startsWith('B')) return 'text-blue-400'
  if (grade.startsWith('C')) return 'text-yellow-400'
  if (grade === 'D') return 'text-orange-400'
  return 'text-red-500'
}

function gradeBgColor(grade: string): string {
  if (grade.startsWith('A')) return 'bg-emerald-500/20 border-emerald-500/30'
  if (grade.startsWith('B')) return 'bg-blue-500/20 border-blue-500/30'
  if (grade.startsWith('C')) return 'bg-yellow-500/20 border-yellow-500/30'
  if (grade === 'D') return 'bg-orange-500/20 border-orange-500/30'
  return 'bg-red-500/20 border-red-500/30'
}

function scoreBarColor(score: number): string {
  if (score >= 8) return 'bg-emerald-500'
  if (score >= 6) return 'bg-blue-500'
  if (score >= 4) return 'bg-yellow-500'
  return 'bg-red-500'
}

function impactBadge(impact: string) {
  const colors: Record<string, string> = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${colors[impact] || colors.low}`}
    >
      {impact}
    </span>
  )
}

export default function PitchDeckPage() {
  const supabase = createBrowserClient()
  const { toast } = useToast()

  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [analyzeMessage, setAnalyzeMessage] = useState('')
  const [currentAnalysis, setCurrentAnalysis] = useState<FullAnalysisResult | null>(null)
  const [previousAnalyses, setPreviousAnalyses] = useState<LegacyAnalysis[]>([])
  const [loading, setLoading] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const [expandedDimensions, setExpandedDimensions] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchPreviousAnalyses()
  }, [])

  async function fetchPreviousAnalyses() {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('pitch_deck_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setPreviousAnalyses(data as LegacyAnalysis[])
    }
    setLoading(false)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && isValidFile(droppedFile)) {
      setFile(droppedFile)
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF or PPTX file.',
        variant: 'destructive',
      })
    }
  }

  function isValidFile(f: File): boolean {
    const name = f.name.toLowerCase()
    return name.endsWith('.pdf') || name.endsWith('.pptx')
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected && isValidFile(selected)) {
      setFile(selected)
    } else if (selected) {
      toast({
        title: 'Invalid file',
        description: 'Please upload a PDF or PPTX file.',
        variant: 'destructive',
      })
    }
  }

  async function handleAnalyze() {
    if (!file) return

    setAnalyzing(true)
    setAnalyzeProgress(10)
    setAnalyzeMessage('Uploading and parsing your pitch deck...')

    const progressInterval = setInterval(() => {
      setAnalyzeProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval)
          return 85
        }
        return prev + Math.random() * 8
      })
    }, 2000)

    const messages = [
      'Extracting slide content...',
      'Running structural checks...',
      'Analyzing with AI across 12 dimensions...',
      'Evaluating market positioning...',
      'Scoring traction and financials...',
      'Generating recommendations...',
    ]
    let msgIdx = 0
    const msgInterval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length
      setAnalyzeMessage(messages[msgIdx])
    }, 3000)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/ai/analyze-deck', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      clearInterval(msgInterval)

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Analysis failed')
      }

      const result = await response.json()
      setAnalyzeProgress(100)
      setAnalyzeMessage('Analysis complete!')

      setCurrentAnalysis(result.analysis)
      setFile(null)

      fetchPreviousAnalyses()

      toast({
        title: 'Analysis Complete',
        description: `Your pitch deck scored ${result.analysis.grade} (${result.analysis.deckQualityScore}/100).`,
      })
    } catch (err) {
      clearInterval(progressInterval)
      clearInterval(msgInterval)
      toast({
        title: 'Analysis failed',
        description: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      })
    }

    setAnalyzing(false)
    setTimeout(() => {
      setAnalyzeProgress(0)
      setAnalyzeMessage('')
    }, 2000)
  }

  function toggleDimension(key: string) {
    setExpandedDimensions((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function renderFullAnalysis(analysis: FullAnalysisResult) {
    const radarData = analysis.dimensions.map((d) => ({
      dimension: d.label.replace(/\s*\(.*\)/, ''),
      score: d.score,
      fullMark: 10,
    }))

    return (
      <div className="space-y-6">
        {/* Overview Header */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={`border ${gradeBgColor(analysis.grade)}`}>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Investment Readiness
              </p>
              <p className={`text-5xl font-bold ${gradeColor(analysis.grade)}`}>
                {analysis.grade}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Deck Quality Score
              </p>
              <p className="text-4xl font-bold text-foreground">
                {analysis.deckQualityScore}
              </p>
              <p className="text-sm text-muted-foreground">/100</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-6">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Traction Score
              </p>
              <p className="text-4xl font-bold text-foreground">
                {analysis.tractionScore}
              </p>
              <p className="text-sm text-muted-foreground">/100</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm leading-relaxed text-foreground/80">{analysis.summary}</p>
          </CardContent>
        </Card>

        {/* 12-Dimension Scores + Radar Chart */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Dimension Score Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="h-5 w-5 text-primary" />
                12-Dimension Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.dimensions.map((dim) => (
                <div key={dim.key}>
                  <button
                    onClick={() => toggleDimension(dim.key)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">
                          {dim.label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-foreground">
                            {dim.score}/10
                          </span>
                          {expandedDimensions.has(dim.key) ? (
                            <ChevronUp className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary">
                        <div
                          className={`h-2 rounded-full transition-all ${scoreBarColor(dim.score)}`}
                          style={{ width: `${dim.score * 10}%` }}
                        />
                      </div>
                    </div>
                  </button>
                  {expandedDimensions.has(dim.key) && (
                    <p className="mt-2 text-sm text-muted-foreground pl-1">
                      {dim.feedback}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                Dimension Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 10]}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Extracted Metrics */}
        {analysis.extractedMetrics && Object.values(analysis.extractedMetrics).some((v) => v) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-primary" />
                Extracted Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                {Object.entries(analysis.extractedMetrics).map(([key, value]) =>
                  value ? (
                    <div
                      key={key}
                      className="rounded-lg border bg-secondary/50 p-3"
                    >
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">
                        {value}
                      </p>
                    </div>
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rule-Based Warnings */}
        {analysis.ruleChecks && analysis.ruleChecks.warnings.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-yellow-500">
                <AlertTriangle className="h-5 w-5" />
                Structural Warnings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.ruleChecks.warnings.map((warning, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3"
                >
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-yellow-500" />
                  <p className="text-sm text-foreground/80">{warning}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground/80"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-red-400">
                <XCircle className="h-4 w-4" />
                Weaknesses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.weaknesses.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground/80"
                  >
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Priority Improvements */}
        {analysis.priorityImprovements.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-5 w-5 text-primary" />
                Priority Improvements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.priorityImprovements.map((imp, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{imp.title}</p>
                      {impactBadge(imp.impact)}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{imp.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Red Flags */}
        {analysis.redFlags.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-red-400">
                <AlertOctagon className="h-5 w-5" />
                Red Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {analysis.redFlags.map((flag, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3"
                >
                  <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <p className="text-sm text-foreground/80">{flag}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Slide Breakdown */}
        {analysis.slideBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-5 w-5 text-primary" />
                Slide Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Slide</th>
                      <th className="pb-2 pr-4 font-medium text-muted-foreground">Type</th>
                      <th className="pb-2 font-medium text-muted-foreground">Summary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.slideBreakdown.map((slide) => (
                      <tr key={slide.slideNumber} className="border-b border-border/50">
                        <td className="py-2 pr-4 text-foreground">#{slide.slideNumber}</td>
                        <td className="py-2 pr-4">
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                            {slide.classifiedType}
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground">{slide.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  function renderLegacyAnalysis(analysis: LegacyAnalysis) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Overall Score
          </p>
          <p className="text-6xl font-bold text-foreground">{analysis.score ?? 0}</p>
          <p className="text-sm text-muted-foreground">/100</p>
          <div className="mt-3 w-full max-w-xs">
            <Progress value={analysis.score ?? 0} className="h-3" />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {(analysis.strengths ?? []).map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    {s}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-yellow-400">
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

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm text-red-400">
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

        {analysis.vc_readiness && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-5 w-5 text-primary" />
                VC Readiness
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/80">{analysis.vc_readiness}</p>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  function scoreBgColor(score: number): string {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pitch Deck Analyzer</h1>
        <p className="mt-1 text-muted-foreground">
          Upload your pitch deck and get AI-powered 12-dimension analysis to improve your
          fundraising.
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
                ? 'border-primary bg-primary/10'
                : file
                  ? 'border-emerald-500/30 bg-emerald-900/20'
                  : 'border-border bg-secondary hover:border-primary/50'
            }`}
          >
            {file ? (
              <>
                <FileText className="h-12 w-12 text-emerald-500" />
                <p className="mt-3 font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Button onClick={handleAnalyze} disabled={analyzing}>
                    {analyzing ? (
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
                    disabled={analyzing}
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
                <p className="text-sm text-muted-foreground">
                  PDF and PPTX files, up to 20MB
                </p>
                <label className="mt-4">
                  <Button variant="outline" asChild>
                    <span className="cursor-pointer">
                      Browse Files
                      <input
                        type="file"
                        accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
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
          {analyzing && analyzeProgress > 0 && (
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
          <h2 className="mb-4 text-lg font-semibold text-foreground">Latest Analysis</h2>
          {renderFullAnalysis(currentAnalysis)}
        </div>
      )}

      {/* Previous analyses */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Previous Analyses</h2>

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
            {previousAnalyses.map((analysis) => {
              const hasNewFormat = !!analysis.analysis_data
              const grade = hasNewFormat
                ? analysis.analysis_data!.grade
                : analysis.vc_readiness
              return (
                <AccordionItem
                  key={analysis.id}
                  value={analysis.id}
                  className="rounded-lg border bg-card px-4"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-4 text-left">
                      {hasNewFormat ? (
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-bold ${gradeBgColor(analysis.analysis_data!.grade)} ${gradeColor(analysis.analysis_data!.grade)}`}
                        >
                          {analysis.analysis_data!.grade}
                        </div>
                      ) : (
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold ${scoreBgColor(analysis.score ?? 0)}`}
                        >
                          {analysis.score ?? 0}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">{analysis.file_name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(analysis.created_at).toLocaleDateString()} at{' '}
                          {new Date(analysis.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {hasNewFormat && (
                            <span className="ml-2">
                              Score: {analysis.analysis_data!.deckQualityScore}/100
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-4">
                    {hasNewFormat
                      ? renderFullAnalysis(analysis.analysis_data!)
                      : renderLegacyAnalysis(analysis)}
                  </AccordionContent>
                </AccordionItem>
              )
            })}
          </Accordion>
        )}
      </div>
    </div>
  )
}
