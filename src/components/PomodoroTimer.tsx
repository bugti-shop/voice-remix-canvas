import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { 
  X, Play, Pause, RotateCcw, Settings, Coffee, 
  Brain, Target, Volume2, VolumeX, SkipForward 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { toast } from 'sonner';

type SessionType = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroSettings {
  workDuration: number;      // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number;  // minutes
  sessionsUntilLongBreak: number;
  autoStartBreaks: boolean;
  autoStartWork: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface PomodoroSession {
  type: SessionType;
  startTime: Date;
  endTime: Date;
  duration: number;
  completed: boolean;
}

interface PomodoroTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsUntilLongBreak: 4,
  autoStartBreaks: false,
  autoStartWork: false,
  soundEnabled: true,
  vibrationEnabled: true,
};

const sessionColors = {
  work: 'text-red-500',
  shortBreak: 'text-green-500',
  longBreak: 'text-blue-500',
};

const sessionBgColors = {
  work: 'bg-red-500',
  shortBreak: 'bg-green-500',
  longBreak: 'bg-blue-500',
};

export const PomodoroTimer = ({ isOpen, onClose }: PomodoroTimerProps) => {
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    const saved = localStorage.getItem('pomodoroSettings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });
  
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [timeRemaining, setTimeRemaining] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [todaySessions, setTodaySessions] = useState<PomodoroSession[]>(() => {
    const saved = localStorage.getItem('pomodoroSessions');
    if (saved) {
      const sessions = JSON.parse(saved);
      const today = new Date().toDateString();
      return sessions.filter((s: PomodoroSession) => 
        new Date(s.startTime).toDateString() === today
      );
    }
    return [];
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<Date | null>(null);

  // Save settings
  useEffect(() => {
    localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
  }, [settings]);

  // Save sessions
  useEffect(() => {
    localStorage.setItem('pomodoroSessions', JSON.stringify(todaySessions));
  }, [todaySessions]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleSessionComplete = async () => {
    setIsRunning(false);
    
    // Haptic feedback
    if (settings.vibrationEnabled) {
      try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch {}
    }

    // Sound notification
    if (settings.soundEnabled) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU...');
        audio.play().catch(() => {});
      } catch {}
    }

    // Record session
    if (sessionStartRef.current) {
      const session: PomodoroSession = {
        type: sessionType,
        startTime: sessionStartRef.current,
        endTime: new Date(),
        duration: getDuration(sessionType),
        completed: true,
      };
      setTodaySessions(prev => [...prev, session]);
    }

    // Handle next session
    if (sessionType === 'work') {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      if (newCompletedSessions % settings.sessionsUntilLongBreak === 0) {
        toast.success('Great work! Time for a long break!');
        switchSession('longBreak');
        if (settings.autoStartBreaks) startTimer('longBreak');
      } else {
        toast.success('Session complete! Take a short break.');
        switchSession('shortBreak');
        if (settings.autoStartBreaks) startTimer('shortBreak');
      }
    } else {
      toast.success('Break over! Ready to focus?');
      switchSession('work');
      if (settings.autoStartWork) startTimer('work');
    }
  };

  const getDuration = (type: SessionType) => {
    switch (type) {
      case 'work': return settings.workDuration;
      case 'shortBreak': return settings.shortBreakDuration;
      case 'longBreak': return settings.longBreakDuration;
    }
  };

  const switchSession = (type: SessionType) => {
    setSessionType(type);
    setTimeRemaining(getDuration(type) * 60);
    sessionStartRef.current = null;
  };

  const startTimer = async (type?: SessionType) => {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    if (type) switchSession(type);
    sessionStartRef.current = new Date();
    setIsRunning(true);
  };

  const pauseTimer = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Light }); } catch {}
    setIsRunning(false);
  };

  const resetTimer = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
    setIsRunning(false);
    setTimeRemaining(getDuration(sessionType) * 60);
    sessionStartRef.current = null;
  };

  const skipSession = async () => {
    try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch {}
    handleSessionComplete();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((getDuration(sessionType) * 60 - timeRemaining) / (getDuration(sessionType) * 60)) * 100;

  const todayWorkSessions = todaySessions.filter(s => s.type === 'work' && s.completed).length;
  const todayTotalMinutes = todaySessions
    .filter(s => s.type === 'work' && s.completed)
    .reduce((acc, s) => acc + s.duration, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 -ml-2 hover:bg-muted rounded-lg">
            <X className="h-5 w-5" />
          </button>
          <div>
            <h2 className="text-lg font-semibold">Pomodoro Timer</h2>
            <p className="text-xs text-muted-foreground">Focus in {settings.workDuration} minute sessions</p>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={cn("p-2 hover:bg-muted rounded-lg", showSettings && "bg-muted")}
        >
          <Settings className="h-5 w-5" />
        </button>
      </header>

      <div className="flex-1 overflow-auto">
        {showSettings ? (
          <div className="p-4 max-w-md mx-auto space-y-6">
            <h3 className="font-semibold">Timer Settings</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm">Work Duration: {settings.workDuration} min</Label>
                <Slider
                  value={[settings.workDuration]}
                  onValueChange={([v]) => setSettings(prev => ({ ...prev, workDuration: v }))}
                  min={5}
                  max={60}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm">Short Break: {settings.shortBreakDuration} min</Label>
                <Slider
                  value={[settings.shortBreakDuration]}
                  onValueChange={([v]) => setSettings(prev => ({ ...prev, shortBreakDuration: v }))}
                  min={1}
                  max={15}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm">Long Break: {settings.longBreakDuration} min</Label>
                <Slider
                  value={[settings.longBreakDuration]}
                  onValueChange={([v]) => setSettings(prev => ({ ...prev, longBreakDuration: v }))}
                  min={5}
                  max={30}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm">Sessions until long break: {settings.sessionsUntilLongBreak}</Label>
                <Slider
                  value={[settings.sessionsUntilLongBreak]}
                  onValueChange={([v]) => setSettings(prev => ({ ...prev, sessionsUntilLongBreak: v }))}
                  min={2}
                  max={8}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto-start breaks</Label>
                <Switch
                  checked={settings.autoStartBreaks}
                  onCheckedChange={(v) => setSettings(prev => ({ ...prev, autoStartBreaks: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto-start work sessions</Label>
                <Switch
                  checked={settings.autoStartWork}
                  onCheckedChange={(v) => setSettings(prev => ({ ...prev, autoStartWork: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-2">
                  {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  Sound notifications
                </Label>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={(v) => setSettings(prev => ({ ...prev, soundEnabled: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Vibration</Label>
                <Switch
                  checked={settings.vibrationEnabled}
                  onCheckedChange={(v) => setSettings(prev => ({ ...prev, vibrationEnabled: v }))}
                />
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setSettings(defaultSettings)}
            >
              Reset to Defaults
            </Button>
          </div>
        ) : (
          <div className="p-4 flex flex-col items-center">
            {/* Session Type Tabs */}
            <div className="flex gap-2 mb-8">
              {(['work', 'shortBreak', 'longBreak'] as SessionType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => !isRunning && switchSession(type)}
                  disabled={isRunning}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    sessionType === type 
                      ? cn(sessionBgColors[type], "text-white")
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                    isRunning && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {type === 'work' && <Brain className="h-4 w-4 inline mr-1.5" />}
                  {type === 'shortBreak' && <Coffee className="h-4 w-4 inline mr-1.5" />}
                  {type === 'longBreak' && <Coffee className="h-4 w-4 inline mr-1.5" />}
                  {type === 'work' ? 'Focus' : type === 'shortBreak' ? 'Short Break' : 'Long Break'}
                </button>
              ))}
            </div>

            {/* Timer Display */}
            <div className="relative w-64 h-64 mb-8">
              <div className="absolute inset-0 rounded-full border-8 border-muted" />
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${progress * 2.89} 289`}
                  className={sessionColors[sessionType]}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn("text-5xl font-bold tabular-nums", sessionColors[sessionType])}>
                  {formatTime(timeRemaining)}
                </span>
                <span className="text-sm text-muted-foreground mt-2 capitalize">
                  {sessionType === 'work' ? 'Focus Time' : sessionType === 'shortBreak' ? 'Short Break' : 'Long Break'}
                </span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={resetTimer}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>

              <Button
                size="icon"
                className={cn("h-16 w-16 rounded-full", sessionBgColors[sessionType])}
                onClick={isRunning ? pauseTimer : () => startTimer()}
              >
                {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
              </Button>

              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={skipSession}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="w-full max-w-sm bg-muted/50 rounded-xl p-4">
              <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Today's Progress
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-500">{todayWorkSessions}</div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-500">{todayTotalMinutes}</div>
                  <div className="text-xs text-muted-foreground">Minutes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-500">{completedSessions}</div>
                  <div className="text-xs text-muted-foreground">This Cycle</div>
                </div>
              </div>
            </div>

            {/* Session Indicator */}
            <div className="mt-4 flex gap-2">
              {Array.from({ length: settings.sessionsUntilLongBreak }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all",
                    i < (completedSessions % settings.sessionsUntilLongBreak)
                      ? "bg-red-500"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PomodoroTimer;
