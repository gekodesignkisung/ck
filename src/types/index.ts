export type ChannelColor =
  | '#f3e3ba'
  | '#bcf3ba'
  | '#baf3f3'
  | '#f3baf3'
  | '#f3bad3';

export interface Channel {
  id: string;
  name: string;
  color: ChannelColor;
  fileCount: number;
  memberCount: number;
}

export interface Member {
  id: string;
  name: string;
  email?: string;
  color: string;
  initial: string;
  isMe?: boolean;
  status?: 'sleeping' | 'awake' | 'working';
  workingTask?: string;
}

export interface RecentFile {
  id: string;
  name: string;
  content?: string;
  updatedAt: Date;
}

export type PanelType = 'channel' | 'dm' | 'file';

export interface Panel {
  id: string;
  type: PanelType;
  title: string;
  /** channel color for tint */
  color?: string;
  /** channel panel extras */
  fileCount?: number;
  memberCount?: number;
  /** dm panel extras */
  member?: Member;
  /** file panel extras */
  fileContent?: string;
  /** selected members in input bar (for channel/dm) */
  selectedMembers?: Member[];
  messages?: Message[];
  /** AI is generating a response */
  isTyping?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderInitial: string;
  content: string;
  createdAt: Date;
}
