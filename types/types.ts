export interface User {
  email: string;
  name: string;
  id?: string;
  isOwner?: boolean;
  avatarUrl?: string;
  username?: string;
  socketId: string;
}

export interface Room {
  id: number;
  name: string;
  description: string;
  confirmed: boolean;
  appState: object;
  elements: object[];
}

export interface MessageData {
  message: string;
  user: string;
  timestamp: string; // 서버에서 받은 원본 데이터
}

export interface MessageDataWithDate {
  message: string;
  user: string;
  timestamp: Date; // 변환된 Date 타입
}
