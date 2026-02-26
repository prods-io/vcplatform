'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Send,
  Eye,
  MousePointerClick,
  AlertCircle,
  PackageOpen,
  Loader2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface OutreachEmail {
  id: string;
  subject: string;
  to_email: string;
  to_name: string | null;
  status: string;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  vc_firms: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; Icon: React.ElementType }
> = {
  sending: {
    label: 'Sending…',
    className: 'bg-secondary text-secondary-foreground',
    Icon: Loader2,
  },
  sent: {
    label: 'Sent',
    className: 'bg-blue-900/30 text-blue-300',
    Icon: Send,
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-blue-900/40 text-blue-200',
    Icon: PackageOpen,
  },
  opened: {
    label: 'Opened',
    className: 'bg-amber-900/30 text-amber-300',
    Icon: Eye,
  },
  clicked: {
    label: 'Clicked',
    className: 'bg-green-900/30 text-green-300',
    Icon: MousePointerClick,
  },
  bounced: {
    label: 'Bounced',
    className: 'bg-red-900/30 text-red-300',
    Icon: AlertCircle,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-900/30 text-red-300',
    Icon: AlertCircle,
  },
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function OutreachPage() {
  const supabase = createBrowserClient();
  const [emails, setEmails] = useState<OutreachEmail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmails() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('outreach_emails')
        .select(
          `id, subject, to_email, to_name, status, sent_at, opened_at, clicked_at,
           vc_firms ( id, name, slug )`
        )
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });

      setEmails((data as unknown as OutreachEmail[]) ?? []);
      setLoading(false);
    }

    fetchEmails();
  }, [supabase]);

  const openedCount = emails.filter((e) =>
    ['opened', 'clicked'].includes(e.status)
  ).length;
  const clickedCount = emails.filter((e) => e.status === 'clicked').length;
  const openRate =
    emails.length > 0 ? Math.round((openedCount / emails.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Outreach</h1>
          <p className="mt-1 text-muted-foreground">
            Track the emails you&apos;ve sent to investors.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/discover">
            <Mail className="mr-2 h-4 w-4" />
            Find VCs to Email
          </Link>
        </Button>
      </div>

      {/* Stats strip */}
      {!loading && emails.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              label: 'Total Sent',
              value: emails.length,
              className: 'text-blue-400',
              bg: 'bg-blue-900/20',
            },
            {
              label: 'Opened',
              value: openedCount,
              className: 'text-amber-400',
              bg: 'bg-amber-900/20',
            },
            {
              label: 'Clicked',
              value: clickedCount,
              className: 'text-green-400',
              bg: 'bg-green-900/20',
            },
            {
              label: 'Open Rate',
              value: `${openRate}%`,
              className: 'text-primary',
              bg: 'bg-primary/10',
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
                >
                  <TrendingUp className={`h-5 w-5 ${stat.className}`} />
                </div>
                <div>
                  <p className={`text-xl font-bold ${stat.className}`}>
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && emails.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center">
          <Mail className="h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            No emails sent yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Discover investors and send them your pitch directly from the platform.
          </p>
          <Button asChild className="mt-5">
            <Link href="/dashboard/discover">Discover VCs</Link>
          </Button>
        </div>
      )}

      {/* Email list */}
      {!loading && emails.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Emails</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {emails.map((email) => {
                const firm = email.vc_firms;
                const cfg = STATUS_CONFIG[email.status] ?? STATUS_CONFIG.sent;
                const { Icon } = cfg;

                return (
                  <div
                    key={email.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-accent/40 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {firm?.name ? (
                        getInitials(firm.name)
                      ) : (
                        <Mail className="h-4 w-4" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {firm?.name ?? email.to_name ?? email.to_email}
                      </p>
                      <p className="truncate text-sm text-muted-foreground">
                        {email.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {email.to_email}
                        {email.sent_at &&
                          ` · ${new Date(email.sent_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}`}
                        {email.opened_at && ` · Opened ${new Date(email.opened_at).toLocaleDateString()}`}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Badge className={`gap-1.5 ${cfg.className}`}>
                        <Icon
                          className={`h-3 w-3 ${email.status === 'sending' ? 'animate-spin' : ''}`}
                        />
                        {cfg.label}
                      </Badge>

                      {firm?.slug && (
                        <Link
                          href={`/vc/${firm.slug}`}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                          title="View VC profile"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
