import { useRef, useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Eraser, Pen, Trash2, Circle, Square, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SketchEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const DEFAULT_COLORS = [
  '#000000', '#FF0000', '#0000FF', '#00FF00', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FFA500', '#800080', '#FFC0CB',
];

const BRUSH_SIZES = [2, 5, 10, 15];

type ToolType = 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line';

export const SketchEditor = ({ content, onChange }: SketchEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      tempCtx.drawImage(canvas, 0, 0);
    }

    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (tempCtx) {
      ctx.drawImage(tempCanvas, 0, 0);
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  useEffect(() => {
    if (content) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = content;
    }
  }, []);

  const saveCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onChange(canvas.toDataURL('image/png'));
  }, [onChange]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoordinates(e);
    setIsDrawing(true);
    lastPointRef.current = coords;
    setStartPoint(coords);

    if (tool === 'pen' || tool === 'eraser') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCoordinates(e);

    if (tool === 'pen' || tool === 'eraser') {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = brushSize;
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;

      if (lastPointRef.current) {
        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
      }

      lastPointRef.current = coords;
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    setStartPoint(null);
    saveCanvas();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveCanvas();
    toast.success('Canvas cleared');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 border-b bg-background overflow-x-auto">
        <Button
          variant={tool === 'pen' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('pen')}
        >
          <Pen className="h-4 w-4" />
        </Button>
        <Button
          variant={tool === 'eraser' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('eraser')}
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <Button
          variant={tool === 'line' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('line')}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          variant={tool === 'rectangle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('rectangle')}
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          variant={tool === 'circle' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTool('circle')}
        >
          <Circle className="h-4 w-4" />
        </Button>

        <div className="h-6 w-px bg-border mx-2" />

        <div className="flex gap-1">
          {DEFAULT_COLORS.slice(0, 6).map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn(
                'w-6 h-6 rounded-full border-2',
                color === c ? 'border-foreground' : 'border-transparent'
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        <div className="h-6 w-px bg-border mx-2" />

        <div className="flex gap-1">
          {BRUSH_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setBrushSize(size)}
              className={cn(
                'w-8 h-8 rounded flex items-center justify-center border',
                brushSize === size ? 'border-foreground bg-muted' : 'border-transparent'
              )}
            >
              <div
                className="rounded-full bg-foreground"
                style={{ width: size, height: size }}
              />
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-border mx-2" />

        <Button variant="outline" size="sm" onClick={clearCanvas}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div ref={containerRef} className="flex-1 bg-white touch-none">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    </div>
  );
};
