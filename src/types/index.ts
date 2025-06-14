export interface Trade {
  from_member: User,
  to_member: User,
  math_item_exchanged: Item,
  result: Result

}
export interface Result {
  table_number: number | string;
  status_display: string;
}

export interface User {
  id: number;
  first_name: string;
  last_name: string;
}
export interface Item {
  id: number;
  title: string;
  delivered: boolean;
  elements: Game[]
}

export interface Game {
  id: number;
  primary_name: string;
}

type GameStatus = "delivered" | "pending";
export interface GameDetails {
  id: number;
  title: string;
  status: GameStatus; 
  delivered_to_user_id?: number | null;
  delivered_to_user_name?: string | null;
}
