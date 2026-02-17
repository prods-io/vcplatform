import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Search, FileText, Target, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50/50 to-background py-24 md:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.12),transparent)]" />
        <div className="container relative mx-auto px-4 text-center">
          <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
            Find the Right Investors{" "}
            <span className="text-primary">for Your Startup</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Discover venture capital firms that match your stage, sector, and
            geography. Build relationships, get feedback on your pitch, and
            track your fundraising journey.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="h-12 px-8 text-base" asChild>
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base"
              asChild
            >
              <Link href="/dashboard/discover">Explore VCs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-primary md:text-4xl">
                500+
              </p>
              <p className="mt-1 text-sm text-muted-foreground md:text-base">
                VCs Listed
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary md:text-4xl">
                1,000+
              </p>
              <p className="mt-1 text-sm text-muted-foreground md:text-base">
                Founders
              </p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary md:text-4xl">
                50+
              </p>
              <p className="mt-1 text-sm text-muted-foreground md:text-base">
                Countries
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to fundraise
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              A complete toolkit designed to help founders navigate the
              fundraising process with confidence.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-muted/50 to-muted/20 shadow-sm">
              <CardHeader className="pb-8 pt-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Search className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Discover Investors</CardTitle>
                <CardDescription className="text-base">
                  Search and filter through our curated database of venture
                  capital firms by stage, sector, geography, and check size.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-muted/50 to-muted/20 shadow-sm">
              <CardHeader className="pb-8 pt-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">AI Pitch Analysis</CardTitle>
                <CardDescription className="text-base">
                  Get instant, actionable feedback on your pitch deck powered by
                  AI. Strengthen your narrative before reaching out to investors.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-b from-muted/50 to-muted/20 shadow-sm">
              <CardHeader className="pb-8 pt-8">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Target className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Track Outreach</CardTitle>
                <CardDescription className="text-base">
                  Manage your fundraising pipeline from first contact to term
                  sheet. Never lose track of where you stand with each investor.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-t bg-muted/20 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Get started in three simple steps.
            </p>
          </div>

          <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                1
              </div>
              <h3 className="text-lg font-semibold">Sign Up</h3>
              <p className="mt-2 text-muted-foreground">
                Create your free account in seconds. No credit card required.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                2
              </div>
              <h3 className="text-lg font-semibold">Build Your Profile</h3>
              <p className="mt-2 text-muted-foreground">
                Tell us about your startup, stage, sector, and what you are
                looking for in an investor.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                3
              </div>
              <h3 className="text-lg font-semibold">Connect with VCs</h3>
              <p className="mt-2 text-muted-foreground">
                Discover matched investors, get pitch feedback, and manage your
                outreach pipeline.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-indigo-500/5 px-8 py-16 text-center shadow-sm ring-1 ring-primary/10">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Ready to find your perfect investor?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
              Join thousands of founders who are using VCConnect to streamline
              their fundraising process.
            </p>
            <Button size="lg" className="mt-8 h-12 px-8 text-base" asChild>
              <Link href="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
