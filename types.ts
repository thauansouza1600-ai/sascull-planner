export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Label {
  id: string;
  name: string;
  color: string; // Tailwind class for bg
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Activity {
    id: string;
    userId: string;
    text: string;
    createdAt: string;
    type: 'comment' | 'action';
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
  createdAt: string;
}

export interface Card {
  id: string;
  listId: string;
  title: string;
  description: string;
  labels: Label[];
  members: User[];
  comments: Comment[];
  checklist: ChecklistItem[];
  attachments: Attachment[];
  activity: Activity[];
  dueDate?: string;
  coverUrl?: string;
}

export interface List {
  id: string;
  title: string;
  cardIds: string[]; // Array of card IDs for ordering
}

export interface Board {
  id: string;
  title: string;
  lists: { [key: string]: List };
  cards: { [key: string]: Card };
  listOrder: string[];
}

export type DragItemType = 'CARD' | 'LIST';

export interface DragItem {
  id: string;
  type: DragItemType;
  index: number;
  listId?: string; // Only for cards
}