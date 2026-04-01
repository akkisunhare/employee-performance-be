import { Response as ExpressResponse } from 'express';
import { ApiResponse } from './api-response.interface';

declare module 'express' {
  interface Response extends ExpressResponse {
    apiResponse?: ApiResponse<any>;
  }
}
