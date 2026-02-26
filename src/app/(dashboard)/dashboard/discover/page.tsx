'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Heart,
  Mail,
  MapPin,
  SlidersHorizontal,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  VC_TYPES,
  STAGES as STAGE_OPTIONS,
  SECTORS as SECTOR_OPTIONS,
  GEOGRAPHIES as GEO_OPTIONS,
} from '@/lib/utils/constants';
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

const PAGE_SIZE = 12;

// Lookup maps for displaying labels from DB values
const TYPE_LABELS = Object.fromEntries(VC_TYPES.map((t) => [t.value, t.label]));
const STAGE_LABELS = Object.fromEntries(STAGE_OPTIONS.map((s) => [s.value, s.label]));
const SECTOR_LABELS = Object.fromEntries(SECTOR_OPTIONS.map((s) => [s.value, s.label]));
const GEO_LABELS = Object.fromEntries(GEO_OPTIONS.map((g) => [g.value, g.label]));

interface VCFirm {
  id: string;
  name: string;
  slug: string;
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
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [selectedGeo, setSelectedGeo] = useState<string[]>([]);
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
      .select('id, name, slug, type, investment_stages, sectors, check_size_min, check_size_max, headquarters, logo_url, geographies', {
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
    setPage(1);
  }

  const hasFilters =
    selectedTypes.length > 0 ||
    selectedStages.length > 0 ||
    selectedSectors.length > 0 ||
    selectedGeo.length > 0;

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const filtersContent = (
    <div className="space-y-6">
      {/* Type */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-foreground">Type</h4>
        <div className="space-y-2">
          {VC_TYPES.map((t) => (
            <div key={t.value} className="flex items-center gap-2">
              <Checkbox
                id={`type-${t.value}`}
                checked={selectedTypes.includes(t.value)}
                onCheckedChange={() =>
                  toggleFilter(t.value, selectedTypes, setSelectedTypes)
                }
              />
              <Label htmlFor={`type-${t.value}`} className="text-sm font-normal cursor-pointer">
                {t.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Stage */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-foreground">Stage</h4>
        <div className="space-y-2">
          {STAGE_OPTIONS.map((s) => (
            <div key={s.value} className="flex items-center gap-2">
              <Checkbox
                id={`stage-${s.value}`}
                checked={selectedStages.includes(s.value)}
                onCheckedChange={() =>
                  toggleFilter(s.value, selectedStages, setSelectedStages)
                }
              />
              <Label htmlFor={`stage-${s.value}`} className="text-sm font-normal cursor-pointer">
                {s.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Sector */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-foreground">Sector</h4>
        <div className="space-y-2">
          {SECTOR_OPTIONS.map((s) => (
            <div key={s.value} className="flex items-center gap-2">
              <Checkbox
                id={`sector-${s.value}`}
                checked={selectedSectors.includes(s.value)}
                onCheckedChange={() =>
                  toggleFilter(s.value, selectedSectors, setSelectedSectors)
                }
              />
              <Label htmlFor={`sector-${s.value}`} className="text-sm font-normal cursor-pointer">
                {s.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Geography */}
      <div>
        <h4 className="mb-3 text-sm font-semibold text-foreground">Geography</h4>
        <div className="space-y-2">
          {GEO_OPTIONS.map((g) => (
            <div key={g.value} className="flex items-center gap-2">
              <Checkbox
                id={`geo-${g.value}`}
                checked={selectedGeo.includes(g.value)}
                onCheckedChange={() =>
                  toggleFilter(g.value, selectedGeo, setSelectedGeo)
                }
              />
              <Label htmlFor={`geo-${g.value}`} className="text-sm font-normal cursor-pointer">
                {g.label}
              </Label>
            </div>
          ))}
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
        <h1 className="text-2xl font-bold text-foreground">Discover VCs</h1>
        <p className="mt-1 text-muted-foreground">
          Find the right investors for your startup.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
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
          <div className="sticky top-0 rounded-lg border bg-card p-4">
            <h3 className="mb-4 font-semibold text-foreground">Filters</h3>
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
                  <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-xs font-bold text-primary">
                    {selectedTypes.length +
                      selectedStages.length +
                      selectedSectors.length +
                      selectedGeo.length}
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
            <p className="text-sm text-muted-foreground">
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
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() => router.push(`/vc/${vc.slug}`)}
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
                          <h3 className="truncate font-semibold text-foreground">
                            {vc.name}
                          </h3>
                          <Badge variant="secondary" className="mt-0.5 text-xs">
                            {TYPE_LABELS[vc.type] || vc.type}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/outreach/compose/${vc.id}`);
                          }}
                          className="p-1 transition-colors"
                          aria-label="Send pitch email"
                          title="Send pitch email"
                        >
                          <Mail className="h-4 w-4 text-muted-foreground/50 hover:text-primary" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSave(vc.id); }}
                          disabled={togglingId === vc.id}
                          className="p-1 transition-colors"
                          aria-label={savedIds.has(vc.id) ? 'Unsave' : 'Save'}
                        >
                          <Heart
                            className={`h-5 w-5 ${
                              savedIds.has(vc.id)
                                ? 'fill-red-500 text-red-500'
                                : 'text-muted-foreground/50 hover:text-red-400'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Stages */}
                    {vc.investment_stages && vc.investment_stages.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {vc.investment_stages.map((stage) => (
                          <span
                            key={stage}
                            className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            {STAGE_LABELS[stage] || stage}
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
                            className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                          >
                            {SECTOR_LABELS[sector] || sector}
                          </span>
                        ))}
                        {vc.sectors.length > 3 && (
                          <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                            +{vc.sectors.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bottom row */}
                    <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
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
              <Search className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                No VCs found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
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
