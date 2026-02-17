'use client';

import { useEffect, useState } from 'react';
import { Loader2, User } from 'lucide-react';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';

interface ProfileData {
  full_name: string;
  email: string;
  linkedin_url: string;
  bio: string;
  avatar_url: string | null;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ProfilePage() {
  const supabase = createBrowserClient();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    email: '',
    linkedin_url: '',
    bio: '',
    avatar_url: null,
  });
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from('profiles')
        .select('full_name, linkedin_url, bio, avatar_url')
        .eq('id', user.id)
        .single();

      setProfile({
        full_name: data?.full_name ?? '',
        email: user.email ?? '',
        linkedin_url: data?.linkedin_url ?? '',
        bio: data?.bio ?? '',
        avatar_url: data?.avatar_url ?? null,
      });
      setLoading(false);
    }
    load();
  }, [supabase]);

  function updateField(field: keyof ProfileData, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        linkedin_url: profile.linkedin_url,
        bio: profile.bio,
      })
      .eq('id', userId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been saved successfully.',
      });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="mt-2 h-5 w-64" />
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="w-full max-w-md space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="mt-1 text-gray-500">
          Manage your personal information and preferences.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-5 w-5 text-indigo-600" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 pb-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-24 w-24 rounded-full object-cover border-4 border-gray-100"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-indigo-100 text-2xl font-bold text-indigo-700 border-4 border-gray-100">
                {profile.full_name
                  ? getInitials(profile.full_name)
                  : '?'}
              </div>
            )}
            <p className="text-lg font-semibold text-gray-900">
              {profile.full_name || 'Your Name'}
            </p>
          </div>

          {/* Full name */}
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              value={profile.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              placeholder="John Doe"
              className="mt-1"
            />
          </div>

          {/* Email (readonly) */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile.email}
              disabled
              readOnly
              className="mt-1 bg-gray-50 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              Email cannot be changed here.
            </p>
          </div>

          {/* LinkedIn */}
          <div>
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input
              id="linkedin_url"
              value={profile.linkedin_url}
              onChange={(e) => updateField('linkedin_url', e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
              className="mt-1"
            />
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => updateField('bio', e.target.value)}
              placeholder="Tell us a bit about yourself and your experience..."
              rows={4}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-gray-400">
              {profile.bio.length}/500 characters
            </p>
          </div>

          {/* Save */}
          <div className="flex justify-end border-t pt-4">
            <Button
              onClick={handleSave}
              disabled={saving || !profile.full_name.trim()}
              size="lg"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
