import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Note, NoteType, StickyColor, VoiceRecording, Folder } from '@/types/note';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from './RichTextEditor';
import { VoiceRecorder } from './VoiceRecorder';
import { SketchEditor } from './SketchEditor';
import { VirtualizedCodeEditor } from './VirtualizedCodeEditor';
import { MindMapEditor } from './MindMapEditor';
import { TemplateSelector } from './TemplateSelector';
import { ArrowLeft, Folder as FolderIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface NoteEditorProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note) => void;
  defaultType?: NoteType;
  defaultFolderId?: string;
}

const DEFAULT_FOLDERS: Folder[] = [
  { id: 'sticky', name: 'Sticky Notes', noteType: 'sticky', isDefault: true, createdAt: new Date() },
  { id: 'lined', name: 'Lined Notes', noteType: 'lined', isDefault: true, createdAt: new Date() },
  { id: 'regular', name: 'Regular Notes', noteType: 'regular', isDefault: true, createdAt: new Date() },
  { id: 'sketch', name: 'Sketch Notes', noteType: 'sketch', isDefault: true, createdAt: new Date() },
  { id: 'code', name: 'Code Notes', noteType: 'code', isDefault: true, createdAt: new Date() },
  { id: 'mindmap', name: 'Mind Maps', noteType: 'mindmap', isDefault: true, createdAt: new Date() },
];

const STICKY_COLORS: StickyColor[] = ['yellow', 'blue', 'green', 'pink', 'orange'];
const STICKY_COLOR_VALUES = {
  yellow: 'hsl(var(--sticky-yellow))',
  blue: 'hsl(var(--sticky-blue))',
  green: 'hsl(var(--sticky-green))',
  pink: 'hsl(var(--sticky-pink))',
  orange: 'hsl(var(--sticky-orange))',
};

export const NoteEditor = ({ note, isOpen, onClose, onSave, defaultType = 'regular', defaultFolderId }: NoteEditorProps) => {
  const navigate = useNavigate();
  const [noteType, setNoteType] = useState<NoteType>(defaultType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<StickyColor>('yellow');
  const [voiceRecordings, setVoiceRecordings] = useState<VoiceRecording[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [codeContent, setCodeContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('auto');
  const [folders, setFolders] = useState<Folder[]>(DEFAULT_FOLDERS);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    const savedFolders = localStorage.getItem('folders');
    if (savedFolders) {
      const parsed = JSON.parse(savedFolders);
      setFolders([...DEFAULT_FOLDERS, ...parsed.map((f: Folder) => ({ ...f, createdAt: new Date(f.createdAt) }))]);
    }
  }, []);

  useEffect(() => {
    if (note) {
      setNoteType(note.type);
      setTitle(note.title);
      setContent(note.content);
      setColor(note.color || 'yellow');
      setVoiceRecordings(note.voiceRecordings);
      setSelectedFolderId(note.folderId);
      setCodeContent(note.codeContent || '');
      setCodeLanguage(note.codeLanguage || 'auto');
    } else {
      setNoteType(defaultType);
      setTitle('');
      setContent('');
      setColor('yellow');
      setVoiceRecordings([]);
      setSelectedFolderId(defaultFolderId);
      setCodeContent('');
      setCodeLanguage('auto');
    }
  }, [note, defaultType, defaultFolderId, isOpen]);

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: Folder = { id: Date.now().toString(), name: newFolderName, isDefault: false, createdAt: new Date() };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem('folders', JSON.stringify(updatedFolders.filter(f => !f.isDefault)));
    setSelectedFolderId(newFolder.id);
    setNewFolderName('');
    setIsNewFolderDialogOpen(false);
    toast.success('Folder created');
  };

  const handleSave = () => {
    const savedNote: Note = {
      id: note?.id || Date.now().toString(),
      type: noteType,
      title,
      content: noteType === 'code' ? '' : content,
      color: noteType === 'sticky' ? color : undefined,
      voiceRecordings,
      folderId: selectedFolderId || noteType,
      codeContent: noteType === 'code' ? codeContent : undefined,
      codeLanguage: noteType === 'code' ? codeLanguage : undefined,
      createdAt: note?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    onSave(savedNote);
  };

  const handleClose = () => {
    handleSave();
    toast.success('Note saved');
    onClose();
    navigate('/');
  };

  const handleRecordingAdd = (recording: VoiceRecording) => setVoiceRecordings([...voiceRecordings, recording]);
  const handleRecordingDelete = (id: string) => setVoiceRecordings(voiceRecordings.filter(r => r.id !== id));
  const handleInsertAudioAtCursor = (audioBase64: string, recordingId: string) => {
    if (['sticky', 'lined', 'regular'].includes(noteType)) {
      const audioHtml = `<div style="margin: 10px 0;" data-recording-id="${recordingId}"><audio controls src="${audioBase64}" style="max-width: 100%; height: 32px;"></audio></div><p><br></p>`;
      setContent(prev => prev + audioHtml);
    }
  };

  const getEditorBackgroundColor = () => noteType === 'sticky' ? STICKY_COLOR_VALUES[color] : 'hsl(var(--background))';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: getEditorBackgroundColor() }}>
      <div className="flex justify-between items-center px-4 py-3 border-b" style={{ backgroundColor: getEditorBackgroundColor(), borderColor: 'rgba(0,0,0,0.1)' }}>
        <Button variant="ghost" size="icon" onClick={handleClose} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9"><FolderIcon className="h-5 w-5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card z-50">
              <div className="px-2 py-1.5 text-sm font-semibold">Move to Folder</div>
              <DropdownMenuSeparator />
              {folders.map((folder) => (
                <DropdownMenuItem key={folder.id} onClick={() => { setSelectedFolderId(folder.id); toast.success(`Moved to ${folder.name}`); }} className={cn(selectedFolderId === folder.id && "bg-accent")}>
                  <FolderIcon className="h-4 w-4 mr-2" />{folder.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsNewFolderDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />New Folder</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <VoiceRecorder recordings={voiceRecordings} onRecordingAdd={handleRecordingAdd} onRecordingDelete={handleRecordingDelete} onInsertAtCursor={handleInsertAudioAtCursor} />
        </div>
      </div>

      {noteType === 'sticky' && (
        <div className="px-4 py-2 border-b bg-background">
          <div className="flex items-center gap-2">
            {STICKY_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} className={cn("h-7 w-7 rounded-full border", c === color && "ring-2 ring-ring")} style={{ backgroundColor: STICKY_COLOR_VALUES[c] }} />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        {noteType === 'code' ? (
          <VirtualizedCodeEditor code={codeContent} onChange={setCodeContent} language={codeLanguage} onLanguageChange={setCodeLanguage} title={title} onTitleChange={setTitle} onClose={handleClose} />
        ) : noteType === 'mindmap' ? (
          <MindMapEditor content={content} onChange={setContent} title={title} onTitleChange={setTitle} />
        ) : noteType === 'sketch' ? (
          <SketchEditor content={content} onChange={setContent} />
        ) : (
          <RichTextEditor content={content} onChange={setContent} className={noteType === 'lined' ? 'lined-note' : ''} toolbarPosition="bottom" title={title} onTitleChange={setTitle} showTitle={true} />
        )}
      </div>

      <TemplateSelector isOpen={showTemplateSelector} onClose={() => setShowTemplateSelector(false)} onSelectTemplate={(templateContent) => setContent(templateContent)} />

      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <Input placeholder="Folder name" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()} />
            <Button onClick={handleCreateFolder} className="w-full">Create Folder</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
