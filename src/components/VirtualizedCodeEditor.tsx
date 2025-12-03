import { useState, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface VirtualizedCodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
  onClose?: () => void;
}

const LANGUAGES = [
  { value: 'auto', label: 'Auto' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'sql', label: 'SQL' },
  { value: 'bash', label: 'Bash' },
];

export const VirtualizedCodeEditor = ({
  code,
  onChange,
  language = 'auto',
  onLanguageChange,
  title,
  onTitleChange,
  onClose,
}: VirtualizedCodeEditorProps) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Code copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newCode = code.substring(0, start) + '  ' + code.substring(end);
      onChange(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const lines = code.split('\n');

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e]">
      <div className="flex items-center gap-2 p-3 border-b border-[#333] bg-[#252526]">
        {onTitleChange && (
          <Input
            value={title || ''}
            onChange={(e) => onTitleChange(e.target.value)}
            className="flex-1 text-lg font-mono border-none bg-transparent text-white p-0 focus-visible:ring-0"
            placeholder="Untitled Code..."
          />
        )}
        <select
          value={language}
          onChange={(e) => onLanguageChange?.(e.target.value)}
          className="h-8 px-2 text-sm bg-[#3c3c3c] text-white border-none rounded focus:ring-0"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="text-white hover:bg-[#3c3c3c]"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-12 bg-[#1e1e1e] border-r border-[#333] py-4 select-none">
          {lines.map((_, index) => (
            <div
              key={index}
              className="text-right pr-4 text-xs text-[#858585] font-mono leading-6"
            >
              {index + 1}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-auto">
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full h-full p-4 font-mono text-sm leading-6 bg-[#1e1e1e] text-[#d4d4d4]',
              'border-none outline-none resize-none',
              'placeholder:text-[#858585]'
            )}
            placeholder="// Start writing code..."
            spellCheck={false}
          />
        </div>
      </div>
    </div>
  );
};
