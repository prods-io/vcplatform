'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Globe,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

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
  'Gaming',
  'IoT',
  'Logistics',
  'PropTech',
  'FoodTech',
  'LegalTech',
  'InsurTech',
  'HRTech',
];

const STAGES = ['Idea', 'Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+'];

const TEAM_SIZES = ['Solo', '2-5', '6-10', '11-25', '26-50', '51-100', '100+'];

interface StartupData {
  id?: string;
  name: string;
  description: string;
  website: string;
  sector: string[];
  stage: string;
  team_size: string;
  founded_year: string;
  location_city: string;
  location_country: string;
  tagline: string;
  funding_raised: string;
  funding_target: string;
}

const emptyStartup: StartupData = {
  name: '',
  description: '',
  website: '',
  sector: [],
  stage: '',
  team_size: '',
  founded_year: '',
  location_city: '',
  location_country: '',
  tagline: '',
  funding_raised: '',
  funding_target: '',
};

export default function StartupPage() {
  const supabase = createBrowserClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<StartupData>(emptyStartup);
  const [startupId, setStartupId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data: startup } = await supabase
        .from('startups')
        .select('*')
        .eq('founder_id', user.id)
        .single();

      if (startup) {
        setStartupId(startup.id);
        setData({
          id: startup.id,
          name: startup.name ?? '',
          description: startup.description ?? '',
          website: startup.website ?? '',
          sector: startup.sector ?? [],
          stage: startup.stage ?? '',
          team_size: startup.team_size ?? '',
          founded_year: startup.founded_year?.toString() ?? '',
          location_city: startup.location_city ?? '',
          location_country: startup.location_country ?? '',
          tagline: startup.tagline ?? '',
          funding_raised: startup.funding_raised?.toString() ?? '',
          funding_target: startup.funding_target?.toString() ?? '',
        });
      }
      setLoading(false);
    }
    load();
  }, [supabase]);

  function toggleSector(sectorVal: string) {
    setData((prev) => ({
      ...prev,
      sector: prev.sector.includes(sectorVal)
        ? prev.sector.filter((s) => s !== sectorVal)
        : [...prev.sector, sectorVal],
    }));
  }

  function updateField(field: keyof StartupData, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);

    const payload = {
      founder_id: userId,
      name: data.name,
      slug: data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: data.description || null,
      website: data.website || null,
      tagline: data.tagline || null,
      sector: data.sector.length > 0 ? data.sector : null,
      stage: data.stage || null,
      team_size: data.team_size || null,
      founded_year: data.founded_year ? parseInt(data.founded_year) : null,
      location_city: data.location_city || null,
      location_country: data.location_country || null,
      funding_raised: data.funding_raised ? parseFloat(data.funding_raised) : null,
      funding_target: data.funding_target ? parseFloat(data.funding_target) : null,
    };

    let error;
    if (startupId) {
      const res = await supabase
        .from('startups')
        .update(payload)
        .eq('id', startupId);
      error = res.error;
    } else {
      const res = await supabase.from('startups').insert(payload).select().single();
      error = res.error;
      if (res.data) setStartupId(res.data.id);
    }

    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save startup profile.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Saved',
        description: 'Startup profile updated successfully.',
      });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-5 w-72" />
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Startup</h1>
          <p className="mt-1 text-muted-foreground">
            Tell VCs about your startup. A complete profile improves your visibility.
          </p>
        </div>
        {startupId && (
          <Button variant="outline" size="sm" asChild>
            <a href={`/startup/${startupId}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Preview
            </a>
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Startup Name *</Label>
                  <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Acme Inc."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={data.website}
                    onChange={(e) => updateField('website', e.target.value)}
                    placeholder="https://example.com"
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={data.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Briefly describe what your startup does..."
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={data.tagline}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  placeholder="We help X do Y by Z."
                  className="mt-1"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="stage">Stage</Label>
                  <Select
                    value={data.stage}
                    onValueChange={(v) => updateField('stage', v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="team_size">Team Size</Label>
                  <Select
                    value={data.team_size}
                    onValueChange={(v) => updateField('team_size', v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_SIZES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="founded_year">Founded Year</Label>
                  <Input
                    id="founded_year"
                    type="number"
                    value={data.founded_year}
                    onChange={(e) => updateField('founded_year', e.target.value)}
                    placeholder="2024"
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="location_city">City</Label>
                  <Input
                    id="location_city"
                    value={data.location_city}
                    onChange={(e) => updateField('location_city', e.target.value)}
                    placeholder="San Francisco"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="location_country">Country</Label>
                  <Input
                    id="location_country"
                    value={data.location_country}
                    onChange={(e) => updateField('location_country', e.target.value)}
                    placeholder="United States"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Funding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Globe className="h-5 w-5 text-primary" />
                Funding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="funding_raised">Total Funding Raised (USD)</Label>
                  <Input
                    id="funding_raised"
                    type="number"
                    value={data.funding_raised}
                    onChange={(e) => updateField('funding_raised', e.target.value)}
                    placeholder="0"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="funding_target">Funding Target (USD)</Label>
                  <Input
                    id="funding_target"
                    type="number"
                    value={data.funding_target}
                    onChange={(e) => updateField('funding_target', e.target.value)}
                    placeholder="500000"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sectors sidebar */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Sectors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Select all sectors that apply to your startup.
              </p>
              <div className="space-y-2">
                {SECTORS.map((sector) => (
                  <div key={sector} className="flex items-center gap-2">
                    <Checkbox
                      id={`sector-${sector}`}
                      checked={data.sector.includes(sector)}
                      onCheckedChange={() => toggleSector(sector)}
                    />
                    <Label
                      htmlFor={`sector-${sector}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {sector}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end border-t pt-4">
        <Button onClick={handleSave} disabled={saving || !data.name.trim()} size="lg">
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? 'Saving...' : 'Save Startup Profile'}
        </Button>
      </div>
    </div>
  );
}
