export default function ProgressBar({
  atual,
  meta,
  tone = "brand",
}: {
  atual: number;
  meta: number;
  tone?: "brand" | "muted";
}) {
  const percentual = meta > 0 ? Math.min(100, Math.round((atual / meta) * 100)) : 0;
  const cor = tone === "brand" ? "bg-brand-500" : "bg-muted-600";

  return (
    <div className="w-full">
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-800/10">
        <div
          className={`h-full rounded-full ${cor} transition-all`}
          style={{ width: `${percentual}%` }}
        />
      </div>
    </div>
  );
}
