import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Suspense } from "react";
import { listPublishedVideos, type PublicVideo } from "@/lib/videos.functions";
import { SiteHeader } from "@/components/SiteHeader";
import { RegisterModal } from "@/components/RegisterModal";
import { Button } from "@/components/ui/button";
import { PlayCircle, Sparkles, Film } from "lucide-react";

const videosQuery = (fn: () => Promise<PublicVideo[]>) =>
  queryOptions({ queryKey: ["videos", "published"], queryFn: fn });

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VideoMarket — منصة الفيديوهات التسويقية" },
      { name: "description", content: "اكتشف فيديوهاتنا التسويقية الحصرية وسجل الآن للاستفادة من العروض." },
      { property: "og:title", content: "VideoMarket" },
      { property: "og:description", content: "منصة عرض الفيديوهات التسويقية الاحترافية." },
    ],
  }),
  component: IndexPage,
});

function IndexPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <Hero />
      <Suspense fallback={<VideosSkeleton />}>
        <VideosSection />
      </Suspense>
      <Footer />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute -top-32 right-10 h-72 w-72 rounded-full bg-brand/40 blur-3xl animate-float-blob" />
      <div className="absolute top-20 left-20 h-80 w-80 rounded-full bg-brand-2/30 blur-3xl animate-float-blob-2" />
      <div className="mx-auto max-w-5xl px-4 py-24 text-center relative">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs animate-fade-up">
          <Sparkles className="h-3.5 w-3.5 text-brand-2" />
          <span className="text-muted-foreground">منصة الفيديوهات التسويقية الأولى</span>
        </div>
        <h1 className="mt-6 text-5xl md:text-7xl font-black leading-tight animate-fade-up" style={{ animationDelay: "0.1s" }}>
          شاهد. <span className="gradient-text">تعلّم.</span> سجّل.
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: "0.2s" }}>
          مجموعة من الفيديوهات التسويقية الحصرية مع إمكانية التسجيل المباشر للحصول على عروضنا.
        </p>
        <div className="mt-8 flex justify-center gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
          <Button asChild className="gradient-bg text-white h-12 px-6 glow-shadow text-base">
            <a href="#videos"><PlayCircle className="ml-2 h-5 w-5" />استكشف الفيديوهات</a>
          </Button>
        </div>
      </div>
    </section>
  );
}

function VideosSection() {
  const fn = useServerFn(listPublishedVideos);
  const { data } = useSuspenseQuery(videosQuery(() => fn()));
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<PublicVideo | null>(null);

  return (
    <section id="videos" className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-bold">الفيديوهات المتاحة</h2>
        <p className="mt-2 text-muted-foreground">اختر فيديو وسجّل الآن</p>
      </div>

      {data.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center">
          <Film className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">لا توجد فيديوهات منشورة حالياً.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((v, i) => (
            <article
              key={v.id}
              className="group glass rounded-2xl overflow-hidden card-shadow hover:[transform:translateY(-6px)] hover:glow-shadow transition-all duration-500 animate-fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="relative aspect-video bg-black overflow-hidden">
                <video
                  src={v.video_url}
                  poster={v.thumbnail_url ?? undefined}
                  controls
                  preload="metadata"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <h3 className="font-bold text-lg line-clamp-2">{v.title}</h3>
                {v.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{v.description}</p>
                )}
                <Button
                  onClick={() => { setActive(v); setOpen(true); }}
                  className="mt-4 w-full gradient-bg text-white glow-shadow h-11"
                >
                  سجل الآن
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <RegisterModal
        open={open}
        onOpenChange={setOpen}
        videoId={active?.id ?? null}
        videoTitle={active?.title ?? ""}
      />
    </section>
  );
}

function VideosSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass rounded-2xl overflow-hidden">
            <div className="aspect-video skeleton" />
            <div className="p-5 space-y-3">
              <div className="h-5 w-3/4 skeleton rounded" />
              <div className="h-4 w-full skeleton rounded" />
              <div className="h-11 w-full skeleton rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-white/5 py-8 text-center text-sm text-muted-foreground">
      © {new Date().getFullYear()} VideoMarket. جميع الحقوق محفوظة.
    </footer>
  );
}
