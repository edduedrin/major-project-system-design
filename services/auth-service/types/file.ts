export class CustomMulterFilesField {
  name: string;
  maxCount: number;
  constructor(data: CustomMulterFilesField) {
    this.name = data?.name || ''
    this.maxCount = data?.maxCount || 0
  }
}

export type S3FileUrlType = 'ticket' | 'cn' |
  'warranty' | 'scheme' | 'info' |
  'new-launch' | 'logger' | 'aadhaar-digilocker' |
  'aadhaar-front' | 'aadhaar-back' | 'pan-front' | 'user-profile' | 'qrFile' | 'amazon-market' | 'notification' | 'statements' | 'asset';


export class UploadFiles {
  file: Express.Multer.File;
  originalname: string;
  fieldName: S3FileUrlType;
  mimetype: string;
  constructor(data: any) {
    this.file = data?.file || null;
    this.originalname = data?.originalname || "";
    this.fieldName = data?.fieldName || "";
    this.mimetype = data?.mimetype || "";
  }
}
