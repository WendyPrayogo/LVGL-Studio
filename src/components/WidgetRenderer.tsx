import React from 'react';
import { LVGLWidget } from '../types/lvgl';

interface WidgetRendererProps {
  widget: LVGLWidget;
  isSelected: boolean;
  isSimulating: boolean;
  onUpdateProp: (id: string, propKey: string, value: any) => void;
  onTriggerEvent?: (widget: LVGLWidget, eventName: string, detail: any) => void;
}

export const WidgetRenderer: React.FC<WidgetRendererProps> = ({
  widget,
  isSelected,
  isSimulating,
  onUpdateProp,
  onTriggerEvent,
}) => {
  const { styles, props, type } = widget;

  const fontClass =
    styles.fontSize === '12'
      ? 'text-xs'
      : styles.fontSize === '14'
      ? 'text-sm'
      : styles.fontSize === '16'
      ? 'text-base'
      : styles.fontSize === '20'
      ? 'text-lg font-semibold'
      : styles.fontSize === '24'
      ? 'text-xl font-bold'
      : styles.fontSize === '28'
      ? 'text-2xl font-bold'
      : 'text-4xl font-extrabold';

  const baseContainerStyle: React.CSSProperties = {
    backgroundColor: styles.bgColor,
    color: styles.textColor,
    borderColor: styles.borderColor,
    borderWidth: `${styles.borderWidth}px`,
    borderRadius: `${styles.radius}px`,
    opacity: styles.opacity / 255,
    boxShadow: styles.shadowWidth ? `0 2px ${styles.shadowWidth}px rgba(0,0,0,0.4)` : 'none',
  };

  switch (type) {
    case 'btn':
      return (
        <button
          type="button"
          style={baseContainerStyle}
          className={`w-full h-full flex items-center justify-center font-medium transition-all select-none overflow-hidden ${
            isSimulating ? 'active:scale-95 cursor-pointer shadow-md' : 'pointer-events-none'
          } ${fontClass}`}
          onClick={(e) => {
            if (isSimulating) {
              e.stopPropagation();
              onTriggerEvent?.(widget, 'LV_EVENT_CLICKED', { text: props.text });
            }
          }}
        >
          {props.text || 'Button'}
        </button>
      );

    case 'label':
      return (
        <div
          style={{
            color: styles.textColor,
            opacity: styles.opacity / 255,
          }}
          className={`w-full h-full flex items-center select-none overflow-hidden text-ellipsis whitespace-nowrap ${fontClass}`}
        >
          {props.text || 'Label'}
        </div>
      );

    case 'slider': {
      const min = props.min ?? 0;
      const max = props.max ?? 100;
      const val = props.value ?? 50;
      const percent = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));

      return (
        <div
          style={baseContainerStyle}
          className="w-full h-full relative flex items-center overflow-hidden"
          onClick={(e) => {
            if (isSimulating) {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              const newVal = Math.round(min + ratio * (max - min));
              onUpdateProp(widget.id, 'value', newVal);
              onTriggerEvent?.(widget, 'LV_EVENT_VALUE_CHANGED', { value: newVal });
            }
          }}
        >
          {/* Active indicator bar */}
          <div
            className="h-full transition-all duration-75"
            style={{
              width: `${percent}%`,
              backgroundColor: props.indicatorColor || '#0284C7',
              borderRadius: `${styles.radius}px`,
            }}
          />
          {/* Thumb knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm transition-all duration-75"
            style={{
              left: `calc(${percent}% - ${Math.min(widget.h, 16) / 2}px)`,
              width: `${Math.min(widget.h + 2, 20)}px`,
              height: `${Math.min(widget.h + 2, 20)}px`,
              backgroundColor: props.indicatorColor || '#0284C7',
            }}
          />
        </div>
      );
    }

    case 'switch': {
      const isChecked = Boolean(props.checked);
      return (
        <div
          style={{
            ...baseContainerStyle,
            backgroundColor: isChecked ? (props.activeColor || '#0284C7') : styles.bgColor,
            cursor: isSimulating ? 'pointer' : 'default',
          }}
          className="w-full h-full relative transition-colors duration-150 flex items-center p-0.5"
          onClick={(e) => {
            if (isSimulating) {
              e.stopPropagation();
              const next = !isChecked;
              onUpdateProp(widget.id, 'checked', next);
              onTriggerEvent?.(widget, 'LV_EVENT_VALUE_CHANGED', { checked: next });
            }
          }}
        >
          <div
            className={`h-full aspect-square rounded-full bg-white shadow-sm transition-transform duration-150 transform ${
              isChecked ? 'translate-x-[calc(100%-2px)]' : 'translate-x-0'
            }`}
          />
        </div>
      );
    }

    case 'arc': {
      const min = props.min ?? 0;
      const max = props.max ?? 100;
      const val = props.value ?? 60;
      const ratio = Math.min(1, Math.max(0, (val - min) / (max - min)));
      const strokeWidth = props.arcWidth ?? 10;
      const arcColor = props.arcColor ?? '#0284C7';
      const radius = Math.min(widget.w, widget.h) / 2 - strokeWidth;
      const center = Math.min(widget.w, widget.h) / 2;

      // Arc calculation (270 degrees sweep from 135 to 45 deg)
      const circumference = 2 * Math.PI * radius;
      const sweepPercent = 0.75; // 270 deg
      const totalArcLength = circumference * sweepPercent;
      const strokeDashoffset = totalArcLength * (1 - ratio);

      return (
        <div
          className="w-full h-full relative flex items-center justify-center select-none"
          onClick={(e) => {
            if (isSimulating) {
              e.stopPropagation();
              const nextVal = val >= max ? min : Math.min(max, val + Math.round((max - min) / 8));
              onUpdateProp(widget.id, 'value', nextVal);
              onTriggerEvent?.(widget, 'LV_EVENT_VALUE_CHANGED', { value: nextVal });
            }
          }}
        >
          <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${center * 2} ${center * 2}`}>
            {/* Background track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#334155"
              strokeWidth={strokeWidth}
              strokeDasharray={`${totalArcLength} ${circumference}`}
              strokeLinecap="round"
              className="origin-center rotate-[135deg]"
            />
            {/* Active arc */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={arcColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${totalArcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="origin-center rotate-[135deg] transition-all duration-150"
            />
          </svg>
          <div className="absolute text-center pointer-events-none">
            <span className="font-bold text-xs font-mono text-slate-300">
              {val}
            </span>
          </div>
        </div>
      );
    }

    case 'bar': {
      const min = props.min ?? 0;
      const max = props.max ?? 100;
      const val = props.value ?? 40;
      const percent = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));

      return (
        <div style={baseContainerStyle} className="w-full h-full relative overflow-hidden flex items-center">
          <div
            className="h-full transition-all duration-150"
            style={{
              width: `${percent}%`,
              backgroundColor: props.indicatorColor || '#0284C7',
              borderRadius: `${styles.radius}px`,
            }}
          />
        </div>
      );
    }

    case 'meter': {
      const val = props.value ?? 50;
      const min = props.min ?? 0;
      const max = props.max ?? 100;
      const ratio = Math.max(0, Math.min(1, (val - min) / (max - min)));
      // Needle angle from -135deg to +135deg
      const angle = -135 + ratio * 270;

      return (
        <div
          style={baseContainerStyle}
          className="w-full h-full relative flex items-center justify-center p-2 overflow-hidden select-none"
        >
          {/* Dial circle */}
          <div className="w-[85%] h-[85%] rounded-full border border-slate-700 relative flex items-center justify-center bg-slate-900/50">
            {/* Scale markings */}
            <div className="absolute inset-1 rounded-full border border-dashed border-slate-600/60" />
            
            {/* Needle */}
            <div
              className="absolute w-1 h-[42%] origin-bottom transition-transform duration-300 rounded-full shadow-sm"
              style={{
                backgroundColor: props.needleColor || '#38BDF8',
                bottom: '50%',
                transform: `rotate(${angle}deg)`,
              }}
            />
            {/* Center cap */}
            <div className="w-4 h-4 rounded-full bg-slate-200 border-2 border-slate-800 z-10 shadow-sm" />

            {/* Readout */}
            <div className="absolute bottom-2 text-center">
              <span className="font-mono text-xs font-bold text-slate-100">{val}</span>
              {props.unit && <span className="text-[10px] text-slate-400 ml-0.5">{props.unit}</span>}
            </div>
          </div>
        </div>
      );
    }

    case 'chart': {
      const points = props.points && props.points.length > 0 ? props.points : [25, 45, 60, 35, 80, 65, 75, 90];
      const maxVal = 100;
      const chartColor = props.chartColor || '#0284C7';

      return (
        <div style={baseContainerStyle} className="w-full h-full p-2 flex flex-col justify-end relative overflow-hidden">
          {/* Subtle grid lines */}
          <div className="absolute inset-x-2 top-2 bottom-2 flex flex-col justify-between pointer-events-none opacity-20">
            <div className="border-b border-slate-500 w-full" />
            <div className="border-b border-slate-500 w-full" />
            <div className="border-b border-slate-500 w-full" />
          </div>

          {props.chartType === 'bar' ? (
            <div className="w-full h-full flex items-end justify-between gap-1 z-10 pt-4">
              {points.map((pt, idx) => (
                <div
                  key={idx}
                  className="flex-1 rounded-t transition-all duration-200"
                  style={{
                    height: `${(pt / maxVal) * 100}%`,
                    backgroundColor: chartColor,
                  }}
                />
              ))}
            </div>
          ) : (
            <svg className="w-full h-full z-10 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke={chartColor}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points
                  .map((pt, i) => `${(i / (points.length - 1)) * 100},${100 - (pt / maxVal) * 90}`)
                  .join(' ')}
              />
            </svg>
          )}
        </div>
      );
    }

    case 'led': {
      const isOn = props.ledOn !== false;
      const color = props.ledColor || '#22C55E';
      return (
        <div
          className={`w-full h-full rounded-full transition-all duration-150 flex items-center justify-center ${
            isSimulating ? 'cursor-pointer' : ''
          }`}
          style={{
            backgroundColor: isOn ? color : '#334155',
            boxShadow: isOn ? `0 0 12px ${color}, inset 0 0 4px rgba(255,255,255,0.6)` : 'none',
            border: '2px solid rgba(255,255,255,0.2)',
          }}
          onClick={(e) => {
            if (isSimulating) {
              e.stopPropagation();
              onUpdateProp(widget.id, 'ledOn', !isOn);
              onTriggerEvent?.(widget, 'LV_EVENT_VALUE_CHANGED', { ledOn: !isOn });
            }
          }}
        >
          <div className="w-1/3 h-1/3 rounded-full bg-white/40 pointer-events-none" />
        </div>
      );
    }

    case 'checkbox': {
      const isChecked = Boolean(props.checkedState);
      return (
        <div
          className={`w-full h-full flex items-center gap-2 select-none ${
            isSimulating ? 'cursor-pointer' : ''
          }`}
          onClick={(e) => {
            if (isSimulating) {
              e.stopPropagation();
              onUpdateProp(widget.id, 'checkedState', !isChecked);
              onTriggerEvent?.(widget, 'LV_EVENT_VALUE_CHANGED', { checked: !isChecked });
            }
          }}
        >
          <div
            className="w-4 h-4 rounded border flex items-center justify-center transition-colors"
            style={{
              backgroundColor: isChecked ? '#0284C7' : styles.bgColor,
              borderColor: isChecked ? '#38BDF8' : styles.borderColor,
            }}
          >
            {isChecked && <span className="text-white text-xs font-bold leading-none">✓</span>}
          </div>
          <span style={{ color: styles.textColor }} className={fontClass}>
            {props.text || 'Checkbox'}
          </span>
        </div>
      );
    }

    case 'dropdown': {
      const options = props.options || ['Option 1', 'Option 2', 'Option 3'];
      const current = options[props.selectedIndex || 0] || options[0];

      return (
        <div
          style={baseContainerStyle}
          className="w-full h-full flex items-center justify-between px-3 text-xs select-none relative"
        >
          <span className="truncate">{current}</span>
          <span className="text-[10px] opacity-70 ml-1">▼</span>
        </div>
      );
    }

    case 'spinner': {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <div
            className="w-4/5 h-4/5 rounded-full border-2 border-slate-600 border-t-cyan-400 animate-spin"
            style={{
              borderTopColor: props.spinColor || '#38BDF8',
            }}
          />
        </div>
      );
    }

    case 'container':
      return (
        <div
          style={baseContainerStyle}
          className="w-full h-full relative"
        >
          {/* Container outline/placeholder */}
        </div>
      );

    default:
      return (
        <div style={baseContainerStyle} className="w-full h-full flex items-center justify-center text-xs opacity-60">
          {widget.name}
        </div>
      );
  }
};
