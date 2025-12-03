import { TodoLayout } from './TodoLayout';

const TodoSettings = () => {
  return (
    <TodoLayout title="Settings">
      <main className="container mx-auto px-4 py-6 pb-24">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Todo Settings</h2>
          <p className="text-muted-foreground">Configure your todo preferences</p>
        </div>
      </main>
    </TodoLayout>
  );
};

export default TodoSettings;
