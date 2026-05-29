export default function Loading() {
  return (
    <div className="flex bg-background text-foreground min-h-screen relative overflow-hidden font-sans antialiased">
      {/* Placeholder sidebar */}
      <div className="hidden md:flex w-80 h-screen flex-col border-r border-border bg-card/20 backdrop-blur-md">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent/15 animate-pulse" />
            <div className="h-5 w-32 rounded bg-muted/15 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-9 rounded-xl bg-muted/8 animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-7 w-48 rounded-lg bg-muted/12 animate-pulse" />
              <div className="h-4 w-64 rounded bg-muted/8 animate-pulse" />
            </div>
            <div className="h-10 w-28 rounded-xl bg-muted/10 animate-pulse" />
          </div>
        </div>

        {/* Dashboard grid skeleton */}
        <div className="flex-1 px-8 pb-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-border bg-card/30 backdrop-blur-md"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-2.5 flex-1">
                    <div className="h-3 w-24 rounded bg-muted/10 animate-pulse" />
                    <div className="h-8 w-16 rounded bg-muted/12 animate-pulse" />
                    <div className="h-3 w-32 rounded bg-muted/8 animate-pulse" />
                  </div>
                  <div className="h-14 w-14 rounded-xl bg-muted/10 animate-pulse" />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="p-6 rounded-2xl border border-border bg-card/30 backdrop-blur-md h-48 animate-pulse"
                    style={{ animationDelay: `${240 + i * 60}ms` }}
                  />
                ))}
              </div>
              <div
                className="p-6 rounded-2xl border border-border bg-card/30 backdrop-blur-md h-64 animate-pulse"
                style={{ animationDelay: "360ms" }}
              />
            </div>
            <div
              className="p-6 rounded-2xl border border-border bg-card/30 backdrop-blur-md h-[540px] animate-pulse"
              style={{ animationDelay: "420ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
