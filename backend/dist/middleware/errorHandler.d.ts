import { Request, Response, NextFunction } from 'express';
export interface AppError extends Error {
    statusCode?: number;
    isOperational?: boolean;
    code?: number | string;
    keyValue?: Record<string, unknown>;
    errors?: Record<string, {
        message: string;
    }>;
    path?: string;
    value?: string;
}
export declare const createError: (message: string, statusCode: number) => AppError;
export declare const errorHandler: (err: AppError, _req: Request, res: Response, _next: NextFunction) => void;
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) => (req: Request, res: Response, next: NextFunction) => void;
export declare const notFound: (_req: Request, res: Response) => void;
//# sourceMappingURL=errorHandler.d.ts.map