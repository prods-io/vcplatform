import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  MapPin,
  Users,
  Calendar,
  Linkedin,
  ExternalLink,
} from "lucide-react";

interface PageProps {
  params: { slug: string };
}

async function getStartup(slug: string) {
  const supabase = await createClient();
  const { data: startup, error } = await supabase
    .from("startups")
    .select("*, profiles(*)")
    .eq("slug", slug)
    .single();

  if (error || !startup) return null;
  return startup;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const startup = await getStartup(params.slug);
  if (!startup) {
    return { title: "Startup Not Found - VCConnect" };
  }

  return {
    title: `${startup.name} - VCConnect`,
    description:
      startup.tagline ||
      startup.description?.slice(0, 160) ||
      `Learn about ${startup.name} on VCConnect.`,
    openGraph: {
      title: `${startup.name} - VCConnect`,
      description:
        startup.tagline ||
        startup.description?.slice(0, 160) ||
        `Learn about ${startup.name} on VCConnect.`,
    },
  };
}

export default async function StartupProfilePage({ params }: PageProps) {
  const startup = await getStartup(params.slug);
  if (!startup) notFound();

  const founder = startup.profiles;

  const initials = startup.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const hasRaisingData =
    startup.funding_raised != null || startup.funding_target != null;

  const progressPercent =
    hasRaisingData && startup.funding_target && startup.funding_raised
      ? Math.min(
          Math.round((startup.funding_raised / startup.funding_target) * 100),
          100
        )
      : 0;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <Link
        href="/dashboard/discover"
        className="mb-8 inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Discovery
      </Link>

      {/* Hero Section */}
      <div className="mb-10 flex flex-col items-start gap-6 md:flex-row md:items-center">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary">
          {initials}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {startup.name}
          </h1>
          {startup.tagline && (
            <p className="mt-2 text-lg text-muted-foreground">
              {startup.tagline}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Overview */}
          {startup.description && (
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {startup.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Key Details */}
          <Card>
            <CardHeader>
              <CardTitle>Key Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                {startup.sector && startup.sector.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Sectors
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {startup.sector.map((s: string) => (
                        <Badge key={s} variant="outline">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {startup.stage && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Stage
                    </p>
                    <Badge variant="secondary">{startup.stage}</Badge>
                  </div>
                )}

                {(startup.location_city || startup.location_country) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Location
                    </p>
                    <span className="flex items-center gap-1.5 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {[startup.location_city, startup.location_country].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}

                {startup.team_size && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Team Size
                    </p>
                    <span className="flex items-center gap-1.5 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {startup.team_size} members
                    </span>
                  </div>
                )}

                {startup.founded_year && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Founded
                    </p>
                    <span className="flex items-center gap-1.5 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {startup.founded_year}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Founder Section */}
          {founder && (
            <Card>
              <CardHeader>
                <CardTitle>Founder</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {founder.full_name
                      ? founder.full_name
                          .split(" ")
                          .map((w: string) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "??"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-medium">
                      {founder.full_name || "Anonymous Founder"}
                    </p>
                    {founder.bio && (
                      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                        {founder.bio}
                      </p>
                    )}
                    {founder.linkedin_url && (
                      <a
                        href={founder.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Fundraising Section */}
          {hasRaisingData && (
            <Card>
              <CardHeader>
                <CardTitle>Fundraising</CardTitle>
                <CardDescription>Current fundraising progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {startup.funding_target && (
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Target
                      </span>
                      <span className="text-sm font-medium">
                        ${(startup.funding_target / 1_000_000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                )}

                {startup.funding_raised != null && (
                  <div>
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Raised
                      </span>
                      <span className="text-sm font-medium">
                        ${(startup.funding_raised / 1_000_000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                )}

                {startup.funding_target &&
                  startup.funding_raised != null && (
                    <div>
                      <div className="flex items-baseline justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Progress
                        </span>
                        <span className="text-sm font-medium">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}

          {startup.website && (
            <Button variant="outline" className="w-full" asChild>
              <a
                href={startup.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Website
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
