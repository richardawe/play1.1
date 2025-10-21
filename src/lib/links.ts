// Links API - for cross-module linking per prd.md §3️⃣.C
import { invoke } from '@tauri-apps/api/tauri';
import { Link, CreateLink } from '../types/link';

export const linksAPI = {
  createLink: (link: CreateLink): Promise<Link> => {
    return invoke('create_link', { link });
  },

  getLinksForItem: (itemType: string, itemId: number): Promise<Link[]> => {
    return invoke('get_links_for_item', { itemType, itemId });
  },

  deleteLink: (id: number): Promise<void> => {
    return invoke('delete_link', { id });
  },
};

export async function linkDocumentToMessage(documentId: number, messageId: number): Promise<Link> {
  return linksAPI.createLink({
    source_type: 'document',
    source_id: documentId,
    target_type: 'message',
    target_id: messageId,
  });
}

export async function linkDocumentToTask(documentId: number, taskId: number): Promise<Link> {
  return linksAPI.createLink({
    source_type: 'document',
    source_id: documentId,
    target_type: 'task',
    target_id: taskId,
  });
}

export async function getDocumentLinks(documentId: number): Promise<Link[]> {
  return linksAPI.getLinksForItem('document', documentId);
}

