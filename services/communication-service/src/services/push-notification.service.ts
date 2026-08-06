import { FcmProvider } from "../providers/firebase/fcm.provider";
import { DeviceTokenRepository } from "../repositories/device-token.repository";
import { NotificationLogRepository } from "../repositories/notification-log.repository";
import { CommunicationEventPayload, PushPayload } from "../types";

export class PushNotificationService {
  private fcmProvider: FcmProvider;
  private deviceTokenRepo: DeviceTokenRepository;
  private notificationLogRepo: NotificationLogRepository;

  constructor() {
    this.fcmProvider = FcmProvider.getInstance();
    this.deviceTokenRepo = new DeviceTokenRepository();
    this.notificationLogRepo = new NotificationLogRepository();
  }

  public async processPushEvent(event: CommunicationEventPayload<PushPayload>): Promise<void> {
    const payload = event.payload;
    let targetTokens: string[] = payload.deviceTokens || [];

    // If no tokens explicitly passed, resolve active tokens for recipientId
    if (targetTokens.length === 0 && event.recipientId) {
      const tokensFromDb = await this.deviceTokenRepo.findActiveTokensByUserId(event.recipientId);
      targetTokens = tokensFromDb.map((t: any) => t.deviceToken);
    }

    if (targetTokens.length === 0) {
      await this.notificationLogRepo.create({
        recipientId: event.recipientId,
        notificationType: "PUSH",
        provider: "FCM",
        title: payload.title,
        message: payload.body,
        payload: payload as any,
        status: "Failed",
        errorMessage: "No valid device tokens found for recipient",
        sentAt: new Date(),
      });
      throw new Error("No device tokens available for recipient");
    }

    const result = await this.fcmProvider.sendPushNotification(payload, targetTokens);

    // Deactivate invalid tokens if reported by FCM
    if (result.invalidTokens.length > 0) {
      await this.deviceTokenRepo.deactivateInvalidTokens(result.invalidTokens);
    }

    if (result.successCount > 0) {
      await this.notificationLogRepo.create({
        recipientId: event.recipientId,
        notificationType: "PUSH",
        provider: "FCM",
        title: payload.title,
        message: payload.body,
        payload: payload as any,
        status: "Sent",
        providerMessageId: result.messageIds.join(", "),
        sentAt: new Date(),
      });
    } else {
      const errorMsg = result.error || "Failed to send FCM push notification to any device";
      await this.notificationLogRepo.create({
        recipientId: event.recipientId,
        notificationType: "PUSH",
        provider: "FCM",
        title: payload.title,
        message: payload.body,
        payload: payload as any,
        status: "Failed",
        errorMessage: errorMsg,
        sentAt: new Date(),
      });
      throw new Error(errorMsg);
    }
  }
}
