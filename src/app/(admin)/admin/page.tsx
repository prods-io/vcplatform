'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Users,
  Rocket,
  Briefcase,
  Plus,
  Download,
} from 'lucide-react';

interface Stats {
  vcFirms: number;
  partners: number;
  founders: number;
  startups: number;
}

export default function AdminDashboardPage() {
  const supabase = createBrowserClient();
  const [stats, setStats] = useState<Stats>({
    vcFirms: 0,
    partners: 0,
    founders: 0,
    startups: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [vcRes, partnerRes, founderRes, startupRes] = await Promise.all([
          supabase
            .from('vc_firms')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('vc_partners')
            .select('*', { count: 'exact', head: true }),
          supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'founder'),
          supabase
            .from('startups')
            .select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          vcFirms: vcRes.count ?? 0,
          partners: partnerRes.count ?? 0,
          founders: founderRes.count ?? 0,
          startups: startupRes.count ?? 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [supabase]);

  const statCards = [
    {
      title: 'Total VC Firms',
      value: stats.vcFirms,
      icon: Building2,
      color: 'text-blue-400',
      bg: 'bg-blue-900/30',
    },
    {
      title: 'Total Partners',
      value: stats.partners,
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-900/30',
    },
    {
      title: 'Total Founders',
      value: stats.founders,
      icon: Rocket,
      color: 'text-violet-400',
      bg: 'bg-violet-900/30',
    },
    {
      title: 'Total Startups',
      value: stats.startups,
      icon: Briefcase,
      color: 'text-amber-400',
      bg: 'bg-amber-900/30',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of the CapConnect platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className={`rounded-lg p-2 ${card.bg}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-16 animate-pulse rounded bg-secondary" />
                ) : (
                  <p className="text-3xl font-bold">{card.value}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Link href="/admin/vcs/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add VC Firm
            </Button>
          </Link>
          <Link href="/admin/seed">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Import Data
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest actions on the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                <p className="text-sm">
                  Activity tracking will be available in a future update.
                </p>
                <p className="mt-1 text-xs">
                  Platform stats are shown above.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
