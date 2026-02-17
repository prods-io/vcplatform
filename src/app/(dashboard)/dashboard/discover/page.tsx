'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Search,
  Heart,
  MapPin,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

const TYPES = ['VC', 'Angel', 'Incubator', 'Accelerator', 'Grant'];
const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B+'];
const SECTORS = [
  'SaaS',
  'Fintech',
  'HealthTech',
  'EdTech',
  'AI/ML',
  'E-commerce',
  'CleanTech',
  'DeepTech',
  'Consumer',
  'Enterprise',
  'Marketplace',
  'Crypto/Web3',
];
const GEOGRAPHIES = [
  'United States',
  'Europe',
  'United Kingdom',
  'Middle East',
  'Southeast Asia',
  'India',
  'Africa',
  'Latin America',
  'Global',
];

const PAGE_SIZE = 12;

interface VCFirm {
  id: string;
  name: string;
  type: string;
  investment_stages: string[];
  sectors: string[];
  check_size_min: number | null;
  check_size_max: number | null;
  headquarters: string | null;
  logo_url: string | null;
  geographies: string[];
}

function formatAmount(amount: number | null): string {
  if (amount === null || amount === undefined) return '?';
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount}`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const COLORS = [
  'bg-indigo-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-pink-500',
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function DiscoverPage() {
  const supabase = createBrowserClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedGeo, setSelectedGeo] = useState<string[]>([]);
  const [checkMin, setCheckMin] = useState('');
  const [checkMax, setCheckMax] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [page, setPage] = useState(1);

  const [vcs, setVcs] = useState<VCFirm[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Load user and saved VCs
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data } = await supabase
          .from('saved_vcs')
          .select('vc_firm_id')
          .eq('user_id', user.id);
        if (data) {
          setSavedIds(new Set(data.map((r: any) => r.vc_firm_id)));
        }
      }
    }
    init();
  }, [supabase]);

  // Fetch VCs
  const fetchVCs = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('vc_firms')
      .select('id, name, type, investment_stages, sectors, check_size_min, check_size_max, headquarters, logo_url, geographies', {
        count: 'exact',
      });

    if (debouncedQuery.trim()) {
      query = query.ilike('name', `%${debouncedQuery.trim()}%`);
    }

    if (selectedTypes.length > 0) {
      query = query.in('type', selectedTypes);
    }

    if (selectedStages.length > 0) {
      query = query.overlaps('investment_stages', selectedStages);
    }

    if (selectedSectors.length > 0) {
      query = query.overlaps('sectors', selectedSectors);
    }

    if (selectedGeo.length > 0) {
      query = query.overlaps('geographies', selectedGeo);
    }

    if (checkMin) {
      query = query.gte('check_size_max', parseInt(checkMin));
    }

    if (checkMax) {
      query = query.lte('check_size_min', parseInt(checkMax));
    }

    if (sortBy === 'name_asc') {
      query = query.order('name', { ascending: true });
    } else if (sortBy === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('name', { ascending: true });
    }

    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (!error && data) {
      setVcs(data as VCFirm[]);
      setTotalCount(count ?? 0);
    }

    setLoading(false);
  }, [
    supabase,
    debouncedQuery,
    selectedTypes,
    selectedStages,
    selectedSectors,
    selectedGeo,
    checkMin,
    checkMax,
    sortBy,
    page,
  ]);

  useEffect(() => {
    fetchVCs();
  }, [fetchVCs]);

  async function toggleSave(vcId: string) {
    if (!userId) return;
    setTogglingId(vcId);

    if (savedIds.has(vcId)) {
      await supabase
        .from('saved_vcs')
        .delete()
        .eq('user_id', userId)
        .eq('vc_firm_id', vcId);
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.delete(vcId);
        return next;
      });
    } else {
      await supabase.from('saved_vcs').insert({
        user_id: userId,
        vc_firm_id: vcId,
        status: 'saved',
      });
      setSavedIds((prev) => new Set(prev).add(vcId));
    }
    setTogglingId(null);
  }

  function toggleFilter(
    value: string,
    selected: string[],
    setSelected: (v: string[]) => void
  ) {
    if (selected.includes(value)) {
      setSelected(selected.filter((s) => s !== value));
    } else {
      setSelected([...selected, value]);
    }
    setPage(1);
  }

  function clearFilters() {
    setSelectedTypes([]);
    setSelectedStages([]);
    setSelectedSectors([]);
    setSelectedGeo([]);
    setCheckMin('');
    setCheckMax('');
    setPage(1);
  }

  const hasFilters =
    selectedTypes.length > 0 ||
    selectedStages.length > 0 ||
    selectedSectors.length > 0 ||
    selectedGeo.length > 0 ||
    checkMin !== '' ||
    checkMax !== '';

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const filtersContent = (
    <div className="space-y-6">
      {/* Type */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Type</h4>
        <div className="space-y-2">
          {TYPES.map((t) => (
            <div key={t} className="flex items-center gap-2">
              <Checkbox
                id={`type-${t}`}
                checked={selectedTypes.includes(t)}
                onCheckedChange={() =>
                  toggleFilter(t, selectedTypes, setSelectedTypes)
                }
              />
              <Label htmlFor={`type-${t}`} className="text-sm font-normal cursor-pointer">
                {t}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Stage</h4>
        <div className="space-y-2">
          {STAGES.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <Checkbox
                id={`stage-${s}`}
                checked={selectedStages.includes(s)}
                onCheckedChange={() =>
                  toggleFilter(s, selectedStages, setSelectedStages)
                }
              />
              <Label htmlFor={`stage-${s}`} className="text-sm font-normal cursor-pointer">
                {s}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Sector */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Sector</h4>
        <div className="space-y-2">
          {SECTORS.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <Checkbox
                id={`sector-${s}`}
                checked={selectedSectors.includes(s)}
                onCheckedChange={() =>
                  toggleFilter(s, selectedSectors, setSelectedSectors)
                }
              />
              <Label htmlFor={`sector-${s}`} className="text-sm font-normal cursor-pointer">
                {s}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Geography */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Geography</h4>
        <div className="space-y-2">
          {GEOGRAPHIES.map((g) => (
            <div key={g} className="flex items-center gap-2">
              <Checkbox
                id={`geo-${g}`}
                checked={selectedGeo.includes(g)}
                onCheckedChange={() =>
                  toggleFilter(g, selectedGeo, setSelectedGeo)
                }
              />
              <Label htmlFor={`geo-${g}`} className="text-sm font-normal cursor-pointer">
                {g}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Check size */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-gray-900">Check Size (USD)</h4>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={checkMin}
            onChange={(e) => {
              setCheckMin(e.target.value);
              setPage(1);
            }}
            className="w-full"
          />
          <span className="text-gray-400">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={checkMax}
            onChange={(e) => {
              setCheckMax(e.target.value);
              setPage(1);
            }}
            className="w-full"
          />
        </div>
      </div>

      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={clearFilters}
        >
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Discover VCs</h1>
        <p className="mt-1 text-gray-500">
          Find the right investors for your startup.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search VCs by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-12 pl-10 text-base"
        />
      </div>

      <div className="flex gap-6">
        {/* Desktop filters */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-0 rounded-lg border bg-white p-4">
            <h3 className="mb-4 font-semibold text-gray-900">Filters</h3>
            {filtersContent}
          </div>
        </aside>

        {/* Mobile filter button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full shadow-lg">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filters
                {hasFilters && (
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-600">
                    {selectedTypes.length +
                      selectedStages.length +
                      selectedSectors.length +
                      selectedGeo.length +
                      (checkMin ? 1 : 0) +
                      (checkMax ? 1 : 0)}
                  </span>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="mt-4">{filtersContent}</div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${totalCount} result${totalCount !== 1 ? 's' : ''}`}
            </p>
            <Select value={sortBy} onValueChange={(v) => { setSortBy(v); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevance</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
                <SelectItem value="recent">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Loading skeletons */}
          {loading && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <Skeleton className="h-12 w-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Results grid */}
          {!loading && vcs.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {vcs.map((vc) => (
                <Card
                  key={vc.id}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${colorFor(vc.name)}`}
                        >
                          {getInitials(vc.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-gray-900">
                            {vc.name}
                          </h3>
                          <Badge variant="secondary" className="mt-0.5 text-xs">
                            {vc.type}
                          </Badge>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleSave(vc.id)}
                        disabled={togglingId === vc.id}
                        className="shrink-0 p-1 transition-colors"
                        aria-label={savedIds.has(vc.id) ? 'Unsave' : 'Save'}
                      >
                        <Heart
                          className={`h-5 w-5 ${
                            savedIds.has(vc.id)
                              ? 'fill-red-500 text-red-500'
                              : 'text-gray-300 hover:text-red-400'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Stages */}
                    {vc.investment_stages && vc.investment_stages.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {vc.investment_stages.map((stage) => (
                          <span
                            key={stage}
                            className="inline-flex rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                          >
                            {stage}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Sectors */}
                    {vc.sectors && vc.sectors.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {vc.sectors.slice(0, 3).map((sector) => (
                          <span
                            key={sector}
                            className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          >
                            {sector}
                          </span>
                        ))}
                        {vc.sectors.length > 3 && (
                          <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                            +{vc.sectors.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bottom row */}
                    <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-gray-500">
                      <span className="font-medium">
                        {vc.check_size_min !== null || vc.check_size_max !== null
                          ? `${formatAmount(vc.check_size_min)} - ${formatAmount(vc.check_size_max)}`
                          : 'Check size N/A'}
                      </span>
                      {vc.headquarters && (
                        <span className="flex items-center gap-1 truncate ml-2">
                          <MapPin className="h-3 w-3 shrink-0" />
                          <span className="truncate">{vc.headquarters}</span>
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && vcs.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <Search className="h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No VCs found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters.
              </p>
              {hasFilters && (
                <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                  Clear all filters
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? 'default' : 'ghost'}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
