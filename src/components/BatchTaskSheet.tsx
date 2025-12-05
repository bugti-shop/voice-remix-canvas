import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ListPlus } from 'lucide-react';

interface BatchTaskSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTasks: (tasks: string[]) => void;
}

export const BatchTaskSheet = ({ isOpen, onClose, onAddTasks }: BatchTaskSheetProps) => {
  const [text, setText] = useState('');

  const handleAdd = () => {
    const tasks = text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    if (tasks.length > 0) {
      onAddTasks(tasks);
      setText('');
      onClose();
    }
  };

  const taskCount = text.split('\n').filter(line => line.trim().length > 0).length;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <ListPlus className="h-5 w-5" />
            Add Multiple Tasks
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter one task per line. Each line will become a separate task.
          </p>
          
          <Textarea
            placeholder="Buy groceries&#10;Call mom&#10;Finish report&#10;Schedule meeting"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] resize-none"
            autoFocus
          />
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {taskCount} task{taskCount !== 1 ? 's' : ''} to add
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleAdd} disabled={taskCount === 0}>
                Add {taskCount > 0 ? taskCount : ''} Task{taskCount !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
