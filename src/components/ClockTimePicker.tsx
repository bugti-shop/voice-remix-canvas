import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ClockTimePickerProps {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
  onHourChange: (hour: string) => void;
  onMinuteChange: (minute: string) => void;
  onPeriodChange: (period: 'AM' | 'PM') => void;
}

type Mode = 'hour' | 'minute';

export const ClockTimePicker = ({
  hour,
  minute,
  period,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
}: ClockTimePickerProps) => {
  const [mode, setMode] = useState<Mode>('hour');
  const clockRef = useRef<HTMLDivElement>(null);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const getPosition = (value: number, total: number, radius: number) => {
    const angle = ((value * 360) / total - 90) * (Math.PI / 180);
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  const handleClockClick = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!clockRef.current) return;

    const rect = clockRef.current.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left - centerX;
    const y = clientY - rect.top - centerY;

    let angle = Math.atan2(y, x) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === 'hour') {
      const hourValue = Math.round(angle / 30);
      const selectedHour = hourValue === 0 ? 12 : hourValue;
      onHourChange(selectedHour.toString());
      setMode('minute');
    } else {
      const minuteValue = Math.round(angle / 6) % 60;
      onMinuteChange(minuteValue.toString().padStart(2, '0'));
    }
  }, [mode, onHourChange, onMinuteChange]);

  const currentValue = mode === 'hour' ? parseInt(hour) : parseInt(minute);
  const handAngle = mode === 'hour' 
    ? (currentValue * 30) - 90 
    : (currentValue * 6) - 90;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Time Display */}
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => setMode('hour')}
          className={cn(
            "text-4xl font-light px-2 py-1 rounded-lg transition-colors",
            mode === 'hour' ? "bg-primary/20 text-primary" : "text-foreground"
          )}
        >
          {hour.padStart(2, '0')}
        </button>
        <span className="text-4xl font-light text-foreground">:</span>
        <button
          onClick={() => setMode('minute')}
          className={cn(
            "text-4xl font-light px-2 py-1 rounded-lg transition-colors",
            mode === 'minute' ? "bg-primary/20 text-primary" : "text-foreground"
          )}
        >
          {minute.padStart(2, '0')}
        </button>
        <div className="flex flex-col ml-2 gap-1">
          <button
            onClick={() => onPeriodChange('AM')}
            className={cn(
              "text-sm font-medium px-2 py-0.5 rounded transition-colors",
              period === 'AM' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            AM
          </button>
          <button
            onClick={() => onPeriodChange('PM')}
            className={cn(
              "text-sm font-medium px-2 py-0.5 rounded transition-colors",
              period === 'PM' ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            )}
          >
            PM
          </button>
        </div>
      </div>

      {/* Clock Face */}
      <div
        ref={clockRef}
        onClick={handleClockClick}
        onTouchStart={handleClockClick}
        className="relative w-56 h-56 rounded-full bg-muted cursor-pointer select-none"
      >
        {/* Clock Center */}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary z-10" />

        {/* Clock Hand */}
        <div
          className="absolute top-1/2 left-1/2 origin-bottom transition-transform duration-150"
          style={{
            width: '2px',
            height: mode === 'hour' ? '70px' : '85px',
            backgroundColor: 'hsl(var(--primary))',
            transform: `translateX(-50%) translateY(-100%) rotate(${handAngle}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          <div 
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-primary"
          />
        </div>

        {/* Hour Numbers or Minute Numbers */}
        {mode === 'hour' ? (
          hours.map((h) => {
            const pos = getPosition(h, 12, 85);
            const isSelected = parseInt(hour) === h;
            return (
              <button
                key={h}
                onClick={(e) => {
                  e.stopPropagation();
                  onHourChange(h.toString());
                  setMode('minute');
                }}
                className={cn(
                  "absolute w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isSelected ? "text-primary-foreground" : "text-foreground hover:bg-accent"
                )}
                style={{
                  left: `calc(50% + ${pos.x}px - 16px)`,
                  top: `calc(50% + ${pos.y}px - 16px)`,
                }}
              >
                {h}
              </button>
            );
          })
        ) : (
          minutes.map((m) => {
            const pos = getPosition(m, 60, 85);
            const isSelected = parseInt(minute) === m;
            return (
              <button
                key={m}
                onClick={(e) => {
                  e.stopPropagation();
                  onMinuteChange(m.toString().padStart(2, '0'));
                }}
                className={cn(
                  "absolute w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors",
                  isSelected ? "text-primary-foreground" : "text-foreground hover:bg-accent"
                )}
                style={{
                  left: `calc(50% + ${pos.x}px - 16px)`,
                  top: `calc(50% + ${pos.y}px - 16px)`,
                }}
              >
                {m.toString().padStart(2, '0')}
              </button>
            );
          })
        )}
      </div>

      {/* Mode Indicator */}
      <p className="text-xs text-muted-foreground">
        {mode === 'hour' ? 'Select hour' : 'Select minutes'}
      </p>
    </div>
  );
};
