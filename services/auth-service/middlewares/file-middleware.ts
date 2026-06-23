import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  S3,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { AwsConfig, CustomError, CustomMulterFilesField, S3FileUrlType } from "../types";
import multer, { Multer } from "multer";
import {
  AWS_ACCESS_KEY_ID,
  AWS_BUCKET_NAME,
  AWS_REGION,
  AWS_SECRET_ACCESS_KEY,
  AWS_SIGNED_URL_EXPIRY,
  FILE_SIZE,
} from "../configs/config";
import { RequestHandler } from "express";
import { getFileUrl } from "../utils/random";

export class FileMiddleware {
  private static instance: FileMiddleware | null = null;
  private s3Client: S3Client;
  private bucketName: string;
  multerInstance: Multer;
  customError: CustomError;
  constructor() {
    this.customError = new CustomError({
      responseMessage: "",
      responseCode: 503,
    });

    const awsConfig = {
      accessKey: AWS_ACCESS_KEY_ID,
      secrectKey: AWS_SECRET_ACCESS_KEY,
      bucketName: AWS_BUCKET_NAME,
      region: AWS_REGION,
    };
    if (
      !awsConfig.accessKey ||
      !awsConfig.bucketName ||
      !awsConfig.region ||
      !awsConfig.secrectKey
    ) {
      this.customError.responseMessage =
        "File storage service is currently unavailable. Please try again.";
      this.customError.responseCode = 503;

      throw this.customError;
    }

    this.s3Client = new S3({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKey,
        secretAccessKey: awsConfig.secrectKey,
      },
    });

    this.bucketName = awsConfig.bucketName;

    this.multerInstance = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: FILE_SIZE },
    });
  }

  public static initialize(config: AwsConfig): void {
    if (!this.instance) {
      this.instance = new FileMiddleware();
    }
  }

  public static getInstance(): FileMiddleware {
    if (!this.instance) {
      throw new CustomError({
        responseMessage: "Something went wrong on File Storage Service",
        responseCode: 500,
      });
    }
    return this.instance;
  }

  async uploadFile(file: Express.Multer.File | undefined | null, type: S3FileUrlType): Promise<string> {
    if (!file) return ''
    const fileName = `${Date.now()}_${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: getFileUrl(type) + fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);
      return fileName;
    } catch (error) {
      console.log(error, "error occured")
      this.customError.responseMessage = "File Upload issue, Please try again";
      this.customError.responseCode = 500;
      throw this.customError;
    }
  }

  async getFileSignedUrl(fileName: string, type: S3FileUrlType, expiry: number = AWS_SIGNED_URL_EXPIRY): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: getFileUrl(type) + fileName,
    });

    try {
      const signedUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiry,
      });
      return signedUrl;
    } catch (error) {
      this.customError.responseMessage = "Issue on file url, Please try again";
      this.customError.responseCode = 500;
      throw this.customError;
    }
  }

  acceptMultipleFields = (fields: CustomMulterFilesField[]) => {
    return this.multerInstance.fields(fields) as unknown as RequestHandler;
  };

  acceptSingleFile = (field: string) => {
    return this.multerInstance.single(field) as unknown as RequestHandler;
  };

  acceptMulitpleFiles = (field: string) => {
    return this.multerInstance.array(field) as unknown as RequestHandler;
  };

  acceptAny = () => {
    return this.multerInstance.any() as unknown as RequestHandler;
  }

  acceptNone() {
    return this.multerInstance.none() as unknown as RequestHandler;
  }
}

export const fileMiddleware = new FileMiddleware();