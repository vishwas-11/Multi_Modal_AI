import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
export interface AuthRequest extends Request {
    user?: IUser;
    file?: Express.Multer.File;
    files?: Express.Multer.File[] | {
        [fieldname: string]: Express.Multer.File[];
    };
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const authenticateWithQueryToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const generateToken: (userId: string, email: string) => string;
//# sourceMappingURL=auth.d.ts.map