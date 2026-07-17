import Link from "next/link";

export function PublicNav() {
  return (
    <nav className="bg-background w-full top-0 sticky border-b border-primary flat z-50">
      <div className="flex justify-between items-center px-4 md:px-margin-lg py-4 max-w-full">
        <Link
          href="/"
          className="font-headline-sm text-primary hover:opacity-80 transition-opacity"
        >
          ProformaFlow
        </Link>
        <div className="hidden md:flex gap-8 items-center">
          <Link
            href="/"
            className="text-primary font-bold border-b-2 border-primary font-label-md transition-all duration-200"
          >
            Landing
          </Link>
          <Link
            href="/pricing"
            className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="text-on-surface-variant font-label-md hover:text-primary transition-colors"
          >
            Register
          </Link>
        </div>
        <Link
          href="/generator"
          className="hidden md:inline-flex bg-primary text-on-primary px-6 py-2 rounded font-label-md hover:bg-on-surface-variant transition-colors brutal-border"
        >
          Get Started
        </Link>
        <button className="md:hidden text-primary" aria-label="Open menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>
    </nav>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-primary text-on-primary w-full mt-auto border-t border-primary">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center px-4 md:px-margin-lg py-12 gap-8">
        <div>
          <Link href="/" className="font-headline-sm text-on-primary font-bold mb-2 block">
            ProformaFlow
          </Link>
          <p className="font-body-md text-on-primary/80 mt-2 max-w-sm">
            Architectural export documentation. Clean, compliant, and ready for transit. We
            never store your generated documents.
          </p>
          <div className="font-body-md text-on-primary/60 mt-6">
            © {new Date().getFullYear()} ProformaFlow. All rights reserved.
          </div>
        </div>
        <div className="flex flex-wrap gap-8 md:gap-16">
          <div className="flex flex-col gap-2">
            <span className="font-label-md text-on-primary/60 uppercase text-xs">Product</span>
            <Link href="/pricing" className="font-body-md text-on-primary/80 hover:text-on-primary">
              Pricing
            </Link>
            <Link href="/templates" className="font-body-md text-on-primary/80 hover:text-on-primary">
              Templates
            </Link>
            <Link href="/generator" className="font-body-md text-on-primary/80 hover:text-on-primary">
              Generator
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-label-md text-on-primary/60 uppercase text-xs">Legal</span>
            <Link href="/privacy" className="font-body-md text-on-primary/80 hover:text-on-primary">
              Privacy Policy
            </Link>
            <Link href="/terms" className="font-body-md text-on-primary/80 hover:text-on-primary">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
