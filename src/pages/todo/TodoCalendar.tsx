import { TodoLayout } from './TodoLayout';

const TodoCalendar = () => {
  return (
    <TodoLayout title="Calendar">
      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Task Calendar</h2>
          <p className="text-muted-foreground">View tasks by date</p>
        </div>
      </main>
    </TodoLayout>
  );
};

export default TodoCalendar;
