import React, { useMemo, useState } from 'react';
import { AnalyzedEvent, AnalysisSummary } from '../types';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label,
  BarChart, Bar, Cell
} from 'recharts';
import { Clock, Zap, Target, Activity, ArrowLeft, Filter } from 'lucide-react';
import clsx from 'clsx';

interface AnalysisDashboardProps {
  events: AnalyzedEvent[];
  summary: AnalysisSummary;
  onReset: () => void;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ events, onReset }) => {
  const [filterType, setFilterType] = useState<'All' | 'Slam'>('All');
  const [outlierThreshold, setOutlierThreshold] = useState<number>(1.0);

  // Dynamically calculate events and summary based on the threshold
  const { filteredData, currentSummary } = useMemo(() => {
    const validSlams = events.filter(e => 
      e.type === 'Slam' && 
      e.slamDelay !== undefined && 
      e.slamDelay <= outlierThreshold
    );

    const summary: AnalysisSummary = {
      totalSlams: validSlams.length,
      averageDelay: validSlams.length > 0 ? validSlams.reduce((acc, curr) => acc + (curr.slamDelay || 0), 0) / validSlams.length : 0,
      minDelay: validSlams.length > 0 ? Math.min(...validSlams.map(s => s.slamDelay as number)) : 0,
      maxDelay: validSlams.length > 0 ? Math.max(...validSlams.map(s => s.slamDelay as number)) : 0,
      perfectSlams: validSlams.filter(s => (s.slamDelay || 0) < 0.1 && (s.slamDelay || 0) >= 0).length
    };

    return {
      filteredData: validSlams.map(e => ({
        time: e.timestamp,
        delay: parseFloat((e.slamDelay || 0).toFixed(3)),
        tooltipTime: e.timestampStr,
        rawEvent: e.rawEvent
      })),
      currentSummary: summary
    };
  }, [events, outlierThreshold]);

  // Prepare Histogram Data based on dynamic threshold
  const histogramData = useMemo(() => {
    const binCounts: Record<string, number> = {};
    
    // Initialize bins up to the current threshold
    const step = 0.1;
    for (let i = -0.2; i <= outlierThreshold + 0.05; i += step) {
      binCounts[i.toFixed(1)] = 0;
    }

    filteredData.forEach(e => {
      const delay = e.delay;
      const bin = (Math.floor(delay * 10) / 10).toFixed(1);
      if (binCounts[bin] !== undefined) {
        binCounts[bin]++;
      } else if (parseFloat(bin) < -0.2) {
        binCounts["-0.2"] = (binCounts["-0.2"] || 0) + 1;
      }
    });

    return Object.entries(binCounts).map(([range, count]) => ({
      range: `${range}s`,
      count,
      value: parseFloat(range)
    })).sort((a, b) => a.value - b.value);
  }, [filteredData, outlierThreshold]);

  const displayEvents = useMemo(() => {
    const base = filterType === 'All' ? events : events.filter(e => e.type === 'Slam');
    return base.map(e => {
      const isOutlier = e.type === 'Slam' && e.slamDelay !== undefined && e.slamDelay > outlierThreshold;
      return { ...e, isOutlier };
    });
  }, [events, filterType, outlierThreshold]);

  const StatCard = ({ title, value, unit, icon: Icon, colorClass }: any) => (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-slate-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <Icon className={clsx("w-5 h-5", colorClass)} />
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-white">{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
          <p className="text-slate-300 mb-1"><span className="font-semibold text-white">Time:</span> {data.tooltipTime}</p>
          <p className="text-slate-300 mb-1"><span className="font-semibold text-yellow-400">Delay:</span> {data.delay}s</p>
          <p className="text-slate-500 italic max-w-xs truncate">{data.rawEvent}</p>
        </div>
      );
    }
    return null;
  };

  const HistogramTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
          <p className="text-slate-300"><span className="font-semibold text-white">Range:</span> {label}</p>
          <p className="text-slate-300"><span className="font-semibold text-blue-400">Count:</span> {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analysis Results</h1>
          <p className="text-slate-400">Delay Calculation: (Slam Time - Prev Melee/HS Time) - 0.5s</p>
        </div>
        
        <div className="flex items-center gap-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 shadow-inner">
          <div className="flex flex-col gap-1 min-w-[200px]">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-400 uppercase flex items-center gap-1">
                <Filter size={12} /> Outlier Cutoff
              </label>
              <span className="text-blue-400 font-mono font-bold text-sm">{outlierThreshold.toFixed(1)}s</span>
            </div>
            <input 
              type="range" 
              min="0.5" 
              max="3.0" 
              step="0.1" 
              value={outlierThreshold} 
              onChange={(e) => setOutlierThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
          <button 
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm font-medium h-fit"
          >
            <ArrowLeft size={16} />
            Reset
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Analyzed Slams" 
          value={currentSummary.totalSlams} 
          icon={Target} 
          colorClass="text-blue-400" 
        />
        <StatCard 
          title="Avg Delay" 
          value={currentSummary.averageDelay.toFixed(3)} 
          unit="s" 
          icon={Clock} 
          colorClass="text-yellow-400" 
        />
        <StatCard 
          title="Max Delay" 
          value={currentSummary.maxDelay.toFixed(3)} 
          unit="s" 
          icon={Activity} 
          colorClass="text-red-400" 
        />
        <StatCard 
          title="Perfect (<0.1s)" 
          value={currentSummary.perfectSlams} 
          icon={Zap} 
          colorClass="text-green-400" 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* Scatter Chart (Time Series) */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm min-h-[400px]">
          <h2 className="text-lg font-semibold text-white mb-6">Delay Timeline</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis 
                  type="number" 
                  dataKey="time" 
                  name="Time" 
                  unit="s" 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8'}}
                >
                  <Label value="Fight Time (s)" offset={0} position="insideBottom" fill="#64748b" />
                </XAxis>
                <YAxis 
                  type="number" 
                  dataKey="delay" 
                  name="Delay" 
                  unit="s" 
                  stroke="#94a3b8"
                  tick={{fill: '#94a3b8'}}
                  domain={[-0.2, outlierThreshold]}
                >
                  <Label value="Delay (s)" angle={-90} position="insideLeft" fill="#64748b" />
                </YAxis>
                <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <ReferenceLine y={0} stroke="#4ade80" strokeDasharray="3 3" />
                <ReferenceLine y={0.5} stroke="#f87171" strokeDasharray="3 3" />
                <Scatter name="Slam Delays" data={filteredData} fill="#facc15" fillOpacity={0.6} stroke="#eab308" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Histogram (Frequency) */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm min-h-[400px]">
          <h2 className="text-lg font-semibold text-white mb-6">Delay Frequency Distribution</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogramData} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} vertical={false} />
                <XAxis 
                  dataKey="range" 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8', fontSize: 10}}
                  interval={Math.ceil(histogramData.length / 10)}
                >
                  <Label value="Delay Bracket" offset={0} position="insideBottom" fill="#64748b" />
                </XAxis>
                <YAxis 
                  stroke="#94a3b8" 
                  tick={{fill: '#94a3b8'}} 
                  allowDecimals={false}
                >
                  <Label value="Count" angle={-90} position="insideLeft" fill="#64748b" />
                </YAxis>
                <Tooltip content={<HistogramTooltip />} cursor={{fill: '#334155', opacity: 0.3}} />
                <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                  {histogramData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.value <= 0.1 ? '#4ade80' : // Green for <= 0.1
                      entry.value <= 0.3 ? '#facc15' : // Yellow for 0.2 - 0.3
                      '#f87171' // Red for others
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Data Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[500px]">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Event Log</h2>
            <span className="text-xs text-slate-500 italic">Red entries are outliers &gt; {outlierThreshold}s</span>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilterType('All')}
              className={clsx("px-3 py-1 text-xs font-medium rounded-full transition-colors", filterType === 'All' ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600")}
            >
              All Events
            </button>
            <button 
              onClick={() => setFilterType('Slam')}
              className={clsx("px-3 py-1 text-xs font-medium rounded-full transition-colors", filterType === 'Slam' ? "bg-yellow-600 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600")}
            >
              Slams Only
            </button>
          </div>
        </div>
        
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-900/50 text-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 font-medium">Timestamp</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Event Detail</th>
                <th className="px-6 py-3 font-medium text-right">Calculated Delay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {displayEvents.map((event) => (
                <tr key={event.id} className={clsx(
                  "hover:bg-slate-700/30 transition-colors",
                  event.isOutlier && "bg-red-500/5 opacity-60"
                )}>
                  <td className="px-6 py-3 font-mono text-slate-300">{event.timestampStr}</td>
                  <td className="px-6 py-3">
                    <span className={clsx(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      event.type === 'Slam' ? "bg-yellow-500/10 text-yellow-400" :
                      event.type === 'Melee' ? "bg-blue-500/10 text-blue-400" :
                      "bg-slate-500/10 text-slate-400"
                    )}>
                      {event.type}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-300 max-w-md truncate" title={event.rawEvent}>
                    {event.rawEvent}
                  </td>
                  <td className="px-6 py-3 text-right font-mono">
                    {event.slamDelay !== undefined ? (
                      <span className={clsx(
                        event.isOutlier ? "text-red-600 line-through" :
                        event.slamDelay < 0.1 ? "text-green-400" :
                        event.slamDelay < 0.5 ? "text-yellow-400" : "text-red-400"
                      )}>
                        {event.slamDelay > 0 ? '+' : ''}{event.slamDelay.toFixed(3)}s
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayEvents.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              No events found for this filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;