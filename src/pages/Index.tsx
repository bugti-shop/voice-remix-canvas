import { useState, useEffect } from 'react';
import { Note, NoteType, Folder } from '@/types/note';
import { NoteCard } from '@/components/NoteCard';
import { NoteEditor } from '@/components/NoteEditor';
import { BottomNavigation } from '@/components/BottomNavigation';
import { PersonalizedTips } from '@/components/PersonalizedTips';
import { FolderManager } from '@/components/FolderManager';
import { SyncBadge } from '@/components/SyncStatusIndicator';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';
import { syncManager } from '@/utils/syncManager';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, StickyNote, FileText, FileEdit, Pen, ListTodo, FileCode, GitBranch } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import npdLogo from '@/assets/npd-logo.png';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getSuggestedFolders } from '@/utils/personalization';

const Index = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [defaultType, setDefaultType] = useState<NoteType>('regular');
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const { isOnline, isSyncing, hasError, lastSync } = useRealtimeSync();
  const syncEnabled = syncManager.isSyncEnabled();

  useEffect(() => {
    const savedFolders = localStorage.getItem('folders');
    if (savedFolders) {
      setFolders(JSON.parse(savedFolders));
    } else {
      const answersStr = localStorage.getItem('onboardingAnswers');
      if (answersStr) {
        const answers = JSON.parse(answersStr);
        const suggestedFolders = getSuggestedFolders(answers);
        const initialFolders: Folder[] = suggestedFolders.map((name, index) => ({
          id: `folder-${Date.now()}-${index}`,
          name,
          isDefault: false,
          createdAt: new Date(),
          color: ['#3c78f0', '#10b981', '#f59e0b'][index % 3],
        }));
        setFolders(initialFolders);
        localStorage.setItem('folders', JSON.stringify(initialFolders));
      }
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('notes');
    if (saved) {
      const parsed = JSON.parse(saved);
      setNotes(parsed.map((n: Note) => ({
        ...n,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
        voiceRecordings: n.voiceRecordings?.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) })) || [],
      })));
    }
  }, []);

  useEffect(() => { localStorage.setItem('notes', JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem('folders', JSON.stringify(folders)); }, [folders]);

  const handleSaveNote = (note: Note) => {
    setNotes((prev) => {
      const existing = prev.find((n) => n.id === note.id);
      if (existing) return prev.map((n) => (n.id === note.id ? note : n));
      return [{ ...note, folderId: note.folderId || note.type }, ...prev];
    });
  };

  const handleDeleteNote = (id: string) => setNotes((prev) => prev.filter((n) => n.id !== id));

  const handleTogglePin = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, isPinned: !n.isPinned, pinnedOrder: !n.isPinned ? Date.now() : undefined } : n));
  };

  const handleDragStart = (e: React.DragEvent, noteId: string) => { 
    e.dataTransfer.effectAllowed = 'move'; 
    e.dataTransfer.setData('text/html', noteId); 
    setDraggedNoteId(noteId); 
  };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
  const handleDragEnd = () => setDraggedNoteId(null);
  const handleDrop = (e: React.DragEvent, targetNoteId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/html');
    if (draggedId === targetNoteId) return;
    setNotes((prev) => {
      const updated = [...prev];
      const draggedIndex = updated.findIndex(n => n.id === draggedId);
      const targetIndex = updated.findIndex(n => n.id === targetNoteId);
      const [removed] = updated.splice(draggedIndex, 1);
      updated.splice(targetIndex, 0, removed);
      return updated;
    });
  };

  const handleCreateNote = (type: NoteType) => { setDefaultType(type); setSelectedNote(null); setIsEditorOpen(true); };
  const handleEditNote = (note: Note) => { setSelectedNote(note); setIsEditorOpen(true); };
  const handleCreateFolder = (name: string, color: string) => setFolders(prev => [...prev, { id: `folder-${Date.now()}`, name, isDefault: false, createdAt: new Date(), color }]);
  const handleDeleteFolder = (folderId: string) => { 
    setFolders(prev => prev.filter(f => f.id !== folderId)); 
    setNotes(prev => prev.map(n => n.folderId === folderId ? { ...n, folderId: undefined } : n)); 
  };
  const handleEditFolder = (folderId: string, name: string) => setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name } : f));
  const handleDropOnFolder = (e: React.DragEvent, targetFolderId: string | null) => { 
    e.preventDefault(); 
    if (!draggedNoteId) return; 
    setNotes(prev => prev.map(n => n.id === draggedNoteId ? { ...n, folderId: targetFolderId || undefined } : n)); 
    setDraggedNoteId(null); 
  };

  let allFilteredNotes = notes.filter((note) => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );
  if (selectedFolderId !== null) allFilteredNotes = allFilteredNotes.filter(note => note.folderId === selectedFolderId);

  const filteredNotes = [...allFilteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.isPinned && b.isPinned) return (a.pinnedOrder || 0) - (b.pinnedOrder || 0);
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="min-h-screen bg-background pb-20 animate-fade-in">
      <header className="border-b sticky top-0 bg-card z-10">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <img src={npdLogo} alt="NPD" className="h-8 w-8" />
              <h1 className="text-xl font-bold">Npd</h1>
            </div>
            <div className="flex items-center gap-2">
              {syncEnabled && <SyncBadge isOnline={isOnline} isSyncing={isSyncing} lastSync={lastSync} hasError={hasError} />}
              <Button size="icon" variant="ghost" onClick={() => navigate('/todo/today')} className="h-9 w-9" title="Switch to To-Do">
                <ListTodo className="h-6 w-6" />
              </Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search notes and transcripts" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-secondary/50 border-none" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-3">
        <PersonalizedTips />
        <FolderManager 
          folders={folders} 
          selectedFolderId={selectedFolderId} 
          onSelectFolder={setSelectedFolderId} 
          onCreateFolder={handleCreateFolder} 
          onDeleteFolder={handleDeleteFolder} 
          onEditFolder={handleEditFolder} 
          onDropOnFolder={handleDropOnFolder} 
          notes={notes} 
          onAddNotesToFolder={(noteIds, folderId) => setNotes(prev => prev.map(note => noteIds.includes(note.id) ? { ...note, folderId } : note))} 
          onRemoveNoteFromFolder={(noteId) => setNotes(prev => prev.map(note => note.id === noteId ? { ...note, folderId: undefined } : note))} 
        />

        {filteredNotes.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold mb-2">No notes yet</h2>
            <p className="text-muted-foreground text-sm">{searchQuery ? 'No notes found' : 'Tap the button below to create your first note'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note} 
                onEdit={handleEditNote} 
                onDelete={handleDeleteNote} 
                onTogglePin={handleTogglePin} 
                onDragStart={handleDragStart} 
                onDragOver={handleDragOver} 
                onDrop={handleDrop} 
                onDragEnd={handleDragEnd} 
              />
            ))}
          </div>
        )}
      </main>

      <NoteEditor 
        note={selectedNote} 
        isOpen={isEditorOpen} 
        onClose={() => { setIsEditorOpen(false); setSelectedNote(null); }} 
        onSave={handleSaveNote} 
        defaultType={defaultType} 
        defaultFolderId={selectedFolderId || undefined} 
      />

      {!isEditorOpen && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="fixed bottom-20 left-4 right-4 z-50 h-12 text-base font-semibold" size="lg">
              <Plus className="h-5 w-5 mr-2" />New Note
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="mb-2 w-48">
            <DropdownMenuItem onClick={() => handleCreateNote('sticky')} className="gap-2"><StickyNote className="h-4 w-4" />Sticky Note</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreateNote('lined')} className="gap-2"><FileText className="h-4 w-4" />Lined Note</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreateNote('regular')} className="gap-2"><FileEdit className="h-4 w-4" />Regular Note</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreateNote('sketch')} className="gap-2"><Pen className="h-4 w-4" />Sketch Note</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreateNote('code')} className="gap-2"><FileCode className="h-4 w-4" />Code Note</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleCreateNote('mindmap')} className="gap-2"><GitBranch className="h-4 w-4" />Mind Map</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <BottomNavigation />
    </div>
  );
};

export default Index;
