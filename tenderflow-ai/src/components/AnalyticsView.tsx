import React, { useEffect, useRef, useState } from 'react';
import { MOCK_ANALYTICS_DATA } from '../mockData';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';
import * as d3 from 'd3';
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Bookmark, 
  Percent, 
  Layers,
  Award
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const d3ContainerRef = useRef<SVGSVGElement | null>(null);
  const [hoveredState, setHoveredState] = useState<{ state: string; count: number } | null>(null);

  const data = MOCK_ANALYTICS_DATA;

  // Render D3 bubble diagram for popular state distributions
  useEffect(() => {
    if (!d3ContainerRef.current) return;

    // Clear previous SVG content to avoid duplicating
    d3.select(d3ContainerRef.current).selectAll('*').remove();

    const width = 380;
    const height = 240;

    const svg = d3.select(d3ContainerRef.current)
      .attr('width', width)
      .attr('height', height)
      .style('background', 'transparent');

    const stateData = data.popularStates;

    // Pack layout
    const pack = d3.pack()
      .size([width - 20, height - 20])
      .padding(15);

    // Hierarchy structure
    const root = d3.hierarchy({ children: stateData } as any)
      .sum((d: any) => d.count);

    const nodes = pack(root).leaves();

    // Color scales matching Tailwind indigo spectrum
    const colorScale = d3.scaleOrdinal<string>()
      .domain(stateData.map(d => d.state))
      .range(['#4f46e5', '#6366f1', '#818cf8', '#93c5fd', '#bfdbfe', '#e0f2fe']);

    // Node groups
    const node = svg.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', d => `translate(${d.x + 10}, ${d.y + 10})`)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d: any) => {
        setHoveredState({ state: d.data.state, count: d.data.count });
      })
      .on('mouseleave', () => {
        setHoveredState(null);
      });

    // Bubbles
    node.append('circle')
      .attr('r', d => d.r)
      .style('fill', d => colorScale((d.data as any).state))
      .style('fill-opacity', 0.85)
      .style('stroke', '#4f46e5')
      .style('stroke-width', 1.5)
      .style('transition', 'all 0.2s')
      .on('mouseover', function() {
        d3.select(this).style('fill-opacity', 1).style('stroke-width', 2.5);
      })
      .on('mouseout', function() {
        d3.select(this).style('fill-opacity', 0.85).style('stroke-width', 1.5);
      });

    // Bubble Text labels
    node.append('text')
      .attr('dy', '.3em')
      .style('text-anchor', 'middle')
      .style('font-size', d => Math.min(d.r / 3, 11) + 'px')
      .style('font-family', 'sans-serif')
      .style('font-weight', 'bold')
      .style('fill', '#ffffff')
      .text(d => (d.data as any).state);

  }, [data.popularStates]);

  const formattedINR = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(val / 100000).toFixed(0)} Lakhs`;
  };

  return (
    <div className="space-y-6">
      
      {/* SaaS Core Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Monthly Recurring (MRR)</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 block mt-1">
            {formattedINR(data.mrr)}
          </span>
          <span className="text-[9px] text-emerald-500 font-medium block mt-0.5">▲ 8.4% compared to May</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Annualized Run (ARR)</span>
            <Award className="h-4 w-4 text-indigo-500" />
          </div>
          <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 block mt-1">
            {formattedINR(data.arr)}
          </span>
          <span className="text-[9px] text-indigo-400 font-medium block mt-0.5">SaaS valuation metrics ready</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Accounts</span>
            <Users className="h-4 w-4 text-blue-500" />
          </div>
          <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 block mt-1">
            {data.activeUsersCount} Companies
          </span>
          <span className="text-[9px] text-emerald-500 font-medium block mt-0.5">▲ 48 organic signups</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">SaaS Customer Churn</span>
            <Percent className="h-4 w-4 text-rose-500" />
          </div>
          <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 block mt-1">
            {data.churnRate}%
          </span>
          <span className="text-[9px] text-emerald-500 font-medium block mt-0.5">▼ Lower than 3% target</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 col-span-2 lg:col-span-1">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Saved Tenders</span>
            <Bookmark className="h-4 w-4 text-indigo-500" />
          </div>
          <span className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 block mt-1">
            {data.savedTendersCount} Saved
          </span>
          <span className="text-[9px] text-slate-400 block mt-0.5">{data.tenderViewsCount} Cumulative search hits</span>
        </div>
      </div>

      {/* Main Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recharts - MRR Performance & Signups line chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">MRR Revenue Growth & Signups</h2>
              <p className="text-xs text-slate-400">Monthly breakdown of TenderFlow premium accounts performance</p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyPerformance} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', marginTop: '10px' }} />
                <Line type="monotone" name="MRR (INR)" dataKey="mrr" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 8 }} />
                <Line type="monotone" name="Monthly Active Users" dataKey="users" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* D3 States Representation circle diagram */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1">State Distribution (D3)</h2>
            <p className="text-xs text-slate-400">Dynamic bubble diagram mapping regional government bidding hubs</p>
          </div>

          {/* D3 Canvas Target */}
          <div className="flex justify-center items-center py-4 relative">
            <svg ref={d3ContainerRef} className="mx-auto"></svg>

            {/* Hover Tooltip inside Box */}
            {hoveredState ? (
              <div className="absolute bg-slate-950 border border-slate-800 text-slate-100 text-[10px] p-2 rounded-lg pointer-events-none shadow-xl">
                <span className="font-bold block">{hoveredState.state}</span>
                <span>Active Tenders: {hoveredState.count}</span>
              </div>
            ) : (
              <div className="absolute bottom-1 text-[9px] text-slate-400 font-semibold uppercase tracking-widest text-center">
                Hover state bubbles to inspect
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Categories Bar Chart (Popular categories) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">Volume & Valuation by Sector</h2>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.popularCategories} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="category" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                formatter={(value: any, name: any) => {
                  if (name === "Total Value (INR)") {
                    return [formattedINR(value), name];
                  }
                  return [value, "Tenders Published"];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar name="Tender Volume" dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar name="Total Value (INR)" dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
};
