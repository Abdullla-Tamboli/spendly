import { PackageOpen } from 'lucide-react';
import Button from './Button.jsx';

export default function EmptyState({ title, description, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="p-4 bg-bg rounded-full">
        <PackageOpen size={32} className="text-text-muted" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">{title}</h3>
      {description && <p className="text-sm text-text-secondary max-w-xs">{description}</p>}
      {action && (
        <Button onClick={action} className="mt-2">
          {actionLabel || 'Get started'}
        </Button>
      )}
    </div>
  );
}
