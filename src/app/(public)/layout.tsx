import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                VC
              </div>
              <span className="text-xl font-bold tracking-tight">
                VCConnect
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Home
              </Link>
              <Link
                href="/resources"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Resources
              </Link>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>

          <MobileMenu />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t bg-muted/40">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                  VC
                </div>
                <span className="text-xl font-bold tracking-tight">
                  VCConnect
                </span>
              </Link>
              <p className="text-sm text-muted-foreground max-w-xs">
                Connecting founders with the right investors to build the future.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Product</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/dashboard/discover"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Discover VCs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/pitch"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pitch Analysis
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/pipeline"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pipeline Tracker
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Company</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/resources"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Resources
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t pt-8">
            <p className="text-sm text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} VCConnect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function MobileMenu() {
  return (
    <div className="md:hidden">
      <input type="checkbox" id="mobile-menu" className="peer hidden" />
      <label
        htmlFor="mobile-menu"
        className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border hover:bg-accent"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </label>
      <div className="fixed inset-0 top-16 z-50 hidden bg-background peer-checked:block">
        <nav className="container mx-auto flex flex-col gap-4 px-4 py-6">
          <Link
            href="/"
            className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <Link
            href="/resources"
            className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Resources
          </Link>
          <div className="flex flex-col gap-3 pt-4 border-t">
            <Button variant="outline" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
}
