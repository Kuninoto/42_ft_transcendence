import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { diskStorage } from 'multer';
import { extname } from 'path';

const MAX_IMG_SIZE: number = 4 * 1024 * 1024;
const acceptableFileTypes: string[] = ['image/png', 'image/jpg', 'image/jpeg'];

export const multerConfig: MulterOptions = {
  fileFilter: function (
    req: any,
    file: any,
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
    filename: (req: any, file: any, callback) => {
      const randomName: string = crypto.randomUUID().split('-').join('');
      callback(null, `${randomName}${extname(file.originalname)}`);
    },
  }),
};
