import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-lg">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl gradient-bg glow-shadow">
            <Sparkles className="h-5 w-5 text-white" />
          </span>
          <span className="gradient-text">VideoMarket</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link to="/" className="rounded-lg px-3 py-2 hover:bg-white/5 transition-colors">الرئيسية</Link>
          <Link to="/auth" className="rounded-lg px-3 py-2 hover:bg-white/5 transition-colors">دخول الإدارة</Link>
        </nav>
      </div>
    </header>
  );
}