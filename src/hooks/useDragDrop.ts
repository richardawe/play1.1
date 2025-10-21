// Drag and Drop Hook for cross-module content transfer
import { useCallback, useEffect, useState } from 'react';
import { useIntegrationStore } from '../store/useIntegrationStore';
import { ModuleType, DragDropData } from '../types/integration';

interface UseDragDropOptions {
  module: ModuleType;
  onDrop?: (data: DragDropData) => void;
  acceptTypes?: ('text' | 'file' | 'task' | 'event' | 'document')[];
}

export function useDragDrop({ module, onDrop }: UseDragDropOptions) {
  const { startDrag, endDrag, handleDrop, addNotification } = useIntegrationStore();
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (dragCounter === 0) {
      setIsDragOver(true);
    }
  }, [dragCounter]);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter <= 1) {
      setIsDragOver(false);
    }
  }, [dragCounter]);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDropEvent = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    setDragCounter(0);

    try {
      const dataTransfer = e.dataTransfer;
      if (!dataTransfer) return;

      // Handle file drops
      if (dataTransfer.files && dataTransfer.files.length > 0) {
        const files = Array.from(dataTransfer.files);
        const dragData: DragDropData = {
          type: 'file',
          data: files[0], // Take first file for now
          sourceContext: {
            module: 'documents', // Assume from documents for now
            content: 'file-upload',
            metadata: {
              sourceType: 'documents-interface'
            }
          }
        };

        if (onDrop) {
          onDrop(dragData);
        } else {
          await handleDrop(module, dragData);
        }
        return;
      }

      // Handle text drops
      const text = dataTransfer.getData('text/plain');
      if (text) {
        const dragData: DragDropData = {
          type: 'text',
          data: text,
          sourceContext: {
            module: 'chat', // Assume from chat for now
            content: text,
            metadata: {
              sourceType: 'chat-interface'
            }
          }
        };

        if (onDrop) {
          onDrop(dragData);
        } else {
          await handleDrop(module, dragData);
        }
        return;
      }

      // Handle custom data drops
      const customData = dataTransfer.getData('application/play-data');
      if (customData) {
        try {
          const parsedData = JSON.parse(customData);
          const dragData: DragDropData = {
            type: parsedData.type,
            data: parsedData.data,
            sourceContext: parsedData.sourceContext
          };

          if (onDrop) {
            onDrop(dragData);
          } else {
            await handleDrop(module, dragData);
          }
        } catch (error) {
          console.error('Failed to parse custom drag data:', error);
        }
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Drop Failed',
        message: 'Failed to process dropped content',
        duration: 5000
      });
    }
  }, [module, onDrop, handleDrop, addNotification]);

  const makeDraggable = useCallback((element: HTMLElement, data: DragDropData) => {
    element.draggable = true;

    const handleDragStart = (e: DragEvent) => {
      if (!e.dataTransfer) return;

      e.dataTransfer.effectAllowed = 'copy';
      
      // Set text data
      if (typeof data.data === 'string') {
        e.dataTransfer.setData('text/plain', data.data);
      }

      // Set custom data
      e.dataTransfer.setData('application/play-data', JSON.stringify({
        type: data.type,
        data: data.data,
        sourceContext: data.sourceContext
      }));

      startDrag(data);
    };

    const handleDragEnd = () => {
      endDrag();
    };

    element.addEventListener('dragstart', handleDragStart);
    element.addEventListener('dragend', handleDragEnd);

    return () => {
      element.removeEventListener('dragstart', handleDragStart);
      element.removeEventListener('dragend', handleDragEnd);
    };
  }, [startDrag, endDrag]);

  useEffect(() => {
    const element = document.body;

    element.addEventListener('dragenter', handleDragEnter);
    element.addEventListener('dragleave', handleDragLeave);
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('drop', handleDropEvent);

    return () => {
      element.removeEventListener('dragenter', handleDragEnter);
      element.removeEventListener('dragleave', handleDragLeave);
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('drop', handleDropEvent);
    };
  }, [handleDragEnter, handleDragLeave, handleDragOver, handleDropEvent]);

  return {
    isDragOver,
    makeDraggable,
    dragCounter
  };
}

