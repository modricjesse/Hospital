import React, { useState } from 'react';
import { JurisdictionStat } from '../types/hospital';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Crosshair, 
  TrendingUp,
  CheckCircle2,
  MapPin,
  Activity
} from 'lucide-react';

interface RegionalMapWidgetProps {
  jurisdictions: JurisdictionStat[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const RegionalMapWidget: React.FC<RegionalMapWidgetProps> = ({
  jurisdictions,
  selectedId,
  onSelect,
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Map coordinates (normalized SVG coordinate space 0-540 width, 0-340 height)
  const zoneCoords: Record<string, { x: number; y: number; labelPos: 'top' | 'bottom' | 'right' | 'left' }> = {
    'jur-1': { x: 410, y: 220, labelPos: 'right' }, // Enugu North
    'jur-2': { x: 395, y: 175, labelPos: 'top' },   // Nsukka Urban
    'jur-3': { x: 120, y: 260, labelPos: 'left' },  // Lagos Island
    'jur-4': { x: 285, y: 140, labelPos: 'top' },   // Abuja FCT
  };

  const activeZone = jurisdictions.find(j => j.jurisdictionId === selectedId) || jurisdictions[0];

  return (
    <Card className="rounded-sm p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-rose-500" />
            <h3 className="text-sm font-bold text-white font-sans tracking-wide">
              Epidemiological Geospatial Outbreak Surveillance
            </h3>
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
            GEOPROCESSING NODE: TRANSMISSION VECTORS & QUARANTINE PERIMETERS
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <Badge variant="swiss" className="text-[9px]">
            ▪ CRITICAL (&gt; THRESHOLD)
          </Badge>
          <Badge variant="warning" className="text-[9px]">
            ▪ ELEVATED
          </Badge>
          <Badge variant="secondary" className="text-[9px]">
            ▪ BASELINE
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* SVG Interactive Map Canvas */}
        <div className="lg:col-span-8 relative bg-zinc-950 rounded-sm border border-zinc-800 p-4 flex items-center justify-center overflow-hidden min-h-[300px]">
          
          {/* Subtle Grid Lines */}
          <div 
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, #f43f5e 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <svg
            viewBox="0 0 540 340"
            className="w-full h-auto max-h-[320px] select-none"
          >
            {/* Nigeria Regional Schematic Silhouette / Territory paths */}
            <path
              d="M 60,220 C 70,180 110,130 180,90 C 230,60 310,50 380,70 C 440,90 490,130 500,180 C 510,220 470,280 410,310 C 340,330 250,320 180,310 C 120,300 70,270 60,220 Z"
              fill="#090a0f"
              stroke="#27272a"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Connecting Transit Vectors */}
            <line x1="120" y1="260" x2="285" y2="140" stroke="#3f3f46" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
            <line x1="285" y1="140" x2="410" y2="220" stroke="#3f3f46" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
            <line x1="395" y1="175" x2="410" y2="220" stroke="#e11d48" strokeWidth="2" opacity="0.8" />

            {/* Render Nodes for Each Jurisdiction */}
            {jurisdictions.map(jur => {
              const coords = zoneCoords[jur.jurisdictionId] || { x: 270, y: 170, labelPos: 'top' };
              const isSelected = selectedId === jur.jurisdictionId;
              const isCritical = jur.alertLevel === 'Critical';
              const isElevated = jur.alertLevel === 'Elevated';
              const nodeColor = isCritical ? '#f43f5e' : isElevated ? '#fbbf24' : '#10b981';

              return (
                <g
                  key={jur.jurisdictionId}
                  className="cursor-pointer transition-all"
                  onClick={() => onSelect(jur.jurisdictionId)}
                  onMouseEnter={() => setHoveredId(jur.jurisdictionId)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Containment Halo Ring */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={isSelected ? 32 : isCritical ? 26 : 20}
                    fill={nodeColor}
                    fillOpacity={isSelected ? 0.2 : 0.08}
                    stroke={nodeColor}
                    strokeWidth={isSelected ? 2 : 1}
                    strokeOpacity={0.7}
                    className={isCritical ? 'animate-pulse' : ''}
                  />

                  {/* Pulsing Outer Radar Ring */}
                  {isCritical && (
                    <circle
                      cx={coords.x}
                      cy={coords.y}
                      r={42}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                      opacity="0.4"
                    />
                  )}

                  {/* Center Node Pin */}
                  <circle
                    cx={coords.x}
                    cy={coords.y}
                    r={isSelected ? 7 : 5}
                    fill={nodeColor}
                    stroke="#090a0f"
                    strokeWidth="2"
                  />

                  {/* Node Label Text */}
                  <text
                    x={coords.x}
                    y={coords.y + (coords.labelPos === 'bottom' ? 22 : coords.labelPos === 'top' ? -16 : 4)}
                    textAnchor={coords.labelPos === 'right' ? 'start' : coords.labelPos === 'left' ? 'end' : 'middle'}
                    dx={coords.labelPos === 'right' ? 14 : coords.labelPos === 'left' ? -14 : 0}
                    fill={isSelected ? '#ffffff' : '#a1a1aa'}
                    fontSize="11"
                    fontFamily="Plus Jakarta Sans, sans-serif"
                    fontWeight={isSelected ? '700' : '500'}
                  >
                    {jur.name.split(' ')[0]}
                  </text>

                  <text
                    x={coords.x}
                    y={coords.y + (coords.labelPos === 'bottom' ? 34 : coords.labelPos === 'top' ? -4 : 16)}
                    textAnchor={coords.labelPos === 'right' ? 'start' : coords.labelPos === 'left' ? 'end' : 'middle'}
                    dx={coords.labelPos === 'right' ? 14 : coords.labelPos === 'left' ? -14 : 0}
                    fill={nodeColor}
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                    fontWeight="600"
                  >
                    {jur.activeCases} Cases ({jur.twentyFourHourTrend})
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Map Controls Tooltip */}
          <div className="absolute bottom-2.5 left-3 text-[10px] font-mono text-zinc-500">
            Click jurisdiction node on vector map to inspect localized containment data
          </div>
        </div>

        {/* Selected Jurisdiction Focus Panel (4 cols) */}
        <div className="lg:col-span-4 bg-zinc-950 border border-zinc-800 rounded-sm p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500">
                DISTRICT FOCUS
              </span>
              <Badge
                variant={activeZone.alertLevel === 'Critical' ? 'swiss' : activeZone.alertLevel === 'Elevated' ? 'warning' : 'secondary'}
                className="font-mono text-[9px]"
              >
                {activeZone.alertLevel} ALERT
              </Badge>
            </div>

            <div>
              <h4 className="font-bold text-white text-base leading-tight font-sans">{activeZone.name}</h4>
              <div className="text-xs text-zinc-400 font-mono mt-0.5">{activeZone.state}</div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-800 text-xs font-mono">
              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-sm border border-zinc-800">
                <span className="text-zinc-500 text-[10px]">PRIMARY PATHOGEN</span>
                <span className="text-rose-400 font-sans font-semibold text-right text-[11px] truncate max-w-[130px]">
                  {activeZone.focalPathogen}
                </span>
              </div>

              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-sm border border-zinc-800">
                <span className="text-zinc-500 text-[10px]">ACTIVE ISOLATED</span>
                <span className="text-white font-bold">{activeZone.quarantinedCount} / {activeZone.activeCases}</span>
              </div>

              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-sm border border-zinc-800">
                <span className="text-zinc-500 text-[10px]">THRESHOLD SATURATION</span>
                <span className={`font-bold ${activeZone.activeCases >= activeZone.thresholdMax ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {Math.round((activeZone.activeCases / activeZone.thresholdMax) * 100)}%
                </span>
              </div>

              <div className="flex justify-between items-center bg-zinc-900 p-2 rounded-sm border border-zinc-800">
                <span className="text-zinc-500 text-[10px]">24H CASE TRAJECTORY</span>
                <span className="text-amber-400 font-bold">{activeZone.twentyFourHourTrend}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelect(activeZone.jurisdictionId)}
              className="w-full gap-1.5 font-mono text-xs text-zinc-200"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-rose-500" />
              <span>Select {activeZone.name.split(' ')[0]} in Surveillance Table</span>
            </Button>
          </div>
        </div>

      </div>
    </Card>
  );
};
