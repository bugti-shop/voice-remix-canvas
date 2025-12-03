import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MindMapNode {
  id: string;
  text: string;
  children: MindMapNode[];
  color?: string;
}

interface MindMapEditorProps {
  content: string;
  onChange: (content: string) => void;
  title?: string;
  onTitleChange?: (title: string) => void;
}

const COLORS = ['#3c78f0', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export const MindMapEditor = ({ content, onChange, title, onTitleChange }: MindMapEditorProps) => {
  const [rootNode, setRootNode] = useState<MindMapNode>(() => {
    try {
      return content ? JSON.parse(content) : { id: 'root', text: 'Main Idea', children: [], color: COLORS[0] };
    } catch {
      return { id: 'root', text: 'Main Idea', children: [], color: COLORS[0] };
    }
  });

  useEffect(() => {
    onChange(JSON.stringify(rootNode));
  }, [rootNode, onChange]);

  const addChild = (parentId: string) => {
    const addChildToNode = (node: MindMapNode): MindMapNode => {
      if (node.id === parentId) {
        return {
          ...node,
          children: [
            ...node.children,
            {
              id: Date.now().toString(),
              text: 'New Idea',
              children: [],
              color: COLORS[node.children.length % COLORS.length],
            },
          ],
        };
      }
      return {
        ...node,
        children: node.children.map(addChildToNode),
      };
    };
    setRootNode(addChildToNode(rootNode));
  };

  const removeNode = (nodeId: string) => {
    if (nodeId === 'root') return;

    const removeFromNode = (node: MindMapNode): MindMapNode => {
      return {
        ...node,
        children: node.children
          .filter((child) => child.id !== nodeId)
          .map(removeFromNode),
      };
    };
    setRootNode(removeFromNode(rootNode));
  };

  const updateNodeText = (nodeId: string, text: string) => {
    const updateNode = (node: MindMapNode): MindMapNode => {
      if (node.id === nodeId) {
        return { ...node, text };
      }
      return {
        ...node,
        children: node.children.map(updateNode),
      };
    };
    setRootNode(updateNode(rootNode));
  };

  const renderNode = (node: MindMapNode, level: number = 0) => {
    const isRoot = level === 0;

    return (
      <div key={node.id} className={cn('relative', level > 0 && 'ml-8 mt-2')}>
        {level > 0 && (
          <div
            className="absolute left-0 top-1/2 w-6 h-px"
            style={{ backgroundColor: node.color || '#ccc', transform: 'translateX(-100%)' }}
          />
        )}
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-lg border-2 transition-all',
            isRoot ? 'bg-primary text-primary-foreground' : 'bg-card'
          )}
          style={{ borderColor: node.color || 'transparent' }}
        >
          <Circle className="h-3 w-3" style={{ color: node.color }} />
          <Input
            value={node.text}
            onChange={(e) => updateNodeText(node.id, e.target.value)}
            className={cn(
              'border-none bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0',
              isRoot && 'text-primary-foreground placeholder:text-primary-foreground/70'
            )}
            placeholder="Enter idea..."
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={() => addChild(node.id)}
            >
              <Plus className="h-3 w-3" />
            </Button>
            {!isRoot && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => removeNode(node.id)}
              >
                <Minus className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {node.children.length > 0 && (
          <div className="relative">
            <div
              className="absolute left-4 top-0 w-px h-full"
              style={{ backgroundColor: node.color || '#ccc' }}
            />
            {node.children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-auto p-4 bg-background">
      {onTitleChange && (
        <Input
          value={title || ''}
          onChange={(e) => onTitleChange(e.target.value)}
          className="text-2xl font-bold border-none bg-transparent p-0 mb-6 focus-visible:ring-0"
          placeholder="Mind Map Title..."
        />
      )}
      <div className="flex-1 overflow-auto">
        {renderNode(rootNode)}
      </div>
    </div>
  );
};
