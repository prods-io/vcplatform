'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface Founder {
  id: string;
  full_name: string | null;
  email: string | null;
  linkedin_url: string | null;
  created_at: string;
  startups:
    | {
        name: string | null;
        stage: string | null;
      }[]
    | null;
}

const PAGE_SIZE = 15;

export default function AdminFoundersPage() {
  const supabase = createBrowserClient();
  const [founders, setFounders] = useState<Founder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const fetchFounders = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select(
          'id, full_name, email, linkedin_url, created_at, startups(name, stage)',
          { count: 'exact' }
        )
        .eq('role', 'founder')
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.or(
          `full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`
        );
      }

      const { data, count, error } = await query;
      if (error) throw error;

      setFounders((data as unknown as Founder[]) ?? []);
      setTotalCount(count ?? 0);
    } catch (err) {
      console.error('Error fetching founders:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, page, search]);

  useEffect(() => {
    fetchFounders();
  }, [fetchFounders]);

  useEffect(() => {
    setPage(0);
  }, [search]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Founders</h2>
        <p className="text-muted-foreground">
          Registered founders on the platform (read-only).
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or email..."
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
                    Email
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    LinkedIn
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Startup
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Stage
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : founders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      {search
                        ? 'No founders match your search.'
                        : 'No founders have registered yet.'}
                    </td>
                  </tr>
                ) : (
                  founders.map((founder) => {
                    const startup = founder.startups?.[0];
                    return (
                      <tr
                        key={founder.id}
                        className="border-b transition-colors hover:bg-gray-50/50"
                      >
                        <td className="px-4 py-3 font-medium">
                          {founder.full_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {founder.email || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {founder.linkedin_url ? (
                            <a
                              href={founder.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                            >
                              View
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {startup?.name || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {startup?.stage ? (
                            <Badge variant="secondary" className="text-xs">
                              {startup.stage}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDate(founder.created_at)}
                        </td>
                      </tr>
                    );
                  })
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
    </div>
  );
}
