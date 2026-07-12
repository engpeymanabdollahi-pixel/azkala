import { cn } from '@/utils/cn';

interface SimpleChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  height?: number;
  className?: string;
  showValues?: boolean;
  type?: 'bar' | 'line';
}

export function SimpleChart({
  data,
  height = 200,
  className,
  showValues = true,
  type = 'bar',
}: SimpleChartProps) {
  // ✅ رفع NaN: اطمینان از معتبر بودن مقادیر
  const safeData = data.map(d => ({
    ...d,
    value: Number.isFinite(d.value) ? d.value : 0,
  }));

  const maxValue = Math.max(...safeData.map(d => d.value), 1); // حداقل ۱ برای جلوگیری از تقسیم بر صفر
  const padding = 40;
  const chartWidth = 100;
  const chartHeight = height - padding * 2;

  if (safeData.length === 0) {
    return (
      <div className={cn('flex items-center justify-center text-gray-400', className)} style={{ height }}>
        داده‌ای برای نمایش وجود ندارد
      </div>
    );
  }

  if (type === 'bar') {
    const barWidth = Math.max((chartWidth - (safeData.length - 1) * 2) / safeData.length, 0.5);

    return (
      <div className={cn('w-full', className)}>
        <svg
          viewBox={`0 0 ${chartWidth} ${height}`}
          className="w-full"
          style={{ height }}
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={i}
              x1={0}
              y1={padding + chartHeight * (1 - ratio)}
              x2={chartWidth}
              y2={padding + chartHeight * (1 - ratio)}
              stroke="#e5e7eb"
              strokeWidth="0.2"
              strokeDasharray="1,1"
            />
          ))}

          {/* Bars */}
          {safeData.map((item, index) => {
            const barHeight = Math.max((item.value / maxValue) * chartHeight, 0);
            const x = index * (barWidth + 2);
            const y = padding + chartHeight - barHeight;

            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color || '#3b82f6'}
                  rx="1"
                  className="transition-all hover:opacity-80"
                />
                {showValues && item.value > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 2}
                    textAnchor="middle"
                    className="text-[3px] fill-gray-600"
                    fontSize="3"
                  >
                    {item.value}
                  </text>
                )}
                <text
                  x={x + barWidth / 2}
                  y={height - 10}
                  textAnchor="middle"
                  className="text-[3px] fill-gray-500"
                  fontSize="3"
                >
                  {item.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Line chart
  const points = safeData.map((item, index) => {
    const x = safeData.length > 1 ? (index / (safeData.length - 1)) * chartWidth : chartWidth / 2;
    const y = padding + chartHeight - (item.value / maxValue) * chartHeight;
    return { x, y, ...item };
  });

  const pathD = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
          <line
            key={i}
            x1={0}
            y1={padding + chartHeight * (1 - ratio)}
            x2={chartWidth}
            y2={padding + chartHeight * (1 - ratio)}
            stroke="#e5e7eb"
            strokeWidth="0.2"
            strokeDasharray="1,1"
          />
        ))}

        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="1"
          className="transition-all"
        />

        {/* Points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="1.5"
              fill={point.color || '#3b82f6'}
              className="transition-all"
            />
            {showValues && point.value > 0 && (
              <text
                x={point.x}
                y={point.y - 3}
                textAnchor="middle"
                className="text-[3px] fill-gray-600"
                fontSize="3"
              >
                {point.value}
              </text>
            )}
            <text
              x={point.x}
              y={height - 10}
              textAnchor="middle"
              className="text-[3px] fill-gray-500"
              fontSize="3"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}