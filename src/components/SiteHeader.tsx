import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-end px-4">
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/auth" className="rounded-lg px-3 py-2 hover:bg-white/5 transition-colors">دخول الإدارة</Link>
        </nav>
      </div>
    </header>
  );
}