'use client';

import { useEffect, useState, useCallback } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
} from 'lucide-react';

interface VCFirm {
  id: string;
  name: string;
}

interface Partner {
  id: string;
  name: string;
  title: string | null;
  vc_firm_id: string;
  linkedin_url: string | null;
  twitter_url: string | null;
  email: string | null;
  bio: string | null;
  vc_firms: {
    name: string;
  } | null;
}

interface PartnerForm {
  name: string;
  title: string;
  vc_firm_id: string;
  linkedin_url: string;
  twitter_url: string;
  email: string;
  bio: string;
}

const emptyForm: PartnerForm = {
  name: '',
  title: '',
  vc_firm_id: '',
  linkedin_url: '',
  twitter_url: '',
  email: '',
  bio: '',
};

export default function AdminPartnersPage() {
  const supabase = createBrowserClient();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [vcFirms, setVcFirms] = useState<VCFirm[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PartnerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('vc_partners')
        .select('id, name, title, vc_firm_id, linkedin_url, twitter_url, email, bio, vc_firms(name)')
        .order('name', { ascending: true });

      if (error) throw error;
      setPartners((data as unknown as Partner[]) ?? []);
    } catch (err) {
      console.error('Error fetching partners:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchVcFirms = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('vc_firms')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setVcFirms(data ?? []);
    } catch (err) {
      console.error('Error fetching VC firms:', err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPartners();
    fetchVcFirms();
  }, [fetchPartners, fetchVcFirms]);

  const openAddDialog = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (partner: Partner) => {
    setEditingId(partner.id);
    setForm({
      name: partner.name,
      title: partner.title || '',
      vc_firm_id: partner.vc_firm_id,
      linkedin_url: partner.linkedin_url || '',
      twitter_url: partner.twitter_url || '',
      email: partner.email || '',
      bio: partner.bio || '',
    });
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);

    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (!form.vc_firm_id) {
      setFormError('VC Firm is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        title: form.title.trim() || null,
        vc_firm_id: form.vc_firm_id,
        linkedin_url: form.linkedin_url.trim() || null,
        twitter_url: form.twitter_url.trim() || null,
        email: form.email.trim() || null,
        bio: form.bio.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('vc_partners')
          .update(payload)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vc_partners')
          .insert(payload);
        if (error) throw error;
      }

      setDialogOpen(false);
      fetchPartners();
    } catch (err: any) {
      console.error('Error saving partner:', err);
      setFormError(err.message || 'Failed to save partner.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('vc_partners')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      setDeleteTarget(null);
      fetchPartners();
    } catch (err) {
      console.error('Error deleting partner:', err);
    } finally {
      setDeleting(false);
    }
  };

  const updateForm = (key: keyof PartnerForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">VC Partners</h2>
          <p className="text-muted-foreground">
            Manage individual partners at VC firms.
          </p>
        </div>
        <Button className="gap-2" onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          Add Partner
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    VC Firm
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    LinkedIn
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
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : partners.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      No partners yet. Add one to get started.
                    </td>
                  </tr>
                ) : (
                  partners.map((partner) => (
                    <tr
                      key={partner.id}
                      className="border-b transition-colors hover:bg-secondary/50"
                    >
                      <td className="px-4 py-3 font-medium">{partner.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {partner.title || '-'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {partner.vc_firms?.name || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {partner.linkedin_url ? (
                          <a
                            href={partner.linkedin_url}
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
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(partner)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(partner)}
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
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Partner' : 'Add Partner'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update partner details below.'
                : 'Fill in the details to add a new VC partner.'}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="rounded-lg border border-border bg-red-900/30 px-4 py-3 text-sm text-red-400">
              {formError}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partner-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="partner-name"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-title">Title</Label>
              <Input
                id="partner-title"
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="e.g. General Partner"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-firm">
                VC Firm <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.vc_firm_id}
                onValueChange={(val) => updateForm('vc_firm_id', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a VC firm" />
                </SelectTrigger>
                <SelectContent>
                  {vcFirms.map((firm) => (
                    <SelectItem key={firm.id} value={firm.id}>
                      {firm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-email">Email</Label>
              <Input
                id="partner-email"
                type="email"
                value={form.email}
                onChange={(e) => updateForm('email', e.target.value)}
                placeholder="john@vcfirm.com"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="partner-linkedin">LinkedIn URL</Label>
                <Input
                  id="partner-linkedin"
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) => updateForm('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partner-twitter">Twitter URL</Label>
                <Input
                  id="partner-twitter"
                  type="url"
                  value={form.twitter_url}
                  onChange={(e) => updateForm('twitter_url', e.target.value)}
                  placeholder="https://twitter.com/..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="partner-bio">Bio</Label>
              <Textarea
                id="partner-bio"
                value={form.bio}
                onChange={(e) => updateForm('bio', e.target.value)}
                placeholder="Short bio about this partner..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving
                ? 'Saving...'
                : editingId
                ? 'Save Changes'
                : 'Add Partner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Partner</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{' '}
              <span className="font-semibold">{deleteTarget?.name}</span>? This
              action cannot be undone.
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
