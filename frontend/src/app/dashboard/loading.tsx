export default function DashboardLoading() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-[-12rem] h-96 w-[48rem] -translate-x-1/2 rounded-full bg-white/5 blur-[120px]" />
      <header className="relative z-10 border-b border-white/10 bg-black/55 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-2">
            <div className="h-[18px] w-[18px] animate-pulse rounded bg-white/10" />
            <div className="h-3.5 w-20 animate-pulse rounded bg-white/10" />
          </div>
          <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
        </div>
      </header>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-14 lg:px-10">
        <div className="mb-10 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="mb-3 h-3 w-24 animate-pulse rounded bg-white/10" />
            <div className="mb-2 h-10 w-56 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-28 animate-pulse rounded bg-white/10" />
          </div>
          <div className="h-10 w-36 animate-pulse rounded-full bg-white/15" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.04] backdrop-blur-xl"
            >
              <div className="h-1/2 animate-pulse bg-white/[0.03]" />
              <div className="space-y-2 p-5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
