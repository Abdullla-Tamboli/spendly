import { AlertCircle } from 'lucide-react';
import Button from './Button.jsx';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="p-4 bg-expense-tint rounded-full">
        <AlertCircle size={32} className="text-expense" />
      </div>
      <h3 className="text-base font-semibold text-text-primary">Error</h3>
      <p className="text-sm text-text-secondary max-w-xs">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="secondary" className="mt-2">
          Retry
        </Button>
      )}
    </div>
  );
}
