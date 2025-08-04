import { useState, useCallback } from 'react';

export function useCommandHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [currentDraft, setCurrentDraft] = useState('');

  const addToHistory = useCallback((command: string) => {
    if (command.trim() && command !== history[history.length - 1]) {
      setHistory(prev => [...prev.slice(-19), command]); // Keep last 20 commands
    }
    setCurrentIndex(-1);
    setCurrentDraft('');
  }, [history]);

  const navigateHistory = useCallback((direction: 'up' | 'down', currentValue: string) => {
    if (history.length === 0) return currentValue;

    if (currentIndex === -1 && direction === 'up') {
      // Starting navigation from current input
      setCurrentDraft(currentValue);
      setCurrentIndex(history.length - 1);
      return history[history.length - 1];
    }

    if (direction === 'up' && currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      return history[newIndex];
    }

    if (direction === 'down') {
      if (currentIndex === history.length - 1) {
        // Return to draft
        setCurrentIndex(-1);
        return currentDraft;
      } else if (currentIndex > -1) {
        const newIndex = currentIndex + 1;
        setCurrentIndex(newIndex);
        return history[newIndex];
      }
    }

    return currentValue;
  }, [history, currentIndex, currentDraft]);

  const saveDraft = useCallback((draft: string) => {
    if (currentIndex === -1) {
      setCurrentDraft(draft);
    }
  }, [currentIndex]);

  return {
    addToHistory,
    navigateHistory,
    saveDraft,
    hasHistory: history.length > 0
  };
}