import React from 'react';
import { Download, Cpu, LayoutTemplate, Code2, Play } from 'lucide-react';

interface TopBarProps {
  onOpenTemplates: () => void;
  onOpenHardware: () => void;
  onOpenCodeExport: () => void;
  activeView: 'designer' | 'templates' | 'hardware' | 'code';
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenTemplates,
  onOpenHardware,
  onOpenCodeExport,
  activeView,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3 border-b border-slate-800 bg-[#0B0F19] text-white shrink-0 z-30">
      {/* Zone 1: Brand Wordmark (Single text element in display face, no descriptors/pills) */}
      <div className="text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2">
        <span className="text-cyan-400 font-mono">&lt;/&gt;</span>
        <span>LVGL Studio</span>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <button
          onClick={() => {}}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeView === 'designer' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Designer
        </button>
        <button
          onClick={onOpenTemplates}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Templates
        </button>
        <button
          onClick={onOpenHardware}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Hardware & RAM
        </button>
        <button
          onClick={onOpenCodeExport}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Code Preview
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenCodeExport}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Export C Code</span>
        </button>
      </div>
    </header>
  );
};
