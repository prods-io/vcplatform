'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  SECTORS,
  STAGES,
  TEAM_SIZES,
} from '@/lib/utils/constants';

const STEPS = [
  { number: 1, title: 'Personal Info' },
  { number: 2, title: 'Startup Info' },
  { number: 3, title: 'Fundraising' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createBrowserClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Step 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [bio, setBio] = useState('');

  // Step 2: Startup Info
  const [startupName, setStartupName] = useState('');
  const [tagline, setTagline] = useState('');
  const [selectedSectors, setSelectedSectors] = useState<string[]>([]);
  const [stage, setStage] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [locationCountry, setLocationCountry] = useState('');
  const [teamSize, setTeamSize] = useState('');

  // Step 3: Fundraising
  const [fundingRaised, setFundingRaised] = useState('');
  const [fundingTarget, setFundingTarget] = useState('');
  const [website, setWebsite] = useState('');
  const [pitchDeckUrl, setPitchDeckUrl] = useState('');

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email || '');

      // Pre-fill name from auth metadata if available
      if (user.user_metadata?.full_name) {
        setFullName(user.user_metadata.full_name);
      }
    };

    getUser();
  }, [supabase, router]);

  const toggleSector = (sector: string) => {
    setSelectedSectors((prev) =>
      prev.includes(sector)
        ? prev.filter((s) => s !== sector)
        : [...prev, sector]
    );
  };

  const saveStep1 = async () => {
    if (!fullName.trim()) {
      toast.error('Full name is required.');
      return false;
    }

    if (!userId) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: userId,
        email: userEmail,
        full_name: fullName.trim(),
        linkedin_url: linkedinUrl.trim() || null,
        bio: bio.trim() || null,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        toast.error('Failed to save profile. ' + error.message);
        return false;
      }

      return true;
    } catch {
      toast.error('An unexpected error occurred.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const saveStep2 = async () => {
    if (!startupName.trim()) {
      toast.error('Startup name is required.');
      return false;
    }

    if (!userId) return false;

    setIsLoading(true);
    try {
      const { error } = await supabase.from('startups').upsert(
        {
          founder_id: userId,
          name: startupName.trim(),
          tagline: tagline.trim() || null,
          sector: selectedSectors.length > 0 ? selectedSectors : null,
          stage: stage || null,
          location_city: locationCity.trim() || null,
          location_country: locationCountry.trim() || null,
          team_size: teamSize || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'founder_id',
        }
      );

      if (error) {
        toast.error('Failed to save startup info. ' + error.message);
        return false;
      }

      return true;
    } catch {
      toast.error('An unexpected error occurred.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const saveStep3 = async () => {
    if (!userId) return false;

    setIsLoading(true);
    try {
      const { error: startupError } = await supabase
        .from('startups')
        .update({
          funding_raised: fundingRaised ? parseFloat(fundingRaised) : null,
          funding_target: fundingTarget ? parseFloat(fundingTarget) : null,
          website: website.trim() || null,
          pitch_deck_url: pitchDeckUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('founder_id', userId);

      if (startupError) {
        toast.error('Failed to save fundraising info. ' + startupError.message);
        return false;
      }

      // Mark onboarding as completed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        toast.error('Failed to complete onboarding. ' + profileError.message);
        return false;
      }

      return true;
    } catch {
      toast.error('An unexpected error occurred.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    let success = false;

    if (currentStep === 1) {
      success = await saveStep1();
    } else if (currentStep === 2) {
      success = await saveStep2();
    } else if (currentStep === 3) {
      success = await saveStep3();
      if (success) {
        toast.success('Onboarding completed! Welcome aboard.');
        router.push('/dashboard');
        router.refresh();
        return;
      }
    }

    if (success && currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    if (currentStep === 1) {
      // Can't skip step 1 since name is required
      toast.error('Please fill in your name to continue.');
      return;
    }

    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Skipping final step - still complete onboarding
      if (!userId) return;

      setIsLoading(true);
      try {
        const { error } = await supabase
          .from('profiles')
          .update({
            onboarding_completed: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          toast.error('Failed to complete onboarding.');
          return;
        }

        toast.success('Onboarding completed! Welcome aboard.');
        router.push('/dashboard');
        router.refresh();
      } catch {
        toast.error('An unexpected error occurred.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    currentStep === step.number
                      ? 'bg-primary text-primary-foreground'
                      : currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {currentStep > step.number ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="2.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`mt-1 text-xs font-medium ${
                    currentStep === step.number
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-3 mt-[-1rem] h-0.5 w-16 transition-colors ${
                    currentStep > step.number ? 'bg-green-500' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="shadow-lg border-0">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Personal Information</CardTitle>
                <CardDescription>
                  Tell us about yourself so investors can get to know you.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    type="url"
                    placeholder="https://linkedin.com/in/yourprofile"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="A brief introduction about yourself, your background, and what drives you..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Startup Info */}
          {currentStep === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Startup Information</CardTitle>
                <CardDescription>
                  Tell us about your startup so we can match you with the right
                  investors.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="startupName">
                    Startup name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="startupName"
                    placeholder="Your Startup Inc."
                    value={startupName}
                    onChange={(e) => setStartupName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagline">Tagline</Label>
                  <Input
                    id="tagline"
                    placeholder="A one-line description of what you do"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sector(s)</Label>
                  <div className="flex flex-wrap gap-2">
                    {SECTORS.map((sector) => (
                      <button
                        key={sector.value}
                        type="button"
                        onClick={() => toggleSector(sector.value)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                          selectedSectors.includes(sector.value)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {sector.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stage">Stage</Label>
                  <Select value={stage} onValueChange={setStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      placeholder="San Francisco"
                      value={locationCity}
                      onChange={(e) => setLocationCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      placeholder="United States"
                      value={locationCountry}
                      onChange={(e) => setLocationCountry(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team size</Label>
                  <Select value={teamSize} onValueChange={setTeamSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Fundraising */}
          {currentStep === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-xl">Fundraising Details</CardTitle>
                <CardDescription>
                  Share your fundraising progress and goals. You can update these
                  later.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fundingRaised">Funding raised (USD)</Label>
                    <Input
                      id="fundingRaised"
                      type="number"
                      placeholder="0"
                      value={fundingRaised}
                      onChange={(e) => setFundingRaised(e.target.value)}
                      min="0"
                      step="1000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fundingTarget">Funding target (USD)</Label>
                    <Input
                      id="fundingTarget"
                      type="number"
                      placeholder="500000"
                      value={fundingTarget}
                      onChange={(e) => setFundingTarget(e.target.value)}
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://yourstartup.com"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pitchDeck">Pitch deck URL</Label>
                  <Input
                    id="pitchDeck"
                    type="url"
                    placeholder="https://docsend.com/view/your-deck"
                    value={pitchDeckUrl}
                    onChange={(e) => setPitchDeckUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Link to your pitch deck on DocSend, Google Drive, or similar
                    service.
                  </p>
                </div>
              </CardContent>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between border-t px-6 py-4">
            <div>
              {currentStep > 1 && (
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={isLoading}
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isLoading}
                >
                  Skip
                </Button>
              )}
              <Button onClick={handleNext} disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Saving...
                  </span>
                ) : currentStep === 3 ? (
                  'Complete setup'
                ) : (
                  'Next'
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
