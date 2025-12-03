import { useState, useEffect } from 'react';
import { Note, NoteType } from '@/types/note';
import { NoteCard } from '@/components/NoteCard';
import { NoteEditor } from '@/components/NoteEditor';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, StickyNote, FileText, FileEdit, Pen, FileCode, GitBranch } from 'lucide-react';

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');

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

  const handleSaveNote = (note: Note) => {
    setNotes((prev) => {
      const updated = prev.find((n) => n.id === note.id)
        ? prev.map((n) => (n.id === note.id ? note : n))
        : [note, ...prev];
      localStorage.setItem('notes', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => {
      const updated = prev.filter((n) => n.id !== id);
      localStorage.setItem('notes', JSON.stringify(updated));
      return updated;
    });
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setIsEditorOpen(true);
  };

  const noteTypes: { key: string; label: string; icon: any; type?: NoteType }[] = [
    { key: 'all', label: 'All', icon: FileText },
    { key: 'sticky', label: 'Sticky', icon: StickyNote, type: 'sticky' },
    { key: 'lined', label: 'Lined', icon: FileText, type: 'lined' },
    { key: 'regular', label: 'Regular', icon: FileEdit, type: 'regular' },
    { key: 'sketch', label: 'Sketch', icon: Pen, type: 'sketch' },
    { key: 'code', label: 'Code', icon: FileCode, type: 'code' },
    { key: 'mindmap', label: 'Mind Map', icon: GitBranch, type: 'mindmap' },
  ];

  let filteredNotes = notes.filter((note) =>
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeTab !== 'all') {
    filteredNotes = filteredNotes.filter((note) => note.type === activeTab);
  }

  return (
    <div className="min-h-screen bg-background pb-20 animate-fade-in">
      <header className="border-b sticky top-0 bg-card z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold mb-4">Notes</h1>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-secondary/50 border-none"
            />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-4">
            {noteTypes.map(({ key, label, icon: Icon }) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredNotes.length === 0 ? (
              <div className="text-center py-20">
                <h2 className="text-xl font-semibold mb-2">No notes found</h2>
                <p className="text-muted-foreground text-sm">
                  {searchQuery ? 'Try a different search term' : 'Create a note from the home page'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <NoteEditor
        note={selectedNote}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedNote(null);
        }}
        onSave={handleSaveNote}
      />

      <BottomNavigation />
    </div>
  );
};

export default Notes;
