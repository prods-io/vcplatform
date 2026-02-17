'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface VCFirm {
  id: string;
  name: string;
  type: string | null;
  investment_stages: string[] | null;
  headquarters: string | null;
  check_size_min: number | null;
  check_size_max: number | null;
  is_active: boolean;
}

const PAGE_SIZE = 15;

function formatCheckSize(min: number | null, max: number | null): string {
  const fmt = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
    return `$${n}`;
  };
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Up to ${fmt(max)}`;
  return '-';
}

export default function AdminVCsPage() {
  const supabase = createBrowserClient();
  const [firms, setFirms] = useState<VCFirm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<VCFirm | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchFirms = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('vc_firms')
        .select(
          'id, name, type, investment_stages, headquarters, check_size_min, check_size_max, is_active',
          { count: 'exact' }
        )
        .order('name', { ascending: true })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`);
      }

      const { data, count, error } = await query;
      if (error) throw error;

      setFirms(data ?? []);
      setTotalCount(count ?? 0);
    } catch (error) {
      console.error('Error fetching VC firms:', error);
    } finally {
      setLoading(false);
    }
  }, [supabase, page, search]);

  useEffect(() => {
    fetchFirms();
  }, [fetchFirms]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('vc_firms')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      setDeleteTarget(null);
      fetchFirms();
    } catch (error) {
      console.error('Error deleting VC firm:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">VC Firms</h2>
          <p className="text-muted-foreground">
            Manage venture capital firms on the platform.
          </p>
        </div>
        <Link href="/admin/vcs/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add New VC
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Stages
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    HQ
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Check Size
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Active
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : firms.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      {search
                        ? 'No VC firms match your search.'
                        : 'No VC firms yet. Add one to get started.'}
                    </td>
                  </tr>
                ) : (
                  firms.map((firm) => (
                    <tr
                      key={firm.id}
                      className="border-b transition-colors hover:bg-gray-50/50"
                    >
                      <td className="px-4 py-3 font-medium">{firm.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {firm.type ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {firm.investment_stages?.slice(0, 2).map((stage) => (
                            <Badge
                              key={stage}
                              variant="secondary"
                              className="text-xs"
                            >
                              {stage}
                            </Badge>
                          ))}
                          {(firm.investment_stages?.length ?? 0) > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{firm.investment_stages!.length - 2}
                            </Badge>
                          )}
                          {!firm.investment_stages?.length && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {firm.headquarters ?? '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatCheckSize(
                          firm.check_size_min,
                          firm.check_size_max
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={firm.is_active ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {firm.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/admin/vcs/${firm.id}/edit`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(firm)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Showing {page * PAGE_SIZE + 1}-
                {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete VC Firm</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteTarget?.name}</span>? This
              action cannot be undone. All associated partners will also be
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
