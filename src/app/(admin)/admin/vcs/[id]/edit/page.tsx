'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import { SECTORS, STAGES, GEOGRAPHIES, VC_TYPES } from '@/lib/utils/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface FormData {
  name: string;
  slug: string;
  website: string;
  description: string;
  type: string;
  investment_stages: string[];
  sectors: string[];
  geographies: string[];
  check_size_min: string;
  check_size_max: string;
  fund_size: string;
  portfolio_count: string;
  founded_year: string;
  headquarters: string;
  email: string;
  linkedin_url: string;
  twitter_url: string;
  crunchbase_url: string;
  is_active: boolean;
}

export default function EditVCPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const supabase = createBrowserClient();

  const [form, setForm] = useState<FormData>({
    name: '',
    slug: '',
    website: '',
    description: '',
    type: '',
    investment_stages: [],
    sectors: [],
    geographies: [],
    check_size_min: '',
    check_size_max: '',
    fund_size: '',
    portfolio_count: '',
    founded_year: '',
    headquarters: '',
    email: '',
    linkedin_url: '',
    twitter_url: '',
    crunchbase_url: '',
    is_active: true,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchVC = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('vc_firms')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError || !data) {
          setNotFound(true);
          return;
        }

        setForm({
          name: data.name || '',
          slug: data.slug || '',
          website: data.website || '',
          description: data.description || '',
          type: data.type || '',
          investment_stages: data.investment_stages || [],
          sectors: data.sectors || [],
          geographies: data.geographies || [],
          check_size_min: data.check_size_min?.toString() || '',
          check_size_max: data.check_size_max?.toString() || '',
          fund_size: data.fund_size || '',
          portfolio_count: data.portfolio_count?.toString() || '',
          founded_year: data.founded_year?.toString() || '',
          headquarters: data.headquarters || '',
          email: data.email || '',
          linkedin_url: data.linkedin_url || '',
          twitter_url: data.twitter_url || '',
          crunchbase_url: data.crunchbase_url || '',
          is_active: data.is_active ?? true,
        });
      } catch (err) {
        console.error('Error fetching VC firm:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVC();
  }, [id, supabase]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'name') {
      setForm((prev) => ({ ...prev, slug: slugify(value as string) }));
    }
  };

  const toggleArrayItem = (key: 'investment_stages' | 'sectors' | 'geographies', item: string) => {
    setForm((prev) => {
      const arr = prev[key];
      return {
        ...prev,
        [key]: arr.includes(item)
          ? arr.filter((v) => v !== item)
          : [...arr, item],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug || slugify(form.name),
        website: form.website.trim() || null,
        description: form.description.trim() || null,
        type: form.type || 'vc',
        investment_stages: form.investment_stages.length > 0 ? form.investment_stages : [],
        sectors: form.sectors.length > 0 ? form.sectors : [],
        geographies: form.geographies.length > 0 ? form.geographies : [],
        check_size_min: form.check_size_min ? parseInt(form.check_size_min, 10) : null,
        check_size_max: form.check_size_max ? parseInt(form.check_size_max, 10) : null,
        fund_size: form.fund_size.trim() || null,
        portfolio_count: form.portfolio_count ? parseInt(form.portfolio_count, 10) : null,
        founded_year: form.founded_year ? parseInt(form.founded_year, 10) : null,
        headquarters: form.headquarters.trim() || null,
        email: form.email.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        twitter_url: form.twitter_url.trim() || null,
        crunchbase_url: form.crunchbase_url.trim() || null,
        is_active: form.is_active,
      };

      const { error: updateError } = await supabase
        .from('vc_firms')
        .update(payload)
        .eq('id', id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/admin/vcs');
      }, 1000);
    } catch (err: any) {
      console.error('Error updating VC firm:', err);
      setError(err.message || 'Failed to update VC firm.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 animate-pulse rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
            <div className="h-4 w-64 animate-pulse rounded bg-gray-200" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-10 animate-pulse rounded bg-gray-200" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold">VC Firm Not Found</h2>
        <p className="mt-2 text-muted-foreground">
          The VC firm you are looking for does not exist or has been deleted.
        </p>
        <Link href="/admin/vcs" className="mt-4">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to VC Firms
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/vcs">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Edit VC Firm</h2>
          <p className="text-muted-foreground">
            Update details for {form.name}.
          </p>
        </div>
      </div>

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          VC firm updated successfully! Redirecting...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Core details about the VC firm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Sequoia Capital"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => updateField('slug', e.target.value)}
                  placeholder="auto-generated-from-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Brief description of the VC firm..."
                rows={4}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(val) => updateField('type', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {VC_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="headquarters">Headquarters</Label>
                <Input
                  id="headquarters"
                  value={form.headquarters}
                  onChange={(e) => updateField('headquarters', e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) =>
                  updateField('is_active', checked === true)
                }
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active (visible on platform)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Investment Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Investment Preferences</CardTitle>
            <CardDescription>
              Stages, sectors, and geographies this firm focuses on.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Investment Stages</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {STAGES.map((stage) => (
                  <div key={stage.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`stage-${stage.value}`}
                      checked={form.investment_stages.includes(stage.value)}
                      onCheckedChange={() =>
                        toggleArrayItem('investment_stages', stage.value)
                      }
                    />
                    <Label
                      htmlFor={`stage-${stage.value}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {stage.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Sectors</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SECTORS.map((sector) => (
                  <div key={sector.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`sector-${sector.value}`}
                      checked={form.sectors.includes(sector.value)}
                      onCheckedChange={() =>
                        toggleArrayItem('sectors', sector.value)
                      }
                    />
                    <Label
                      htmlFor={`sector-${sector.value}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {sector.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Geographies</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {GEOGRAPHIES.map((geo) => (
                  <div key={geo.value} className="flex items-center gap-2">
                    <Checkbox
                      id={`geo-${geo.value}`}
                      checked={form.geographies.includes(geo.value)}
                      onCheckedChange={() =>
                        toggleArrayItem('geographies', geo.value)
                      }
                    />
                    <Label
                      htmlFor={`geo-${geo.value}`}
                      className="cursor-pointer text-sm font-normal"
                    >
                      {geo.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Details */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Details</CardTitle>
            <CardDescription>
              Fund size and check size information.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="check_size_min">Check Size Min ($)</Label>
                <Input
                  id="check_size_min"
                  type="number"
                  value={form.check_size_min}
                  onChange={(e) => updateField('check_size_min', e.target.value)}
                  placeholder="e.g. 100000"
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="check_size_max">Check Size Max ($)</Label>
                <Input
                  id="check_size_max"
                  type="number"
                  value={form.check_size_max}
                  onChange={(e) => updateField('check_size_max', e.target.value)}
                  placeholder="e.g. 5000000"
                  min={0}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="fund_size">Fund Size</Label>
                <Input
                  id="fund_size"
                  value={form.fund_size}
                  onChange={(e) => updateField('fund_size', e.target.value)}
                  placeholder="e.g. $500M"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolio_count">Portfolio Count</Label>
                <Input
                  id="portfolio_count"
                  type="number"
                  value={form.portfolio_count}
                  onChange={(e) =>
                    updateField('portfolio_count', e.target.value)
                  }
                  placeholder="e.g. 150"
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="founded_year">Founded Year</Label>
                <Input
                  id="founded_year"
                  type="number"
                  value={form.founded_year}
                  onChange={(e) => updateField('founded_year', e.target.value)}
                  placeholder="e.g. 2015"
                  min={1900}
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact & Social */}
        <Card>
          <CardHeader>
            <CardTitle>Contact & Social</CardTitle>
            <CardDescription>Contact info and social links.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="contact@vcfirm.com"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) => updateField('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/company/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter_url">Twitter URL</Label>
                <Input
                  id="twitter_url"
                  type="url"
                  value={form.twitter_url}
                  onChange={(e) => updateField('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="crunchbase_url">Crunchbase URL</Label>
                <Input
                  id="crunchbase_url"
                  type="url"
                  value={form.crunchbase_url}
                  onChange={(e) =>
                    updateField('crunchbase_url', e.target.value)
                  }
                  placeholder="https://crunchbase.com/organization/..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/admin/vcs">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
