export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  FileText,
  TrendingUp,
  Bookmark,
  Eye,
  Target,
  ArrowRight,
  Building2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  const { count: totalVCsCount } = await supabase
    .from('vc_firms')
    .select('*', { count: 'exact', head: true });

  const { count: savedCount } = await supabase
    .from('saved_vcs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { data: latestAnalysis } = await supabase
    .from('pitch_deck_analyses')
    .select('score')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const { data: recentSaved } = await supabase
    .from('saved_vcs')
    .select(`
      id,
      status,
      created_at,
      vc_firms (
        id,
        name,
        type,
        headquarters,
        logo_url
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const firstName = profile?.full_name?.split(' ')[0] ?? user.email?.split('@')[0] ?? 'there';
  const pitchScore = latestAnalysis?.score ?? null;

  const stats = [
    {
      label: 'Total VCs Discovered',
      value: totalVCsCount?.toLocaleString() ?? '0',
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Saved VCs',
      value: savedCount?.toString() ?? '0',
      icon: Bookmark,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Profile Views',
      value: '--',
      icon: Eye,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Pitch Score',
      value: pitchScore !== null ? `${pitchScore}/100` : 'N/A',
      icon: Target,
      color: pitchScore !== null && pitchScore >= 70 ? 'text-green-600' : pitchScore !== null && pitchScore >= 50 ? 'text-yellow-600' : 'text-gray-600',
      bg: pitchScore !== null && pitchScore >= 70 ? 'bg-green-50' : pitchScore !== null && pitchScore >= 50 ? 'bg-yellow-50' : 'bg-gray-50',
    },
  ];

  function getInitials(name: string) {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  const statusColors: Record<string, string> = {
    saved: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    in_conversation: 'bg-green-100 text-green-700',
    passed: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-gray-500">
          Here&apos;s what&apos;s happening with your fundraising journey.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
                >
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50">
              <Search className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Discover VCs</h3>
              <p className="mt-1 text-sm text-gray-500">
                Find investors that match your startup&apos;s stage, sector, and geography.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/discover">
                Browse VCs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Upload Pitch Deck</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get AI-powered feedback on your pitch deck and improve your score.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/pitch-deck">
                Upload Deck <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent saved VCs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recently Saved VCs</CardTitle>
          {(recentSaved?.length ?? 0) > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/saved">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!recentSaved || recentSaved.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bookmark className="h-10 w-10 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-900">No saved VCs yet</p>
              <p className="mt-1 text-sm text-gray-500">
                Start discovering and saving VCs that match your startup.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/dashboard/discover">Discover VCs</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentSaved.map((item: any) => {
                const firm = item.vc_firms;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-gray-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                      {firm?.name ? getInitials(firm.name) : <Building2 className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">
                        {firm?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {firm?.headquarters ?? 'Location unknown'}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={statusColors[item.status] ?? statusColors.saved}
                    >
                      {item.status?.replace('_', ' ') ?? 'saved'}
                    </Badge>
                    <p className="hidden text-xs text-gray-400 sm:block">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
