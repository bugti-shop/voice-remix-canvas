import { useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bold, Italic, Underline as UnderlineIcon, List, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onImageAdd?: (imageUrl: string) => void;
  allowImages?: boolean;
  className?: string;
  toolbarPosition?: 'top' | 'bottom';
  title?: string;
  onTitleChange?: (title: string) => void;
  showTitle?: boolean;
  fontFamily?: string;
  onFontFamilyChange?: (fontFamily: string) => void;
  fontSize?: string;
  onFontSizeChange?: (fontSize: string) => void;
}

export const RichTextEditor = ({
  content,
  onChange,
  className,
  toolbarPosition = 'bottom',
  title,
  onTitleChange,
  showTitle = false,
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== content) {
      editorRef.current.innerHTML = content;
    }
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const Toolbar = () => (
    <div className="flex items-center gap-1 p-2 border-t bg-background flex-wrap">
      <Button variant="ghost" size="sm" onClick={() => execCommand('bold')} className="h-8 w-8 p-0">
        <Bold className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => execCommand('italic')} className="h-8 w-8 p-0">
        <Italic className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => execCommand('underline')} className="h-8 w-8 p-0">
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <div className="h-4 w-px bg-border mx-1" />
      <Button variant="ghost" size="sm" onClick={() => execCommand('insertUnorderedList')} className="h-8 w-8 p-0">
        <List className="h-4 w-4" />
      </Button>
      <div className="h-4 w-px bg-border mx-1" />
      <Button variant="ghost" size="sm" onClick={() => execCommand('justifyLeft')} className="h-8 w-8 p-0">
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => execCommand('justifyCenter')} className="h-8 w-8 p-0">
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => execCommand('justifyRight')} className="h-8 w-8 p-0">
        <AlignRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {toolbarPosition === 'top' && <Toolbar />}
      
      <div className="flex-1 overflow-auto p-4">
        {showTitle && onTitleChange && (
          <Input
            value={title || ''}
            onChange={(e) => onTitleChange(e.target.value)}
            className="text-2xl font-bold border-none bg-transparent p-0 mb-4 focus-visible:ring-0"
            placeholder="Note Title..."
          />
        )}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className={cn(
            'min-h-[200px] outline-none text-base leading-relaxed',
            '[&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6',
            className
          )}
          data-placeholder="Start typing..."
        />
      </div>

      {toolbarPosition === 'bottom' && <Toolbar />}
    </div>
  );
};
