import { diskStorage } from 'multer';
import { extname } from 'path';

const MAX_IMG_SIZE = 4 * 1024 * 1024;

export const multerConfig = {
  fileFilter: function (req: any, file: any, cb: Function) {
    if (
      !file.mimetype.includes('image/png') &&
      !file.mimetype.includes('image/jpg') &&
      !file.mimetype.includes('image/jpeg')
    ) {
      return cb(null, false);
    }
    cb(null, true);
  },

  storage: diskStorage({
    destination: 'public',
    filename: (req: any, file: any, callback) => {
      const randomName = Array(32)
        .fill(null)
        .map(() => Math.round(Math.random() * 16).toString(16))
        .join('');
      callback(null, `${randomName}${extname(file.originalname)}`);
    },
  }),

  limits: { fileSize: MAX_IMG_SIZE },
};
