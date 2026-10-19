import React, { useState } from 'react';
import { Screen } from '../types/lvgl';
import { Plus, Monitor, Trash2, Edit2, Check } from 'lucide-react';

interface ScreenManagerProps {
  screens: Screen[];
  activeScreenId: string;
  onSelectScreen: (id: string) => void;
  onAddScreen: (name: string) => void;
  onDeleteScreen: (id: string) => void;
  onUpdateScreenColor: (id: string, color: string) => void;
  onRenameScreen: (id: string, name: string) => void;
}

export const ScreenManager: React.FC<ScreenManagerProps> = ({
  screens,
  activeScreenId,
  onSelectScreen,
  onAddScreen,
  onDeleteScreen,
  onUpdateScreenColor,
  onRenameScreen,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newScreenName, setNewScreenName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const activeScreen = screens.find((s) => s.id === activeScreenId);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newScreenName.trim()) {
      onAddScreen(newScreenName.trim().replace(/[^a-zA-Z0-9_]/g, '_'));
      setNewScreenName('');
      setIsAdding(false);
    }
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      onRenameScreen(id, editName.trim().replace(/[^a-zA-Z0-9_]/g, '_'));
    }
    setEditingId(null);
  };

  return (
    <div className="h-10 px-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between z-20 shrink-0 text-xs select-none">
      {/* Left: Screen Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto">
        <span className="text-[11px] font-mono text-slate-500 uppercase mr-1 flex items-center gap-1">
          <Monitor className="w-3.5 h-3.5" />
          Screens:
        </span>

        {screens.map((screen) => {
          const isActive = screen.id === activeScreenId;
          const isEditing = screen.id === editingId;

          if (isEditing) {
            return (
              <div key={screen.id} className="flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded">
                <input
                  type="text"
                  autoFocus
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(screen.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="w-24 bg-slate-900 border border-cyan-500 rounded px-1 text-xs font-mono text-cyan-300 focus:outline-none"
                />
                <button
                  onClick={() => handleSaveRename(screen.id)}
                  className="text-cyan-400 hover:text-cyan-300"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={screen.id}
              onClick={() => onSelectScreen(screen.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full border border-slate-600 shrink-0"
                style={{ backgroundColor: screen.bgColor }}
              />
              <span className="font-mono">{screen.name}</span>

              {isActive && (
                <div className="flex items-center gap-0.5 ml-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(screen.id);
                      setEditName(screen.name);
                    }}
                    className="p-0.5 text-slate-500 hover:text-slate-300"
                    title="Rename screen"
                  >
                    <Edit2 className="w-2.5 h-2.5" />
                  </button>
                  {screens.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteScreen(screen.id);
                      }}
                      className="p-0.5 text-slate-500 hover:text-rose-400"
                      title="Delete screen"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Screen Button */}
        {isAdding ? (
          <form onSubmit={handleCreate} className="flex items-center gap-1">
            <input
              type="text"
              autoFocus
              placeholder="screen_settings"
              value={newScreenName}
              onChange={(e) => setNewScreenName(e.target.value)}
              className="w-28 bg-slate-900 border border-cyan-500/70 rounded px-1.5 py-0.5 text-xs font-mono text-cyan-300 focus:outline-none"
            />
            <button
              type="submit"
              className="bg-cyan-500 text-slate-950 px-2 py-0.5 rounded font-medium text-xs"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-200 px-1 text-xs"
            >
              Cancel
            </button>
          </form>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-2 py-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-900 text-xs transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Screen</span>
          </button>
        )}
      </div>

      {/* Right: Active Screen Background Color */}
      {activeScreen && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Screen BG:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="color"
              value={activeScreen.bgColor}
              onChange={(e) => onUpdateScreenColor(activeScreen.id, e.target.value)}
              className="w-5 h-5 rounded border border-slate-700 bg-transparent cursor-pointer"
            />
            <span className="font-mono text-xs text-slate-300">{activeScreen.bgColor}</span>
          </div>
        </div>
      )}
    </div>
  );
};
