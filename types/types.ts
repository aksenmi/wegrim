export interface User {
  email: string;
  name: string;
  avatar_url: string;
}

export interface Room {
  id: number;
  name: string;
  description: string;
  confirmed: boolean;
  appState: object;
  elements: object[];
}
