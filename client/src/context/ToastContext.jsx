import { createContext, useContext, useReducer, useCallback } from 'react';

const ToastContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'ADD':
      return [...state, action.toast];
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const toast = useCallback((message, type = 'success', duration = 4000) => {
    const id = `${Date.now()}-${Math.random()}`;
    dispatch({ type: 'ADD', toast: { id, message, type } });
    setTimeout(() => dispatch({ type: 'REMOVE', id }), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      {/* Toast container */}
      <div aria-live="polite" aria-atomic="false" className="fixed bottom-20 lg:bottom-6 right-4 left-4 sm:left-auto z-50 flex flex-col items-end gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto px-4 py-3 rounded-btn border text-sm font-medium text-white max-w-sm ${
              t.type === 'error' ? 'bg-expense' : 'bg-income'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}
