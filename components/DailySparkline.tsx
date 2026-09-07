export default function DailySparkline({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const barWidth = 100 / data.length;

  return (
    <div>
      <svg viewBox={`0 0 100 32`} className="w-full h-16" preserveAspectRatio="none">
        {data.map((d, i) => {
          const h = (d.value / max) * 30;
          return (
            <rect
              key={i}
              x={i * barWidth + barWidth * 0.15}
              y={32 - h}
              width={barWidth * 0.7}
              height={h}
              rx={0.5}
              className="fill-plum/70"
            />
          );
        })}
      </svg>
      <div className="flex justify-between text-[11px] text-ink/40 mt-1">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
