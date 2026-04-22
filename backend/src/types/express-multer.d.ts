import 'express-serve-static-core';

// Ensure multer's global Express augmentation is visible to TypeScript
// across different TS / moduleResolution setups.
import 'multer';

declare global {
  namespace Express {
    // In some setups (or partial type installs) `Express.Multer` may not be
    // present at compile time even though multer is used at runtime.
    // This keeps our code compiling while still being compatible with
    // `@types/multer` if it's installed.
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer?: Buffer;
      }
    }

    interface Request {
      file?: Multer.File;
      files?: Multer.File[] | { [fieldname: string]: Multer.File[] };
    }
  }
}

export {};
