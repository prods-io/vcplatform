'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  Calendar,
  Building2,
  MessageSquare,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

type Status = 'all' | 'saved' | 'contacted' | 'in_conversation' | 'passed';

interface SavedVC {
  id: string;
  vc_firm_id: string;
  status: string;
  notes: string | null;
  created_at: string;
  vc_firms: {
    id: string;
    name: string;
    type: string;
    headquarters: string | null;
    logo_url: string | null;
    sectors: string[];
    investment_stages: string[];
  };
}

const STATUS_TABS: { label: string; value: Status }[] = [
  { label: 'All', value: 'all' },
  { label: 'Saved', value: 'saved' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'In Conversation', value: 'in_conversation' },
  { label: 'Passed', value: 'passed' },
];

const STATUS_OPTIONS = [
  { label: 'Saved', value: 'saved' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'In Conversation', value: 'in_conversation' },
  { label: 'Passed', value: 'passed' },
];

const statusColors: Record<string, string> = {
  saved: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  in_conversation: 'bg-green-100 text-green-700',
  passed: 'bg-gray-100 text-gray-700',
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function SavedVCsPage() {
  const supabase = createBrowserClient();
  const { toast } = useToast();

  const [items, setItems] = useState<SavedVC[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Status>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'saved' | 'contacted' | 'in_conversation' | 'passed'>('saved');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSaved();
  }, [activeTab]);

  async function fetchSaved() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let query = supabase
      .from('saved_vcs')
      .select(`
        id,
        vc_firm_id,
        status,
        notes,
        created_at,
        vc_firms (
          id,
          name,
          type,
          headquarters,
          logo_url,
          sectors,
          investment_stages
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (activeTab !== 'all') {
      query = query.eq('status', activeTab);
    }

    const { data } = await query;
    setItems((data as unknown as SavedVC[]) ?? []);
    setLoading(false);
  }

  function handleExpand(item: SavedVC) {
    if (expandedId === item.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(item.id);
    setEditNotes(item.notes ?? '');
    setEditStatus(item.status as typeof editStatus);
  }

  async function handleSave(id: string) {
    setSaving(true);
    const { error } = await supabase
      .from('saved_vcs')
      .update({ status: editStatus, notes: editNotes })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Updated', description: 'Changes saved successfully.' });
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: editStatus, notes: editNotes }
            : item
        )
      );
      setExpandedId(null);
    }
    setSaving(false);
  }

  async function handleRemove(id: string) {
    const { error } = await supabase.from('saved_vcs').delete().eq('id', id);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Removed', description: 'VC removed from saved list.' });
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (expandedId === id) setExpandedId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Saved VCs</h1>
        <p className="mt-1 text-gray-500">
          Manage your shortlisted investors and track conversations.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b pb-3">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setExpandedId(null);
            }}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Bookmark className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            {activeTab === 'all'
              ? 'No saved VCs yet'
              : `No VCs with status "${activeTab.replace('_', ' ')}"`}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Discover and save VCs that match your startup.
          </p>
          <Button asChild className="mt-4">
            <Link href="/dashboard/discover">
              <Search className="mr-2 h-4 w-4" />
              Discover VCs
            </Link>
          </Button>
        </div>
      )}

      {/* Items list */}
      {!loading && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const firm = item.vc_firms;
            const isExpanded = expandedId === item.id;

            return (
              <Card
                key={item.id}
                className={`transition-shadow ${isExpanded ? 'ring-2 ring-indigo-200' : ''}`}
              >
                <CardContent className="p-0">
                  {/* Main row */}
                  <button
                    onClick={() => handleExpand(item)}
                    className="flex w-full items-center gap-4 p-4 text-left"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                      {firm?.name ? getInitials(firm.name) : <Building2 className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold text-gray-900">
                          {firm?.name ?? 'Unknown'}
                        </p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {firm?.type ?? ''}
                        </Badge>
                      </div>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                        {firm?.headquarters && (
                          <span>{firm.headquarters}</span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {item.notes && !isExpanded && (
                        <p className="mt-1 truncate text-xs text-gray-400">
                          <MessageSquare className="mr-1 inline h-3 w-3" />
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <Badge
                      className={`shrink-0 ${statusColors[item.status] ?? statusColors.saved}`}
                    >
                      {item.status.replace('_', ' ')}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                    )}
                  </button>

                  {/* Expanded section */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-4">
                      {/* Stages and sectors */}
                      {firm?.investment_stages && firm.investment_stages.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Investment Stages
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {firm.investment_stages.map((s: string) => (
                              <span
                                key={s}
                                className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {firm?.sectors && firm.sectors.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Sectors
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {firm.sectors.map((s: string) => (
                              <span
                                key={s}
                                className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Status dropdown */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Status
                        </p>
                        <Select
                          value={editStatus}
                          onValueChange={(val) => setEditStatus(val as typeof editStatus)}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Notes */}
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Notes
                        </p>
                        <Textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Add personal notes about this VC..."
                          rows={3}
                        />
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          onClick={() => handleSave(item.id)}
                          disabled={saving}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedId(null)}
                        >
                          Cancel
                        </Button>
                        <div className="flex-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleRemove(item.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
