import React from 'react';
import { SmartHealthScore } from '../types';
import { Activity, ShieldCheck, AlertTriangle, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';

interface SmartLabHealthScoreCardProps {
  score: SmartHealthScore;
  labName?: string;
}

export const SmartLabHealthScoreCard: React.FC<SmartLabHealthScoreCardProps> = ({ score, labName }) => {
  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
    if (val >= 70) return 'text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50 dark:bg-amber-950/30';
    return 'text-rose-600 dark:text-rose-400 border-rose-500 bg-rose-50 dark:bg-rose-950/30';
  };

  const getStatusBadge = (val: number) => {
    if (val >= 85) return { label: 'Optimal Operational Health', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' };
    if (val >= 70) return { label: 'Moderate / Action Advised', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300' };
    return { label: 'Attention Required', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300' };
  };

  const status = getStatusBadge(score.overall);

  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-border dark:border-slate-800 rounded-3xl shadow-card transition-all hover:shadow-card-hover">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#9333EA] to-[#4F7DFF] text-white flex items-center justify-center shadow-md shadow-purple-500/25">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-heading font-extrabold text-xl text-foreground dark:text-white">
                Smart Lab Health Score
              </h3>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Multi-factor operational reliability index {labName ? `for ${labName}` : 'across facility'}
            </p>
          </div>
        </div>

        {/* Big Score Gauge Badge */}
        <div className="flex items-center space-x-3">
          <div className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center font-heading font-black text-2xl ${getScoreColor(score.overall)} shadow-sm`}>
            <span>{score.overall}</span>
            <span className="text-[10px] font-medium uppercase tracking-wider -mt-1 opacity-80">/ 100</span>
          </div>
        </div>
      </div>

      {/* Breakdown Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border/70 dark:border-slate-700/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Equipment Ready
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-black text-foreground dark:text-white">{score.availabilityScore}%</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Online & calibrated</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border/70 dark:border-slate-700/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Maintenance Readiness
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-black text-foreground dark:text-white">{score.maintenanceScore}%</span>
          </div>
          <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Work order status</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border/70 dark:border-slate-700/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Stock Sufficiency
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-black text-foreground dark:text-white">{score.stockScore}%</span>
          </div>
          <p className="text-[11px] text-purple-600 font-semibold mt-0.5">Critical items above min</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-border/70 dark:border-slate-700/60">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
            Safety Compliance
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1">
            <span className="text-xl font-black text-foreground dark:text-white">{score.incidentScore}%</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Incident risk index</p>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border/60 dark:border-slate-800 flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          {score.summary}
        </span>
        <span className="font-mono text-[11px]">Updated live</span>
      </div>
    </div>
  );
};
