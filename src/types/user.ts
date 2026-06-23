export interface User {
  id: string;
  name: string;
  email: string;
  current_system_id: string | null;
}

export interface PatchMeRequest {
  current_system_id?: string | null;
}
