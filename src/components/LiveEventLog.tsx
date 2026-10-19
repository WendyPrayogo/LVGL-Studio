import React, { useState } from 'react';
import { Terminal, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export interface EventLogItem {
  id: string;
  timestamp: string;
  widgetName: string;
  eventType: string;
  handlerName: string;
  detail: any;
}

interface LiveEventLogProps {
  logs: EventLogItem[];
  onClearLogs: () => void;
}

export const LiveEventLog: React.FC<LiveEventLogProps> = ({ logs, onClearLogs }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="border-t border-slate-800 bg-[#090D16] flex flex-col shrink-0 select-none transition-all">
      {/* Header bar */}
      <div className="h-8 px-4 flex items-center justify-between bg-slate-900/80 border-b border-slate-800/80 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-mono font-medium text-slate-300">
            Interactive Firmware Event Stream
          </span>
          <span className="text-[11px] font-mono text-cyan-500">
            ({logs.length} events)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400"
              title="Clear event logs"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-white"
          >
            {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Logs stream body */}
      {!isCollapsed && (
        <div className="h-28 overflow-y-auto p-2 font-mono text-[11px] space-y-1">
          {logs.length === 0 ? (
            <div className="text-slate-500 italic py-2 px-2 text-center">
              Waiting for user interactions in Interactive Simulation mode... Click buttons, drag sliders, or toggle switches on the display.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-2 py-0.5 px-2 rounded hover:bg-slate-800/40"
              >
                <span className="text-slate-500 shrink-0">{log.timestamp}</span>
                <span className="text-cyan-400 font-bold shrink-0">{log.eventType}</span>
                <span className="text-slate-400 shrink-0">→</span>
                <span className="text-amber-300 font-semibold">{log.handlerName}()</span>
                <span className="text-slate-300 font-medium shrink-0">on {log.widgetName}</span>
                {log.detail?.action ? (
                  <span className="text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/50 px-1.5 py-0.5 rounded text-[10px] truncate">
                    {log.detail.action}
                  </span>
                ) : (
                  <span className="text-slate-500 truncate">
                    ({JSON.stringify(log.detail)})
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
