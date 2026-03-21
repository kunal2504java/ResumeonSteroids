export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#0D1117]">
      {/* Navbar skeleton */}
      <header className="border-b border-[#1E2535]">
        <div className="max-w-[1180px] mx-auto px-6 md:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-[18px] h-[18px] bg-[#6366f1]/20 animate-pulse" />
            <div className="h-3.5 w-20 bg-white/5 animate-pulse rounded-sm" />
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
        </div>
      </header>

      <div className="max-w-[1180px] mx-auto px-6 md:px-12 py-12">
        {/* Header skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="h-8 w-48 bg-white/5 animate-pulse rounded-sm mb-2" />
            <div className="h-4 w-24 bg-white/5 animate-pulse rounded-sm" />
          </div>
          <div className="h-10 w-36 bg-[#6366f1]/20 animate-pulse" />
        </div>

        {/* Card grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#111118] border border-white/5 overflow-hidden"
            >
              <div className="h-40 bg-white/[0.02] animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 bg-white/5 animate-pulse rounded-sm" />
                <div className="h-3 w-1/2 bg-white/5 animate-pulse rounded-sm" />
              </div>
              <div className="border-t border-white/5 px-4 py-3 flex gap-2">
                <div className="h-7 w-14 bg-white/5 animate-pulse rounded-sm" />
                <div className="h-7 w-14 bg-white/5 animate-pulse rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
