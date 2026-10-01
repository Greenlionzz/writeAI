import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Project, DailyStat } from '../types/writing';
import { Target, TrendingUp, Award, Calendar, Zap, CheckCircle2 } from 'lucide-react';

interface D3VelocityChartProps {
  project: Project;
}

interface DayDataPoint {
  date: Date;
  dateStr: string;
  actual: number;
  target: number;
  cumulativeActual: number;
  cumulativeTarget: number;
  metGoal: boolean;
  writingMinutes: number;
}

export const D3VelocityChart: React.FC<D3VelocityChartProps> = ({ project }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartMode, setChartMode] = useState<'daily' | 'cumulative'>('daily');
  const [hoveredPoint, setHoveredPoint] = useState<DayDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const dailyGoal = project.dailyWordGoal || 1000;

  // Build a continuous 30-day timeline up to today (or latest stat)
  const data: DayDataPoint[] = useMemo(() => {
    const statsMap = new Map<string, DailyStat>();
    (project.stats || []).forEach((s) => statsMap.set(s.date, s));

    // Determine end date: latest stat date or today
    const latestStatDate = project.stats && project.stats.length > 0
      ? new Date(project.stats[project.stats.length - 1].date)
      : new Date();
    
    // Set to midnight UTC
    const endDate = new Date(latestStatDate);
    endDate.setHours(0, 0, 0, 0);

    const points: DayDataPoint[] = [];
    let runningCumulativeActual = 0;
    let runningCumulativeTarget = 0;

    // Generate past 30 days
    for (let i = 29; i >= 0; i--) {
      const d = new Date(endDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const stat = statsMap.get(dateStr);
      const actual = stat?.wordsAdded || 0;
      const writingMinutes = stat?.writingMinutes || 0;

      runningCumulativeActual += actual;
      runningCumulativeTarget += dailyGoal;

      points.push({
        date: d,
        dateStr,
        actual,
        target: dailyGoal,
        cumulativeActual: runningCumulativeActual,
        cumulativeTarget: runningCumulativeTarget,
        metGoal: actual >= dailyGoal,
        writingMinutes,
      });
    }

    return points;
  }, [project.stats, dailyGoal]);

  // Aggregate 30-day metrics
  const totalWords30Days = useMemo(
    () => data.reduce((sum, d) => sum + d.actual, 0),
    [data]
  );
  const daysGoalMet = useMemo(
    () => data.filter((d) => d.metGoal && d.actual > 0).length,
    [data]
  );
  const peakDay = useMemo(() => {
    return data.reduce((max, d) => (d.actual > max.actual ? d : max), data[0]);
  }, [data]);
  const avgVelocity = Math.round(totalWords30Days / 30);

  // D3 Rendering Effect
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 800;
    const height = 280;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .attr('width', containerWidth)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, width]);

    // Y Scale
    const yMax =
      chartMode === 'daily'
        ? Math.max(d3.max(data, (d) => Math.max(d.actual, d.target)) || 1500, dailyGoal * 1.5)
        : Math.max(d3.max(data, (d) => Math.max(d.cumulativeActual, d.cumulativeTarget)) || 30000, 5000);

    const yScale = d3
      .scaleLinear()
      .domain([0, yMax * 1.1])
      .nice()
      .range([innerHeight, 0]);

    // Color definitions
    const primaryColor = 'var(--primary, #3b82f6)';
    const targetColor = '#f59e0b'; // Amber for targets
    const gridColor = 'var(--border, rgba(150, 150, 150, 0.2))';
    const textColor = 'var(--muted-foreground, #888888)';

    // Background Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', gridColor)
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-opacity', 0.5);

    // Gradient for Area under Actual Curve
    const defs = svg.append('defs');
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'areaGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    areaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'var(--primary, #3b82f6)')
      .attr('stop-opacity', 0.35);

    areaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'var(--primary, #3b82f6)')
      .attr('stop-opacity', 0.0);

    // Area Generator
    const areaGen = d3
      .area<DayDataPoint>()
      .curve(d3.curveMonotoneX)
      .x((d) => xScale(d.date))
      .y0(innerHeight)
      .y1((d) =>
        yScale(chartMode === 'daily' ? d.actual : d.cumulativeActual)
      );

    // Append Area
    g.append('path')
      .datum(data)
      .attr('fill', 'url(#areaGradient)')
      .attr('d', areaGen);

    // Target Line Generator
    const targetLineGen = d3
      .line<DayDataPoint>()
      .curve(chartMode === 'daily' ? d3.curveLinear : d3.curveLinear)
      .x((d) => xScale(d.date))
      .y((d) =>
        yScale(chartMode === 'daily' ? d.target : d.cumulativeTarget)
      );

    // Draw Target Line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', targetColor)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', chartMode === 'daily' ? '5,5' : '4,4')
      .attr('stroke-opacity', 0.85)
      .attr('d', targetLineGen);

    // Actual Line Generator
    const actualLineGen = d3
      .line<DayDataPoint>()
      .curve(d3.curveMonotoneX)
      .x((d) => xScale(d.date))
      .y((d) =>
        yScale(chartMode === 'daily' ? d.actual : d.cumulativeActual)
      );

    // Draw Actual Line
    const path = g
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'var(--primary, #3b82f6)')
      .attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', actualLineGen);

    // Animate Line Entrance
    const totalLength = (path.node() as SVGPathElement)?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(700)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Data Points / Dots
    const dotsGroup = g.append('g').attr('class', 'dots');
    dotsGroup
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => xScale(d.date))
      .attr('cy', (d) =>
        yScale(chartMode === 'daily' ? d.actual : d.cumulativeActual)
      )
      .attr('r', (d) => (d.actual > 0 ? 3.5 : 2))
      .attr('fill', (d) => {
        if (chartMode === 'daily') {
          return d.metGoal && d.actual > 0 ? '#10b981' : 'var(--card, #ffffff)';
        }
        return 'var(--primary, #3b82f6)';
      })
      .attr('stroke', (d) => {
        if (chartMode === 'daily') {
          return d.metGoal && d.actual > 0 ? '#10b981' : 'var(--primary, #3b82f6)';
        }
        return 'var(--card, #ffffff)';
      })
      .attr('stroke-width', 1.5);

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(d3.timeDay.every(4))
      .tickFormat((d) => d3.timeFormat('%b %d')(d as Date));

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((g) => g.select('.domain').attr('stroke', gridColor))
      .call((g) => g.selectAll('.tick line').attr('stroke', gridColor))
      .call((g) =>
        g
          .selectAll('.tick text')
          .attr('fill', textColor)
          .attr('font-size', '10px')
          .attr('dy', '1em')
      );

    // Y Axis
    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `${d3.format('~s')(d)}w`);

    g.append('g')
      .call(yAxis)
      .call((g) => g.select('.domain').remove())
      .call((g) => g.selectAll('.tick line').remove())
      .call((g) =>
        g
          .selectAll('.tick text')
          .attr('fill', textColor)
          .attr('font-size', '10px')
      );

    // Interactive Crosshair & Tooltip Overlay
    const crosshair = g
      .append('line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', 'var(--primary, #3b82f6)')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0);

    const highlightCircle = g
      .append('circle')
      .attr('r', 5)
      .attr('fill', 'var(--primary, #3b82f6)')
      .attr('stroke', 'var(--card, #ffffff)')
      .attr('stroke-width', 2)
      .style('opacity', 0);

    const bisect = d3.bisector<DayDataPoint, Date>((d) => d.date).center;

    svg
      .append('rect')
      .attr('width', containerWidth)
      .attr('height', height)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair')
      .on('mousemove', (event) => {
        const [xm, ym] = d3.pointer(event, g.node());
        const xDate = xScale.invert(xm);
        const idx = bisect(data, xDate);
        const d = data[idx];

        if (d) {
          const cx = xScale(d.date);
          const cy = yScale(chartMode === 'daily' ? d.actual : d.cumulativeActual);

          crosshair
            .attr('x1', cx)
            .attr('x2', cx)
            .style('opacity', 1);

          highlightCircle
            .attr('cx', cx)
            .attr('cy', cy)
            .style('opacity', 1);

          setHoveredPoint(d);
          setTooltipPos({
            x: cx + margin.left,
            y: cy + margin.top,
          });
        }
      })
      .on('mouseleave', () => {
        crosshair.style('opacity', 0);
        highlightCircle.style('opacity', 0);
        setHoveredPoint(null);
        setTooltipPos(null);
      });
  }, [data, chartMode, dailyGoal]);

  return (
    <div className="p-5 bg-card border border-border/80 rounded-xl shadow-xs space-y-4 select-none">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">
              30-Day Word Velocity & Target Analysis
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            D3 line visualization tracking daily progress against target output ({dailyGoal.toLocaleString()} words/day).
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="flex items-center gap-1 text-[11px] text-foreground font-medium">
              <span className="w-3 h-0.5 bg-primary rounded-full inline-block" />
              Actual
            </span>
            <span className="text-border">·</span>
            <span className="flex items-center gap-1 text-[11px] text-amber-500 font-medium">
              <span className="w-3 h-0.5 border-t border-dashed border-amber-500 inline-block" />
              Target ({dailyGoal.toLocaleString()}w)
            </span>
          </div>

          <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded-lg border border-border/40 text-xs">
            <button
              onClick={() => setChartMode('daily')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                chartMode === 'daily'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Daily Velocity
            </button>
            <button
              onClick={() => setChartMode('cumulative')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                chartMode === 'cumulative'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Cumulative Trajectory
            </button>
          </div>
        </div>
      </div>

      {/* 30-Day Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1">
          <span className="text-[11px] text-muted-foreground">30-Day Words Written</span>
          <div className="text-lg font-bold tabular-nums text-foreground">
            {totalWords30Days.toLocaleString()}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1">
          <span className="text-[11px] text-muted-foreground">Daily Target Met</span>
          <div className="text-lg font-bold tabular-nums text-emerald-500 flex items-baseline gap-1">
            <span>{daysGoalMet}</span>
            <span className="text-xs text-muted-foreground">/ 30 days</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1">
          <span className="text-[11px] text-muted-foreground">Peak Single Day</span>
          <div className="text-lg font-bold tabular-nums text-primary flex items-baseline gap-1">
            <span>+{peakDay.actual.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">words</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-muted/20 border border-border/50 space-y-1">
          <span className="text-[11px] text-muted-foreground">Avg. Daily Output</span>
          <div className="text-lg font-bold tabular-nums text-foreground flex items-baseline gap-1">
            <span>{avgVelocity.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">words/day</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div ref={containerRef} className="relative w-full overflow-hidden">
        <svg ref={svgRef} className="w-full overflow-visible" />

        {/* Floating Tooltip */}
        {hoveredPoint && tooltipPos && (
          <div
            className="absolute z-20 pointer-events-none p-3 rounded-lg bg-card/95 backdrop-blur border border-border shadow-xl text-xs space-y-1 w-52 transition-transform"
            style={{
              left: `${Math.min(
                (containerRef.current?.clientWidth || 700) - 220,
                Math.max(10, tooltipPos.x - 100)
              )}px`,
              top: `${Math.max(10, tooltipPos.y - 100)}px`,
            }}
          >
            <div className="font-semibold text-foreground border-b border-border/40 pb-1 flex items-center justify-between">
              <span>
                {hoveredPoint.date.toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
              {hoveredPoint.metGoal && (
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Goal Met
                </span>
              )}
            </div>

            {chartMode === 'daily' ? (
              <>
                <div className="flex justify-between items-center text-[11px] pt-0.5">
                  <span className="text-muted-foreground">Words Written:</span>
                  <span className="font-bold tabular-nums text-foreground">
                    {hoveredPoint.actual.toLocaleString()} words
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Target Goal:</span>
                  <span className="tabular-nums text-amber-500 font-medium">
                    {hoveredPoint.target.toLocaleString()} words
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] pt-1 border-t border-border/30 text-muted-foreground">
                  <span>Delta vs Target:</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      hoveredPoint.actual >= hoveredPoint.target
                        ? 'text-emerald-500'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {hoveredPoint.actual >= hoveredPoint.target ? '+' : ''}
                    {(hoveredPoint.actual - hoveredPoint.target).toLocaleString()}w
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center text-[11px] pt-0.5">
                  <span className="text-muted-foreground">Cumulative Written:</span>
                  <span className="font-bold tabular-nums text-foreground">
                    {hoveredPoint.cumulativeActual.toLocaleString()}w
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-muted-foreground">Target Trajectory:</span>
                  <span className="tabular-nums text-amber-500 font-medium">
                    {hoveredPoint.cumulativeTarget.toLocaleString()}w
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
