import { NextFunction, Request, Response } from "express";
import { CustomError } from "../types";
import { passbookRepository } from "../repositories";
import { customValidators } from "../utils/custom-validators";
import { fileMiddleware } from "../middlewares/file-middleware";

export class PassbookController {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: ""
        })
    }

    getPassbook = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.getPassbook(req.body);
            const data = await passbookRepository.getPassbook(req?.userDetails, payload);
            return res.json({
                message: "",
                code: 200,
                data
            })
        } catch (error) {
            next(error);
        }
    }

    downloadStatement = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.userDetails.userId;
            const payload = customValidators.getPassbook(req.body);
            const existingFile = await passbookRepository.checkExistingStatement(userId, payload);

            if (existingFile) {
                const signedUrl = await fileMiddleware.getFileSignedUrl(existingFile.fileUrl, "statements");
                return res.json({
                    message: "Statement Downloaded",
                    code: 200,
                    data: { fileUrl: signedUrl, isNew: false },
                });
            }

            const data = await passbookRepository.downloadStatement(userId, payload);
            const signedUrl = await fileMiddleware.getFileSignedUrl(data.fileUrl, "statements");

            return res.json({
                message: "Statement Downloaded",
                code: 200,
                data: { fileUrl: signedUrl, isNew: true },
            });
        } catch (error) {
            next(error);
        }
    }


}

export const passbookController = new PassbookController();