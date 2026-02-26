'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Send,
  Mail,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface VCFirm {
  id: string;
  name: string;
  slug: string;
  type: string;
  email: string | null;
  headquarters: string | null;
  sectors: string[];
  investment_stages: string[];
}

interface UserData {
  id: string;
  email: string;
  full_name: string;
  startup_name?: string;
  startup_stage?: string;
  startup_description?: string;
  startup_city?: string;
  startup_country?: string;
  startup_sector?: string[];
}

export default function ComposePage() {
  const params = useParams();
  const router = useRouter();
  const vcId = params.vcId as string;
  const supabase = createBrowserClient();

  const [vc, setVc] = useState<VCFirm | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [toEmail, setToEmail] = useState('');
  const [toName, setToName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    async function loadData() {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }

      const [vcRes, profileRes, startupRes] = await Promise.all([
        supabase
          .from('vc_firms')
          .select('id, name, slug, type, email, headquarters, sectors, investment_stages')
          .eq('id', vcId)
          .single(),
        supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', authUser.id)
          .single(),
        supabase
          .from('startups')
          .select('name, stage, sector, location_city, location_country, description, tagline')
          .eq('founder_id', authUser.id)
          .single(),
      ]);

      const vcData = vcRes.data as VCFirm | null;
      const profile = profileRes.data;
      const startup = startupRes.data;

      const userData: UserData = {
        id: authUser.id,
        email: profile?.email || authUser.email || '',
        full_name: profile?.full_name || authUser.email?.split('@')[0] || 'Founder',
        startup_name: startup?.name,
        startup_stage: startup?.stage || undefined,
        startup_description: startup?.description || startup?.tagline || undefined,
        startup_city: startup?.location_city || undefined,
        startup_country: startup?.location_country || undefined,
        startup_sector: (startup?.sector as string[] | null) || undefined,
      };

      if (vcData) {
        setVc(vcData);
        setToEmail(vcData.email || '');
        setToName(vcData.name);
      }
      setUser(userData);

      // Build pre-filled subject + body
      if (vcData) {
        const startupName = startup?.name || 'My Startup';
        const stageStr = startup?.stage ? `${startup.stage} ` : '';
        const sectorList = (startup?.sector as string[] | null)?.slice(0, 2).join(' & ') || '';
        const locationParts = [startup?.location_city, startup?.location_country].filter(Boolean);
        const location = locationParts.join(', ');
        const vcSectors = vcData.sectors?.slice(0, 3).join(', ');

        setSubject(
          `Introduction: ${startupName}${stageStr ? ` — ${stageStr}startup` : ''}${sectorList ? ` in ${sectorList}` : ''}`
        );

        const descLine =
          startup?.description || startup?.tagline
            ? `\n${startup.description || startup.tagline}\n`
            : '';

        setBody(
          `Hi ${vcData.name} team,\n\n` +
            `My name is ${userData.full_name}, and I'm the founder of ${startupName}, a ${stageStr}startup` +
            `${sectorList ? ` in ${sectorList}` : ''}${location ? ` based in ${location}` : ''}.` +
            `${descLine}\n` +
            `We are currently fundraising and believe ${vcData.name} would be an excellent partner${vcSectors ? ` given your focus on ${vcSectors}` : ''}.\n\n` +
            `I'd love to schedule a brief 20-minute call to share more about what we're building and explore potential fit.\n\n` +
            `Best regards,\n${userData.full_name}\n${startupName}\n${userData.email}`
        );
      }

      setLoading(false);
    }

    loadData();
  }, [vcId, supabase, router]);

  async function handleSend() {
    if (!toEmail.trim()) {
      toast.error('Please enter a recipient email address.');
      return;
    }
    if (!subject.trim() || !body.trim()) {
      toast.error('Subject and message are required.');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vc_firm_id: vcId,
          to_email: toEmail.trim(),
          to_name: toName.trim() || undefined,
          subject: subject.trim(),
          body: body.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to send email');

      toast.success('Email sent successfully!');
      router.push('/dashboard/outreach');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!vc) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground" />
        <p className="mt-4 font-semibold">VC not found.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard/discover">Back to Discover</Link>
        </Button>
      </div>
    );
  }

  const initials = vc.name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/outreach"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Outreach
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Compose Email</h1>
        <p className="mt-1 text-muted-foreground">
          Send a pitch email to {vc.name}
        </p>
      </div>

      {/* VC info chip */}
      <Card className="bg-muted/30 border-dashed">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-foreground">{vc.name}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {vc.type}
              </Badge>
              {vc.headquarters && (
                <span className="text-xs text-muted-foreground">{vc.headquarters}</span>
              )}
            </div>
          </div>
          <Link
            href={`/vc/${vc.slug}`}
            className="text-xs text-primary hover:underline shrink-0"
            target="_blank"
          >
            View profile →
          </Link>
        </CardContent>
      </Card>

      {/* Compose form */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="h-5 w-5 text-primary" />
            New Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-2">
            <Label htmlFor="to-email">
              To (Email Address) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="to-email"
              type="email"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              placeholder="contact@vcfirm.com"
            />
            {!vc.email && (
              <p className="flex items-center gap-1.5 text-xs text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                No email found in our database for this VC. Please enter their contact email.
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="to-name">To (Name / Firm)</Label>
            <Input
              id="to-name"
              value={toName}
              onChange={(e) => setToName(e.target.value)}
              placeholder="VC Firm Name or Partner Name"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="subject">
              Subject <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="body">
              Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your pitch email..."
              rows={18}
              className="resize-y font-mono text-sm leading-relaxed"
            />
            <p className="text-xs text-muted-foreground">
              {body.length} characters
            </p>
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Replies will go to{' '}
              <span className="font-medium text-foreground">{user?.email}</span>
            </p>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/outreach">Cancel</Link>
              </Button>
              <Button onClick={handleSend} disabled={sending} className="gap-2">
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {sending ? 'Sending…' : 'Send Email'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
