import { cn } from '@/utils/cn';

// ==================== Types ====================
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface SimpleChartProps {
  data: ChartDataPoint[];
  height?: number;
  className?: string;
  showValues?: boolean;
  type?: 'bar' | 'line';
}

// ==================== Component ====================
export function SimpleChart({
  data,
  height = 250, // افزایش ارتفاع پیش‌فرض برای تناسب بهتر
  className,
  showValues = true,
  type = 'bar',
}: SimpleChartProps) {
  // ۱. پاک‌سازی و ایمن‌سازی داده‌ها (جلوگیری از NaN یا Infinity)
  const safeData = data.map((d) => ({
    ...d,
    value: Number.isFinite(d.value) ? Math.max(0, d.value) : 0,
  }));

  // ۲. حالت خالی بودن داده‌ها
  if (safeData.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center text-gray-400',
          className
        )}
        style={{ height }}
      >
        <svg
          className="w-12 h-12 mb-2 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span className="text-sm font-medium">داده‌ای برای نمایش وجود ندارد</span>
      </div>
    );
  }

  // ۳. محاسبات ابعاد و مقیاس‌بندی
  // استفاده از عرض ثابت 800 برای viewBox باعث می‌شود نسبت‌ها در هر سایزی حفظ شوند
  const viewBoxWidth = 800;
  const paddingTop = 40;
  const paddingBottom = 40;
  const paddingLeft = 20;
  const paddingRight = 20;

  const chartWidth = viewBoxWidth - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const maxValue = Math.max(...safeData.map((d) => d.value), 1); // جلوگیری از تقسیم بر صفر

  // ==================== نمودار میله‌ای (Bar Chart) ====================
  if (type === 'bar') {
    const slotWidth = chartWidth / safeData.length;
    const barWidth = slotWidth * 0.6; // میله ۶۰٪ فضای اختصاص‌یافته را اشغال می‌کند
    // const gap = slotWidth * 0.4; // ۴۰٪ باقی‌مانده فاصله است

    return (
      <div className={cn('w-full', className)}>
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${height}`}
          className="w-full h-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="نمودار میله‌ای"
        >
          {/* خطوط شبکه (Grid Lines) */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            return (
              <line
                key={i}
                x1={paddingLeft}
                y1={y}
                x2={viewBoxWidth - paddingRight}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            );
          })}

          {/* میله‌ها */}
          {safeData.map((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = paddingLeft + index * slotWidth + (slotWidth - barWidth) / 2;
            const y = paddingTop + chartHeight - barHeight;

            return (
              <g key={index} className="group">
                {/* خود میله */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={item.color || '#3b82f6'}
                  rx="4" // گوشه‌های گرد برای زیبایی
                  className="transition-all duration-300 ease-out group-hover:opacity-80"
                />

                {/* مقدار عددی بالای میله */}
                {showValues && item.value > 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="600"
                    className="fill-gray-700 transition-opacity"
                  >
                    {item.value.toLocaleString('fa-IR')}
                  </text>
                )}

                {/* برچسب محور X */}
                <text
                  x={x + barWidth / 2}
                  y={height - 15}
                  textAnchor="middle"
                  fontSize="14"
                  className="fill-gray-500"
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

  // ==================== نمودار خطی (Line Chart) ====================
  const slotWidth =
    chartWidth / (safeData.length > 1 ? safeData.length - 1 : 1);

  const points = safeData.map((item, index) => {
    const x = paddingLeft + index * slotWidth;
    const y = paddingTop + chartHeight - (item.value / maxValue) * chartHeight;
    return { x, y, ...item };
  });

  const pathD = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className={cn('w-full', className)}>
      <svg
        viewBox={`0 0 ${viewBoxWidth} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="نمودار خطی"
      >
        {/* خطوط شبکه (Grid Lines) */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
          const y = paddingTop + chartHeight * (1 - ratio);
          return (
            <line
              key={i}
              x1={paddingLeft}
              y1={y}
              x2={viewBoxWidth - paddingRight}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray="4,4"
            />
          );
        })}

        {/* ناحیه زیر خط (Area Fill) برای ظاهر حرفه‌ای‌تر */}
        <path
          d={`${pathD} L ${points[points.length - 1].x} ${
            paddingTop + chartHeight
          } L ${points[0].x} ${paddingTop + chartHeight} Z`}
          fill="#3b82f6"
          fillOpacity="0.1"
        />

        {/* خط اصلی */}
        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-all"
        />

        {/* نقاط و برچسب‌ها */}
        {points.map((point, index) => (
          <g key={index} className="group">
            {/* دایره‌ی نقطه */}
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#ffffff"
              stroke={point.color || '#3b82f6'}
              strokeWidth="2"
              className="transition-all duration-200 group-hover:r-7"
            />

            {/* مقدار عددی بالای نقطه */}
            {showValues && point.value > 0 && (
              <text
                x={point.x}
                y={point.y - 12}
                textAnchor="middle"
                fontSize="14"
                fontWeight="600"
                className="fill-gray-700"
              >
                {point.value.toLocaleString('fa-IR')}
              </text>
            )}

            {/* برچسب محور X */}
            <text
              x={point.x}
              y={height - 15}
              textAnchor="middle"
              fontSize="14"
              className="fill-gray-500"
            >
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}