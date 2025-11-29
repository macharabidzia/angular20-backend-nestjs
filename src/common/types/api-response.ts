// common/types/api-response.ts
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  code: string; // message key like USER.CREATED
  data?: T;
}
