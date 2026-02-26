export const dynamic = 'force-dynamic';

import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  FileText,
  TrendingUp,
  Bookmark,
  Mail,
  Target,
  ArrowRight,
  Building2,
  Send,
  Eye,
  MousePointerClick,
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

  const { count: emailsSentCount } = await supabase
    .from('outreach_emails')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { data: recentOutreach } = await supabase
    .from('outreach_emails')
    .select(`
      id,
      subject,
      status,
      sent_at,
      vc_firms (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false })
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
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Emails Sent',
      value: emailsSentCount?.toString() ?? '0',
      icon: Mail,
      color: 'text-green-400',
      bg: 'bg-green-900/30',
    },
    {
      label: 'Pitch Score',
      value: pitchScore !== null ? `${pitchScore}/100` : 'N/A',
      icon: Target,
      color: pitchScore !== null && pitchScore >= 70 ? 'text-green-400' : pitchScore !== null && pitchScore >= 50 ? 'text-yellow-400' : 'text-muted-foreground',
      bg: pitchScore !== null && pitchScore >= 70 ? 'bg-green-900/30' : pitchScore !== null && pitchScore >= 50 ? 'bg-yellow-900/30' : 'bg-secondary',
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
    passed: 'bg-secondary text-secondary-foreground',
  };

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
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
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Search className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Discover VCs</h3>
              <p className="mt-1 text-sm text-muted-foreground">
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-900/30">
              <FileText className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Upload Pitch Deck</h3>
              <p className="mt-1 text-sm text-muted-foreground">
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
              <Bookmark className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium text-foreground">No saved VCs yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
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
                    className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {firm?.name ? getInitials(firm.name) : <Building2 className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {firm?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {firm?.headquarters ?? 'Location unknown'}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={statusColors[item.status] ?? statusColors.saved}
                    >
                      {item.status?.replace('_', ' ') ?? 'saved'}
                    </Badge>
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Outreach */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Outreach</CardTitle>
          {(recentOutreach?.length ?? 0) > 0 && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/outreach">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!recentOutreach || recentOutreach.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Mail className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm font-medium text-foreground">No emails sent yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Send your pitch directly to investors from the platform.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-4">
                <Link href="/dashboard/discover">Discover VCs</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOutreach.map((item: any) => {
                const firm = item.vc_firms;
                const outreachStatusColors: Record<string, string> = {
                  sent: 'bg-blue-100 text-blue-700',
                  sending: 'bg-blue-100 text-blue-700',
                  delivered: 'bg-blue-100 text-blue-700',
                  opened: 'bg-amber-100 text-amber-700',
                  clicked: 'bg-green-100 text-green-700',
                  bounced: 'bg-red-100 text-red-700',
                  failed: 'bg-red-100 text-red-700',
                };
                const outreachStatusLabels: Record<string, string> = {
                  sent: 'Sent',
                  sending: 'Sending…',
                  delivered: 'Delivered',
                  opened: 'Opened',
                  clicked: 'Clicked',
                  bounced: 'Bounced',
                  failed: 'Failed',
                };
                const OutreachIcons: Record<string, React.ElementType> = {
                  sent: Send,
                  sending: Send,
                  delivered: Send,
                  opened: Eye,
                  clicked: MousePointerClick,
                  bounced: Mail,
                  failed: Mail,
                };
                const OutreachIcon = OutreachIcons[item.status] ?? Send;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-4 rounded-lg border p-3 transition-colors hover:bg-accent"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {firm?.name ? getInitials(firm.name) : <Mail className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {firm?.name ?? 'Unknown'}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.subject}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`gap-1 ${outreachStatusColors[item.status] ?? outreachStatusColors.sent}`}
                    >
                      <OutreachIcon className="h-3 w-3" />
                      {outreachStatusLabels[item.status] ?? 'Sent'}
                    </Badge>
                    <p className="hidden text-xs text-muted-foreground sm:block">
                      {item.sent_at ? new Date(item.sent_at).toLocaleDateString() : ''}
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
