import { useState, useEffect } from 'react';
import { Note } from '@/types/note';
import { NoteCard } from '@/components/NoteCard';
import { NoteEditor } from '@/components/NoteEditor';
import { BottomNavigation } from '@/components/BottomNavigation';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, isSameDay } from 'date-fns';

const NotesCalendar = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

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

  const notesForSelectedDate = notes.filter((note) =>
    isSameDay(new Date(note.createdAt), selectedDate)
  );

  const datesWithNotes = notes.map((note) => new Date(note.createdAt));

  return (
    <div className="min-h-screen bg-background pb-20 animate-fade-in">
      <header className="border-b sticky top-0 bg-card z-10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Calendar</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-3">
        <Card className="mb-4">
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              modifiers={{
                hasNotes: datesWithNotes,
              }}
              modifiersStyles={{
                hasNotes: {
                  fontWeight: 'bold',
                  textDecoration: 'underline',
                  textDecorationColor: 'hsl(var(--primary))',
                },
              }}
              className="rounded-md w-full"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Notes for {format(selectedDate, 'MMMM d, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notesForSelectedDate.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No notes for this date
              </p>
            ) : (
              <div className="space-y-3">
                {notesForSelectedDate.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
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

export default NotesCalendar;
