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

  const hours = Array.from({ length: 12 }, (_, i) => i === 0 ? 12 : i);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const getPosition = (value: number, total: number) => {
    const angle = ((value * 360) / total - 90) * (Math.PI / 180);
    return {
      x: Math.cos(angle) * 50,
      y: Math.sin(angle) * 50,
    };
  };

  const handleClockInteraction = useCallback((e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
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
      setTimeout(() => setMode('minute'), 200);
    } else {
      const minuteValue = Math.round(angle / 6) % 60;
      onMinuteChange(minuteValue.toString().padStart(2, '0'));
    }
  }, [mode, onHourChange, onMinuteChange]);

  const currentValue = mode === 'hour' ? parseInt(hour) : parseInt(minute);
  const handAngle = mode === 'hour' 
    ? ((currentValue % 12) * 30) - 90 
    : (currentValue * 6) - 90;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xs mx-auto">
      {/* Time Display */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => setMode('hour')}
          className={cn(
            "text-5xl font-medium transition-colors",
            mode === 'hour' ? "text-primary" : "text-muted-foreground"
          )}
        >
          {hour.padStart(2, '0')}
        </button>
        <span className="text-5xl font-medium text-muted-foreground mx-1">:</span>
        <button
          onClick={() => setMode('minute')}
          className={cn(
            "text-5xl font-medium transition-colors",
            mode === 'minute' ? "text-primary" : "text-muted-foreground"
          )}
        >
          {minute.padStart(2, '0')}
        </button>
        <div className="flex flex-col ml-3 gap-0.5">
          <button
            onClick={() => onPeriodChange('AM')}
            className={cn(
              "text-sm font-semibold px-1.5 py-0.5 rounded transition-colors",
              period === 'AM' ? "text-primary" : "text-muted-foreground"
            )}
          >
            AM
          </button>
          <button
            onClick={() => onPeriodChange('PM')}
            className={cn(
              "text-sm font-semibold px-1.5 py-0.5 rounded transition-colors",
              period === 'PM' ? "text-primary" : "text-muted-foreground"
            )}
          >
            PM
          </button>
        </div>
      </div>

      {/* Clock Face */}
      <div
        ref={clockRef}
        onClick={handleClockInteraction}
        onTouchStart={handleClockInteraction}
        className="relative w-full aspect-square max-w-[280px] rounded-full bg-muted/50 cursor-pointer select-none"
        style={{ touchAction: 'none' }}
      >
        {/* Inner circle background for selected area */}
        <div className="absolute inset-[15%] rounded-full bg-muted/30" />
        
        {/* Clock Center Dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary z-20" />

        {/* Clock Hand */}
        <div
          className="absolute top-1/2 left-1/2 origin-center transition-transform duration-150 z-10"
          style={{
            width: '2px',
            height: '35%',
            backgroundColor: 'hsl(var(--primary))',
            transform: `translate(-50%, -100%) rotate(${handAngle}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          {/* Hand tip circle */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-primary" />
        </div>

        {/* Hour Numbers or Minute Numbers */}
        {mode === 'hour' ? (
          hours.map((h, index) => {
            const pos = getPosition(index === 0 ? 12 : index, 12);
            const isSelected = parseInt(hour) === h || (parseInt(hour) === 0 && h === 12);
            return (
              <button
                key={h}
                onClick={(e) => {
                  e.stopPropagation();
                  onHourChange(h.toString());
                  setTimeout(() => setMode('minute'), 200);
                }}
                className={cn(
                  "absolute w-10 h-10 flex items-center justify-center rounded-full text-base font-medium transition-all z-30",
                  isSelected ? "text-primary-foreground" : "text-foreground hover:bg-accent/50"
                )}
                style={{
                  left: `calc(50% + ${pos.x}% - 20px)`,
                  top: `calc(50% + ${pos.y}% - 20px)`,
                }}
              >
                {h}
              </button>
            );
          })
        ) : (
          minutes.map((m) => {
            const pos = getPosition(m, 60);
            const isSelected = parseInt(minute) === m;
            return (
              <button
                key={m}
                onClick={(e) => {
                  e.stopPropagation();
                  onMinuteChange(m.toString().padStart(2, '0'));
                }}
                className={cn(
                  "absolute w-10 h-10 flex items-center justify-center rounded-full text-base font-medium transition-all z-30",
                  isSelected ? "text-primary-foreground" : "text-foreground hover:bg-accent/50"
                )}
                style={{
                  left: `calc(50% + ${pos.x}% - 20px)`,
                  top: `calc(50% + ${pos.y}% - 20px)`,
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
