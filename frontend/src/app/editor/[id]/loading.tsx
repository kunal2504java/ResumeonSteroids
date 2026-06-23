export default function EditorLoading() {
  return (
    <div className="min-h-screen bg-[#0D1117] flex flex-col">
      {/* Toolbar skeleton */}
      <header className="h-12 border-b border-[#1E2535] flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white/5 animate-pulse rounded-sm" />
          <div className="h-4 w-40 bg-white/5 animate-pulse rounded-sm" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 bg-white/5 animate-pulse rounded-sm" />
          <div className="h-8 w-20 bg-[#6366f1]/20 animate-pulse rounded-sm" />
        </div>
      </header>

      {/* Split pane skeleton */}
      <div className="flex-1 flex">
        {/* Left panel */}
        <div className="w-[420px] border-r border-[#1E2535] p-5 space-y-5 overflow-hidden">
          {/* Section tabs */}
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-20 bg-white/5 animate-pulse rounded-sm"
              />
            ))}
          </div>

          {/* Form fields */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 bg-white/5 animate-pulse rounded-sm" />
              <div className="h-9 w-full bg-white/[0.03] animate-pulse border border-white/5" />
            </div>
          ))}

          {/* Bullet items */}
          <div className="space-y-3 pt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="w-5 h-5 mt-0.5 bg-white/5 animate-pulse rounded-sm shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-full bg-white/5 animate-pulse rounded-sm" />
                  <div className="h-3 w-3/4 bg-white/5 animate-pulse rounded-sm" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="w-1 bg-[#1E2535]" />

        {/* Right panel — resume preview */}
        <div className="flex-1 flex items-start justify-center p-8 bg-[#0A0A0F]">
          <div className="w-[612px] bg-white/[0.02] border border-white/5 p-10 space-y-5">
            {/* Name */}
            <div className="h-6 w-48 bg-white/5 animate-pulse rounded-sm mx-auto" />
            {/* Contact line */}
            <div className="h-3 w-72 bg-white/5 animate-pulse rounded-sm mx-auto" />

            {/* Section */}
            <div className="pt-4 space-y-3">
              <div className="h-4 w-24 bg-white/5 animate-pulse rounded-sm" />
              <div className="h-px bg-white/5" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/5 animate-pulse rounded-sm" />
                <div className="h-3 w-5/6 bg-white/5 animate-pulse rounded-sm" />
                <div className="h-3 w-4/6 bg-white/5 animate-pulse rounded-sm" />
              </div>
            </div>

            {/* Section */}
            <div className="pt-4 space-y-3">
              <div className="h-4 w-20 bg-white/5 animate-pulse rounded-sm" />
              <div className="h-px bg-white/5" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/5 animate-pulse rounded-sm" />
                <div className="h-3 w-3/4 bg-white/5 animate-pulse rounded-sm" />
              </div>
            </div>

            {/* Section */}
            <div className="pt-4 space-y-3">
              <div className="h-4 w-16 bg-white/5 animate-pulse rounded-sm" />
              <div className="h-px bg-white/5" />
              <div className="space-y-2">
                <div className="h-3 w-full bg-white/5 animate-pulse rounded-sm" />
                <div className="h-3 w-2/3 bg-white/5 animate-pulse rounded-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
