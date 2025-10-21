// Hook for handling text selection and context menu
import { useEffect, useCallback } from 'react';
import { useIntegrationStore } from '../store/useIntegrationStore';
import { ModuleType } from '../types/integration';

interface UseTextSelectionOptions {
  module: ModuleType;
  sourceId?: string;
  sourceType?: string;
  metadata?: Record<string, any>;
}

export function useTextSelection(options: UseTextSelectionOptions) {
  const { showContextMenu } = useIntegrationStore();
  const { module, sourceId, sourceType, metadata } = options;

  const handleTextSelection = useCallback((event: MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 3) {
      return; // Don't show context menu for very short selections
    }

    // Prevent default context menu
    event.preventDefault();

    // Get mouse position
    const position = {
      x: event.clientX,
      y: event.clientY
    };

    // Create context
    const context = {
      module,
      content: selectedText,
      metadata: {
        sourceId,
        sourceType,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };

    // Show context menu
    showContextMenu(selectedText, position, context);
  }, [module, sourceId, sourceType, metadata, showContextMenu]);

  const handleContextMenu = useCallback((event: MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim().length === 0) {
      return;
    }

    const selectedText = selection.toString().trim();
    if (selectedText.length < 3) {
      return;
    }

    // Prevent default context menu
    event.preventDefault();

    // Get mouse position
    const position = {
      x: event.clientX,
      y: event.clientY
    };

    // Create context
    const context = {
      module,
      content: selectedText,
      metadata: {
        sourceId,
        sourceType,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };

    // Show context menu
    showContextMenu(selectedText, position, context);
  }, [module, sourceId, sourceType, metadata, showContextMenu]);

  useEffect(() => {
    // Add event listeners
    document.addEventListener('mouseup', handleTextSelection);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mouseup', handleTextSelection);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleTextSelection, handleContextMenu]);

  return {
    handleTextSelection,
    handleContextMenu
  };
}

