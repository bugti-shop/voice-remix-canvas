import { TodoLayout } from './TodoLayout';

const Upcoming = () => {
  return (
    <TodoLayout title="Upcoming">
      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Upcoming Tasks</h2>
          <p className="text-muted-foreground">Tasks with due dates will appear here</p>
        </div>
      </main>
    </TodoLayout>
  );
};

export default Upcoming;
