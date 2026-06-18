import { apiClient } from '../client';
import type { AuthResponse } from '../../types';

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  accepted_terms: boolean;
  marketing_opt_in: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type GoogleAuthPayload = {
  id_token: string;
  accepted_terms: boolean;
  marketing_opt_in: boolean;
};

export async function postRegister(payload: RegisterPayload): Promise<AuthResponse> {
  return apiClient.post('api/v1/auth/register', { json: payload }).json<AuthResponse>();
}

export async function postLogin(payload: LoginPayload): Promise<AuthResponse> {
  return apiClient.post('api/v1/auth/login', { json: payload }).json<AuthResponse>();
}

export async function postGoogleAuth(payload: GoogleAuthPayload): Promise<AuthResponse> {
  return apiClient.post('api/v1/auth/google', { json: payload }).json<AuthResponse>();
}
