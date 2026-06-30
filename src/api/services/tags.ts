import { apiClient } from '../client';
import type { Tag } from '../../types';

export const tagsApi = {
  list: () => apiClient.get('api/v1/tags').json<Tag[]>(),
};
