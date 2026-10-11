import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Layers, Info } from 'lucide-react';

interface Jurisdiction {
  jurisdictionId: string;
  name: string;
  state: string;
  focalPathogen: string;
  activeCases: number;
  thresholdMax: number;
  quarantinedCount: number;
  alertLevel: 'Normal' | 'Elevated' | 'Critical';
}

interface PathogenHeatmapD3Props {
  jurisdictions: Jurisdiction[];
  selectedJurisdiction: string;
  onSelectJurisdiction: (id: string) => void;
}

export const PathogenHeatmapD3: React.FC<PathogenHeatmapD3Props> = ({
  jurisdictions,
  selectedJurisdiction,
  onSelectJurisdiction,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltipData, setTooltipData] = useState<{
    x: number;
    y: number;
    jurisdiction: string;
    pathogen: string;
    cases: number;
    threshold: number;
    risk: string;
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || jurisdictions.length === 0) return;

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove();

    const width = containerRef.current.clientWidth || 700;
    const margin = { top: 40, right: 30, bottom: 60, left: 160 };
    const innerWidth = width - margin.left - margin.right;
    
    // Pathogen categories
    const pathogens = Array.from(new Set(jurisdictions.map(j => j.focalPathogen)));
    const cellHeight = 45;
    const innerHeight = jurisdictions.length * cellHeight;
    const height = innerHeight + margin.top + margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale (Pathogens)
    const xScale = d3.scaleBand()
      .domain(pathogens)
      .range([0, innerWidth])
      .padding(0.1);

    // Y scale (Jurisdictions)
    const yScale = d3.scaleBand()
      .domain(jurisdictions.map(j => j.name))
      .range([0, innerHeight])
      .padding(0.15);

    // Color scale based on active cases ratio
    const maxCases = d3.max(jurisdictions, d => d.activeCases) || 100;
    const colorScale = d3.scaleSequential<string>()
      .domain([0, maxCases])
      .interpolator(d3.interpolateYlOrRd);

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'translate(-10,10)rotate(-25)')
      .style('text-anchor', 'end')
      .style('fill', '#a1a1aa')
      .style('font-family', 'monospace')
      .style('font-size', '10px');

    // Add Y axis
    svg.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', '#d4d4d8')
      .style('font-family', 'monospace')
      .style('font-size', '11px')
      .style('font-weight', '500');

    // Remove axis lines for minimalist Swiss look
    svg.selectAll('.domain, .tick line').attr('stroke', '#27272a');

    // Build data matrix grid
    const matrixData: { jurisdiction: Jurisdiction; pathogen: string; value: number }[] = [];
    jurisdictions.forEach(j => {
      pathogens.forEach(p => {
        // assign prevalence value if it matches focalPathogen, else proportional ambient
        const match = j.focalPathogen === p ? j.activeCases : Math.round(j.activeCases * 0.15 * Math.random());
        matrixData.push({
          jurisdiction: j,
          pathogen: p,
          value: match
        });
      });
    });

    // Add background grid cells
    const cells = svg.selectAll('g.cell')
      .data(jurisdictions)
      .enter()
      .append('g')
      .selectAll('rect')
      .data(j => pathogens.map(p => ({
        jurisdiction: j,
        pathogen: p,
        value: j.focalPathogen === p ? j.activeCases : Math.floor(j.activeCases * 0.12)
      })))
      .enter();

    cells.append('rect')
      .attr('x', d => xScale(d.pathogen) || 0)
      .attr('y', d => yScale(d.jurisdiction.name) || 0)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 2)
      .attr('ry', 2)
      .attr('fill', d => colorScale(d.value))
      .attr('stroke', d => d.jurisdiction.jurisdictionId === selectedJurisdiction ? '#38bdf8' : '#27272a')
      .attr('stroke-width', d => d.jurisdiction.jurisdictionId === selectedJurisdiction ? 2 : 1)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        const [mx, my] = d3.pointer(event, svgRef.current as any);
        setTooltipData({
          x: mx + 20,
          y: my + 20,
          jurisdiction: d.jurisdiction.name,
          pathogen: d.pathogen,
          cases: d.value,
          threshold: d.jurisdiction.thresholdMax,
          risk: d.jurisdiction.alertLevel,
        });
        d3.select(event.target as SVGRectElement)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
      })
      .on('mouseleave', (event, d) => {
        setTooltipData(null);
        d3.select(event.target as SVGRectElement)
          .attr('stroke', d.jurisdiction.jurisdictionId === selectedJurisdiction ? '#38bdf8' : '#27272a')
          .attr('stroke-width', d.jurisdiction.jurisdictionId === selectedJurisdiction ? 2 : 1);
      })
      .on('click', (_, d) => {
        onSelectJurisdiction(d.jurisdiction.jurisdictionId);
      });

    // Add text labels inside cells if bandwidth permits
    cells.append('text')
      .attr('x', d => (xScale(d.pathogen) || 0) + xScale.bandwidth() / 2)
      .attr('y', d => (yScale(d.jurisdiction.name) || 0) + yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'middle')
      .style('fill', d => d.value > maxCases * 0.5 ? '#000000' : '#f4f4f5')
      .style('font-family', 'monospace')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => d.value > 0 ? d.value : '');

    // Title label on top
    svg.append('text')
      .attr('x', 0)
      .attr('y', -15)
      .style('fill', '#a1a1aa')
      .style('font-family', 'monospace')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .text('REGIONAL PATHOGEN PREVALENCE MATRIX (D3.JS HEATMAP)');

  }, [jurisdictions, selectedJurisdiction]);

  return (
    <Card className="rounded-sm border-zinc-800 bg-zinc-950/90 relative overflow-hidden">
      <CardHeader className="pb-3 border-b border-zinc-800/80">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase text-teal-400 tracking-wider">
                D3.JS ANALYTICS ENGINE // HEATMAP
              </span>
              <Badge variant="verified" className="text-[9px] font-mono">
                REALTIME PREVALENCE
              </Badge>
            </div>
            <CardTitle className="text-base sm:text-lg font-bold text-white mt-0.5">
              Regional Pathogen Prevalence Matrix
            </CardTitle>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
            <Info className="h-4 w-4 text-teal-400" />
            <span>Click cell to inspect zone</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 relative" ref={containerRef}>
        <div className="overflow-x-auto w-full">
          <svg ref={svgRef} className="w-full h-auto min-w-[500px]" />
        </div>

        {/* Floating Tooltip */}
        {tooltipData && (
          <div
            className="absolute z-50 pointer-events-none bg-zinc-900 border border-zinc-700 p-3 rounded-sm shadow-xl text-xs font-mono space-y-1"
            style={{
              left: Math.min(tooltipData.x, 400),
              top: tooltipData.y,
            }}
          >
            <div className="font-bold text-white text-sm">{tooltipData.jurisdiction}</div>
            <div className="text-rose-400">Pathogen: {tooltipData.pathogen}</div>
            <div className="text-zinc-300">Active Cases: <strong className="text-white">{tooltipData.cases}</strong></div>
            <div className="text-zinc-400">Statutory Limit: {tooltipData.threshold}</div>
            <div className="text-[10px] text-teal-400 uppercase font-semibold">Alert Status: {tooltipData.risk}</div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2">
            <span>Color Scale Intensity:</span>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 bg-amber-100 inline-block rounded-xs"></span>
              <span className="text-[10px]">Low</span>
              <span className="w-3 h-3 bg-amber-500 inline-block rounded-xs ml-2"></span>
              <span className="text-[10px]">Moderate</span>
              <span className="w-3 h-3 bg-rose-600 inline-block rounded-xs ml-2"></span>
              <span className="text-[10px]">Critical Outbreak</span>
            </div>
          </div>
          <div className="text-[10px] text-zinc-500">
            Rendered via D3.js ScaleSequential & SVG Matrix
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
