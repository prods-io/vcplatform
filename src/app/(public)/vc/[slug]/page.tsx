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
  ExternalLink,
  MapPin,
  Mail,
  Linkedin,
  Twitter,
  Globe,
} from "lucide-react";

interface PageProps {
  params: { slug: string };
}

async function getVC(slug: string) {
  const supabase = await createClient();
  const { data: vc, error } = await supabase
    .from("vc_firms")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !vc) return null;
  return vc;
}

async function getVCPartners(vcId: string) {
  const supabase = await createClient();
  const { data: partners } = await supabase
    .from("vc_partners")
    .select("*")
    .eq("vc_firm_id", vcId)
    .order("name");

  return partners || [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const vc = await getVC(params.slug);
  if (!vc) {
    return { title: "VC Not Found - VCConnect" };
  }

  return {
    title: `${vc.name} - VCConnect`,
    description:
      vc.description?.slice(0, 160) ||
      `Learn about ${vc.name}, a venture capital firm on VCConnect.`,
    openGraph: {
      title: `${vc.name} - VCConnect`,
      description:
        vc.description?.slice(0, 160) ||
        `Learn about ${vc.name}, a venture capital firm on VCConnect.`,
    },
  };
}

export default async function VCProfilePage({ params }: PageProps) {
  const vc = await getVC(params.slug);
  if (!vc) notFound();

  const partners = await getVCPartners(vc.id);

  const initials = vc.name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {vc.name}
            </h1>
            {vc.type && (
              <Badge variant="secondary" className="text-sm">
                {vc.type}
              </Badge>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-muted-foreground">
            {vc.headquarters && (
              <span className="flex items-center gap-1.5 text-sm">
                <MapPin className="h-4 w-4" />
                {vc.headquarters}
              </span>
            )}
            {vc.website && (
              <a
                href={vc.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Globe className="h-4 w-4" />
                Website
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          {/* Overview */}
          {vc.description && (
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {vc.description}
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
                {vc.investment_stages && vc.investment_stages.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Investment Stages
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {vc.investment_stages.map((stage: string) => (
                        <Badge key={stage} variant="outline">
                          {stage}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {vc.sectors && vc.sectors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Sectors
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {vc.sectors.map((sector: string) => (
                        <Badge key={sector} variant="outline">
                          {sector}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(vc.check_size_min || vc.check_size_max) && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Check Size
                    </p>
                    <p className="text-sm">
                      {vc.check_size_min && `$${(vc.check_size_min / 1_000_000).toFixed(1)}M`}
                      {vc.check_size_min && vc.check_size_max && " - "}
                      {vc.check_size_max && `$${(vc.check_size_max / 1_000_000).toFixed(1)}M`}
                    </p>
                  </div>
                )}

                {vc.geographies && vc.geographies.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Geographies
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {vc.geographies.map((geo: string) => (
                        <Badge key={geo} variant="outline">
                          {geo}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {vc.fund_size && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Fund Size
                    </p>
                    <p className="text-sm">{vc.fund_size}</p>
                  </div>
                )}

                {vc.founded_year && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Founded
                    </p>
                    <p className="text-sm">{vc.founded_year}</p>
                  </div>
                )}

                {vc.portfolio_count != null && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      Portfolio Companies
                    </p>
                    <p className="text-sm">{vc.portfolio_count}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Team Section */}
          {partners.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {partners.map((partner: any) => {
                    const partnerInitials = partner.name
                      .split(" ")
                      .map((w: string) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <div
                        key={partner.id}
                        className="flex items-center gap-4 rounded-lg border p-4"
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                          {partnerInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{partner.name}</p>
                          {partner.title && (
                            <p className="text-sm text-muted-foreground truncate">
                              {partner.title}
                            </p>
                          )}
                          {partner.linkedin_url && (
                            <a
                              href={partner.linkedin_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Linkedin className="h-3 w-3" />
                              LinkedIn
                            </a>
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

        {/* Sidebar - Contact */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
              <CardDescription>Get in touch with {vc.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {vc.email && (
                <a
                  href={`mailto:${vc.email}`}
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{vc.email}</span>
                </a>
              )}
              {vc.linkedin_url && (
                <a
                  href={vc.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="h-4 w-4 shrink-0" />
                  LinkedIn
                </a>
              )}
              {vc.twitter_url && (
                <a
                  href={vc.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Twitter className="h-4 w-4 shrink-0" />
                  Twitter
                </a>
              )}
              {vc.crunchbase_url && (
                <a
                  href={vc.crunchbase_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  Crunchbase
                </a>
              )}

              {!vc.email &&
                !vc.linkedin_url &&
                !vc.twitter_url &&
                !vc.crunchbase_url && (
                  <p className="text-sm text-muted-foreground">
                    No contact information available.
                  </p>
                )}
            </CardContent>
          </Card>

          <Button className="w-full" asChild>
            <Link href="/signup">Sign up to connect</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
