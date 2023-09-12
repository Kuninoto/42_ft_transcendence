import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { nanoid } from 'nanoid';
import { extname } from 'path';

const MAX_IMG_SIZE: number = 4 * 1024 * 1024;
const acceptableFileTypes: string[] = ['image/png', 'image/jpg', 'image/jpeg'];

export const multerConfig: MulterOptions = {
  fileFilter: function (
    req: any,
    file: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    },
    cb: (error: Error | null, acceptFile: boolean) => void,
  ): void {
    if (!acceptableFileTypes.includes(file.mimetype)) {
      return cb(null, false);
    }
    cb(null, true);
  },

  limits: { fileSize: MAX_IMG_SIZE },

  storage: diskStorage({
    destination: 'public',
    filename: (
      req: any,
      file: Express.Multer.File,
      callback: (error: Error, filename: string) => void,
    ) => {
      callback(null, `${nanoid()}${extname(file.originalname)}`);
    },
  }),
};
