"use client";

import React, { useState } from "react";

interface DataPoint {
  date: string;
  successRate: number;
  totalBuilds: number;
}

interface LineChartProps {
  data: DataPoint[];
  height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({ data, height = 280 }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return null;
  }

  const padding = { top: 50, right: 40, bottom: 60, left: 60 };
  const chartWidth = 800;
  const chartHeight = height - padding.top - padding.bottom;
  const viewBoxWidth = chartWidth + padding.left + padding.right;

  const maxRate = 100;
  const minRate = 0;

  // Calculate positions
  const points = data.map((point, index) => {
    const x =
      padding.left +
      (data.length > 1
        ? (index / (data.length - 1)) * chartWidth
        : chartWidth / 2);
    const y =
      padding.top +
      ((maxRate - point.successRate) / (maxRate - minRate)) * chartHeight;
    return { x, y, ...point };
  });

  // Create smooth curve using bezier (only for multiple points)
  const createSmoothPath = (
    pts: Array<{
      x: number;
      y: number;
      date: string;
      successRate: number;
      totalBuilds: number;
    }>,
  ) => {
    if (pts.length < 2) return "";

    if (!pts[0]) return "";
    let path = `M ${pts[0].x} ${pts[0].y}`;

    for (let i = 0; i < pts.length - 1; i++) {
      const current = pts[i];
      const next = pts[i + 1];
      if (!current || !next) continue;
      const controlX = (current.x + next.x) / 2;

      path += ` Q ${controlX} ${current.y}, ${controlX} ${(current.y + next.y) / 2}`;
      path += ` Q ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
  };

  const linePath = createSmoothPath(points);
  const lastPoint = points[points.length - 1];
  const areaPath =
    typeof linePath === "string" &&
    linePath.length > 0 &&
    points.length > 0 &&
    lastPoint
      ? `${linePath} L ${lastPoint.x} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`
      : "";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const avgSuccessRate = Math.round(
    data.reduce((sum, p) => sum + p.successRate, 0) / data.length,
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: `${height}px`,
        padding: "20px",
      }}
    >
      {/* Header Stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "24px",
          paddingLeft: "60px",
          paddingRight: "40px",
        }}
      >
        <div style={{ display: "flex", gap: "32px" }}>
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Average Success Rate
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 700,
                color:
                  avgSuccessRate >= 80
                    ? "#10b981"
                    : avgSuccessRate >= 50
                      ? "#f59e0b"
                      : "#ef4444",
              }}
            >
              {avgSuccessRate}%
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Total Builds
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>
              {data.reduce((sum, p) => sum + p.totalBuilds, 0)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-secondary)",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Days Tracked
            </div>
            <div style={{ fontSize: "24px", fontWeight: 700 }}>
              {data.length}
            </div>
          </div>
        </div>
      </div>

      <svg
        width="100%"
        height={height - 70}
        viewBox={`0 0 ${viewBoxWidth} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((value) => {
          const y =
            padding.top +
            ((maxRate - value) / (maxRate - minRate)) * chartHeight;
          return (
            <g key={value}>
              <line
                x1={padding.left}
                y1={y}
                x2={chartWidth + padding.left}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 12}
                y={y + 4}
                fontSize="12"
                fill="var(--text-secondary)"
                textAnchor="end"
                fontWeight="500"
              >
                {value}%
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        {areaPath && <path d={areaPath} fill="url(#chartGradient)" />}

        {/* Main line (only for multiple points) */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow)"
          />
        )}

        {/* For single data point, show a vertical bar */}
        {data.length === 1 && points[0] && (
          <rect
            x={points[0].x - 30}
            y={points[0].y}
            width="60"
            height={height - padding.bottom - points[0].y}
            fill="url(#chartGradient)"
            rx="4"
          />
        )}

        {/* Data points */}
        {points.map((point, index) => {
          const isHovered = hoveredPoint === index;
          const color =
            point.successRate >= 80
              ? "#10b981"
              : point.successRate >= 50
                ? "#f59e0b"
                : "#ef4444";

          return (
            <g key={index}>
              {/* Outer glow circle on hover */}
              {isHovered && (
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="12"
                  fill={color}
                  opacity="0.2"
                />
              )}

              {/* Main point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={isHovered ? "6" : "4"}
                fill={color}
                stroke="#0a0a0a"
                strokeWidth="2"
                style={{
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={() => setHoveredPoint(index)}
                onMouseLeave={() => setHoveredPoint(null)}
              />

              {/* Tooltip on hover */}
              {isHovered && (
                <g>
                  <rect
                    x={point.x - 70}
                    y={point.y - 70}
                    width="140"
                    height="50"
                    rx="8"
                    fill="#1a1a1a"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                    filter="url(#glow)"
                  />
                  <text
                    x={point.x}
                    y={point.y - 48}
                    fontSize="11"
                    fill="var(--text-secondary)"
                    textAnchor="middle"
                    fontWeight="600"
                  >
                    {formatDate(point.date)}
                  </text>
                  <text
                    x={point.x}
                    y={point.y - 32}
                    fontSize="16"
                    fill={color}
                    textAnchor="middle"
                    fontWeight="700"
                  >
                    {point.successRate}%
                  </text>
                  <text
                    x={point.x}
                    y={point.y - 16}
                    fontSize="10"
                    fill="var(--text-secondary)"
                    textAnchor="middle"
                  >
                    {point.totalBuilds} builds
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {points.map((point, index) => {
          const step = Math.ceil(points.length / 8);
          const shouldShowLabel =
            index % step === 0 || index === points.length - 1;

          if (!shouldShowLabel) return null;

          return (
            <text
              key={`label-${index}`}
              x={point.x}
              y={height - padding.bottom + 25}
              fontSize="12"
              fill="var(--text-secondary)"
              textAnchor="middle"
              fontWeight="500"
            >
              {formatDate(point.date)}
            </text>
          );
        })}

        {/* Axis lines */}
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={chartWidth + padding.left}
          y2={height - padding.bottom}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};
