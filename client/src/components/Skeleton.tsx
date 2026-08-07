export function CardSkeleton() {
  return (
    <div className="w-40 shrink-0 animate-pulse sm:w-44">
      <div className="aspect-[2/3] rounded-md bg-panel-raised" />
      <div className="mt-1.5 h-4 w-3/4 rounded bg-panel-raised" />
      <div className="mt-1 h-3 w-1/4 rounded bg-panel-raised" />
    </div>
  );
}

export function RowSkeleton({ title }: { title: string }) {
  return (
    <section className="py-2">
      <h2 className="mb-3 px-4 font-display text-lg uppercase tracking-wide text-ink-dim sm:px-6">
        {title}
      </h2>
      <div className="flex gap-4 overflow-hidden px-4 sm:px-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return <div className="h-[52vh] min-h-72 w-full animate-pulse bg-panel sm:h-[60vh]" />;
}
