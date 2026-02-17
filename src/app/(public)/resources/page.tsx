import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TrendingUp, BookOpen } from "lucide-react";

const articles = [
  {
    title: "How to Write a Pitch Deck That Gets Funded",
    description:
      "A comprehensive guide to crafting a compelling pitch deck that captures investor attention and communicates your vision effectively.",
    icon: FileText,
  },
  {
    title: "Top 10 Mistakes Founders Make When Fundraising",
    description:
      "Learn from the most common pitfalls that derail fundraising efforts and how to avoid them at every stage of the process.",
    icon: TrendingUp,
  },
  {
    title: "Understanding VC Term Sheets: A Founder's Guide",
    description:
      "Demystify the key terms, clauses, and negotiation points in a venture capital term sheet so you can make informed decisions.",
    icon: BookOpen,
  },
];

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center mb-16">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Resources
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Coming soon &mdash; guides, tips, and insights for founders navigating
          the fundraising landscape.
        </p>
      </div>

      <div className="mx-auto max-w-4xl grid gap-6 md:grid-cols-3">
        {articles.map((article) => {
          const Icon = article.icon;

          return (
            <Card
              key={article.title}
              className="relative overflow-hidden border bg-card transition-shadow hover:shadow-md"
            >
              <CardHeader className="pb-4">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-snug">
                    {article.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <CardDescription className="text-sm leading-relaxed">
                  {article.description}
                </CardDescription>
                <Badge
                  variant="secondary"
                  className="mt-4 text-xs font-normal"
                >
                  Coming Soon
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
