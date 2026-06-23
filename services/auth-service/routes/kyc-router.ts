import express, { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { kycController } from "../controllers";
import { fileMiddleware } from "../middlewares/file-middleware";

const router: Router = express.Router();


const kycFiles = [
    {
        name: 'aadhaar-front',
        maxCount: 1
    },
    {
        name: 'aadhaar-back',
        maxCount: 1
    },
    {
        name: 'pan-front',
        maxCount: 1
    },
]

router.get("/initiate-digilocker", authMiddleware.verifyToken, kycController.initiateDigilocker);
router.get("/validate-digilocker-session", authMiddleware.verifyToken, kycController.validateDigilockerSession);
router.post("/upload-kyc-files", authMiddleware.verifyToken, fileMiddleware.acceptMultipleFields(kycFiles), kycController.uploadKycFiles);
router.get("/get-kyc-details", authMiddleware.verifyToken, kycController.getKycDetails);
router.get("/pincode/:pincode", authMiddleware.verifyToken, kycController.getPincodeDetails);
router.post("/add-retailers", authMiddleware.verifyToken, kycController.addRetailer);
router.post("/get-retailers", authMiddleware.verifyToken, kycController.getRetailer);
router.get("/kycs", authMiddleware.verifyToken, kycController.getUserKycDetails);
router.post("/updateKycs", authMiddleware.verifyToken, kycController.updatekyc);
router.get("/tds-consent", authMiddleware.verifyToken, kycController.tdsConsent);
router.post("/updateKycRecords", authMiddleware.verifyToken, kycController.updateKycRecords);
router.post("/update-profile-image", authMiddleware.verifyToken, fileMiddleware.acceptSingleFile('user-profile'), kycController.updateProfileImage);
router.post("/purchase-retailers", authMiddleware.verifyToken, kycController.createPurchasingRetailer);
router.put("/purchase-retailers", authMiddleware.verifyToken, kycController.editPurchasingRetailer);
router.get("/purchase-retailers", authMiddleware.verifyToken, kycController.listPurchasingRetailers);
router.get("/retailer-workshop-mappings", authMiddleware.verifyToken, kycController.getRetailerWorkshopMappings);
router.put("/retailer-workshop-mappings", authMiddleware.verifyToken, kycController.mapRetailerWorkshop);


export default router;
