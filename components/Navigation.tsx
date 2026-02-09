
import React from 'react';
import { DashboardTab } from '../types';
import { FileSearch, Activity, Network, GitMerge, Zap, ShieldAlert, FileText, LayoutDashboard, Scan, Ruler, EyeOff } from 'lucide-react';

interface NavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: { id: DashboardTab; label: string; icon: React.ReactNode }[] = [
    { id: 'OVERVIEW', label: 'Incident Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'EVIDENCE', label: 'Evidence & Video', icon: <FileSearch className="w-4 h-4" /> },
    { id: 'PERCEPTION', label: 'Perception & Signals', icon: <Scan className="w-4 h-4" /> },
    { id: 'MEASUREMENTS', label: 'Measurements & Dynamics', icon: <Ruler className="w-4 h-4" /> },
    { id: 'UNCERTAINTY', label: 'Uncertainty & Observability', icon: <EyeOff className="w-4 h-4" /> },
    { id: 'SIGNALS', label: 'Signals & Metrics', icon: <Activity className="w-4 h-4" /> },
    { id: 'CAUSAL', label: 'Causal Graph', icon: <Network className="w-4 h-4" /> },
    { id: 'COUNTERFACTUAL', label: 'Counterfactuals', icon: <GitMerge className="w-4 h-4" /> },
    { id: 'STRESS', label: 'Stress Tests', icon: <Zap className="w-4 h-4" /> },
    { id: 'INTERVENTION', label: 'Interventions', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'AUDIT', label: 'Audit & Reports', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <nav className="h-12 bg-slate-900 border-b border-slate-700 flex items-center px-4 overflow-x-auto no-scrollbar">
      <div className="flex space-x-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-800' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'}
            `}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
