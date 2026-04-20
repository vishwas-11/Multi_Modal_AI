import { Response, NextFunction } from 'express';
export declare const chat: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const streamChat: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const getConversations: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const getConversation: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const deleteConversation: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const regenerateLastResponse: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const clearConversation: (req: import("express").Request, res: Response, next: NextFunction) => void;
export declare const exportConversation: (req: import("express").Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=chatController.d.ts.map