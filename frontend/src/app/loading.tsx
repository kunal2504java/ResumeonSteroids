export default function RootLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 bg-[#6366f1]/20 animate-pulse" />
        <div className="h-3 w-24 bg-white/5 animate-pulse rounded-sm" />
      </div>
    </div>
  );
}
