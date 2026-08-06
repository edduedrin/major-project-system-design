import * as admin from "firebase-admin";
import { config } from "../../config";
import logger from "../../utils/logger";
import { PushPayload } from "../../types";

export interface FcmSendResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
  messageIds: string[];
  error?: string;
}

export class FcmProvider {
  private static instance: FcmProvider | null = null;
  private initialized = false;

  private constructor() {
    this.initFirebase();
  }

  public static getInstance(): FcmProvider {
    if (!FcmProvider.instance) {
      FcmProvider.instance = new FcmProvider();
    }
    return FcmProvider.instance;
  }

  private initFirebase(): void {
    if (admin.apps.length > 0) {
      this.initialized = true;
      return;
    }

    const { projectId, clientEmail, privateKey } = config.firebase;
    if (projectId && clientEmail && privateKey) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
        this.initialized = true;
        logger.info("Firebase Admin SDK initialized successfully ✅");
      } catch (err: any) {
        logger.error("Failed to initialize Firebase Admin SDK ❌", { error: err.message });
      }
    } else {
      logger.warn("Firebase credentials not fully set. FCM push notifications will run in mock mode.");
    }
  }

  public async sendPushNotification(
    payload: PushPayload,
    tokens: string[]
  ): Promise<FcmSendResult> {
    const invalidTokens: string[] = [];
    const messageIds: string[] = [];

    // Validation: Empty tokens
    if (!tokens || tokens.length === 0) {
      return {
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
        messageIds: [],
        error: "No device tokens provided",
      };
    }

    // Filter empty string tokens
    const validTokens = tokens.filter((t) => typeof t === "string" && t.trim().length > 0);
    if (validTokens.length === 0) {
      return {
        successCount: 0,
        failureCount: tokens.length,
        invalidTokens: tokens,
        messageIds: [],
        error: "All provided device tokens were empty or invalid format",
      };
    }

    if (!this.initialized) {
      logger.warn(`Mocking FCM push notification to ${validTokens.length} token(s). Payload: ${JSON.stringify(payload)}`);
      return {
        successCount: validTokens.length,
        failureCount: 0,
        invalidTokens: [],
        messageIds: validTokens.map((_, i) => `mock-fcm-msg-id-${Date.now()}-${i}`),
      };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: validTokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl || undefined,
        },
        data: payload.data || {},
        android: {
          notification: {
            clickAction: payload.clickAction || undefined,
          },
        },
        apns: {
          payload: {
            aps: {
              category: payload.clickAction || undefined,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      response.responses.forEach((resp: any, idx: number) => {
        if (resp.success) {
          if (resp.messageId) messageIds.push(resp.messageId);
        } else {
          const errCode = resp.error?.code;
          logger.error(`FCM message failed for token ${validTokens[idx]}: ${resp.error?.message} [code: ${errCode}]`);
          if (
            errCode === "messaging/invalid-registration-token" ||
            errCode === "messaging/registration-token-not-registered"
          ) {
            invalidTokens.push(validTokens[idx]);
          }
        }
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        invalidTokens,
        messageIds,
      };
    } catch (error: any) {
      logger.error("Error sending FCM notification", { error: error.message });
      return {
        successCount: 0,
        failureCount: validTokens.length,
        invalidTokens: [],
        messageIds: [],
        error: error.message,
      };
    }
  }
}
