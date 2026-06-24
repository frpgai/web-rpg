import { apiClient } from '../client';
import type { User, PatchMeRequest } from '../../types/user';

export const userService = {
  getMe: (): Promise<User> =>
    apiClient.get('api/v1/me').json<User>(),

  patchMe: (data: PatchMeRequest): Promise<User> =>
    apiClient.patch('api/v1/me', { json: data }).json<User>(),
};
