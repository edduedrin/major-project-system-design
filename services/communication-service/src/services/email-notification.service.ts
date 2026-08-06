import { SmtpProvider } from "../providers/email/smtp.provider";
import { TemplateService } from "./template.service";
import { NotificationLogRepository } from "../repositories/notification-log.repository";
import { CommunicationEventPayload, EmailPayload } from "../types";

export class EmailNotificationService {
  private smtpProvider: SmtpProvider;
  private templateService: TemplateService;
  private notificationLogRepo: NotificationLogRepository;

  constructor() {
    this.smtpProvider = SmtpProvider.getInstance();
    this.templateService = new TemplateService();
    this.notificationLogRepo = new NotificationLogRepository();
  }

  public async processEmailEvent(event: CommunicationEventPayload<EmailPayload>): Promise<void> {
    const payload = event.payload;

    if (!payload.to || payload.to.length === 0) {
      await this.notificationLogRepo.create({
        recipientId: event.recipientId,
        notificationType: "EMAIL",
        provider: "SMTP",
        subject: payload.subject || event.eventType,
        payload: payload as any,
        status: "Failed",
        errorMessage: "No email recipients provided",
        sentAt: new Date(),
      });
      throw new Error("No email recipients specified");
    }

    // Render HTML and subject dynamically using Handlebars
    const rendered = await this.templateService.renderEmailTemplate(
      payload.template,
      payload.variables || {},
      payload.subject
    );

    const result = await this.smtpProvider.sendEmail({
      to: payload.to,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      attachments: payload.attachments,
    });

    if (result.success) {
      await this.notificationLogRepo.create({
        recipientId: event.recipientId,
        notificationType: "EMAIL",
        provider: "SMTP",
        subject: rendered.subject,
        message: rendered.text || rendered.html,
        payload: payload as any,
        status: "Sent",
        providerMessageId: result.messageId,
        sentAt: new Date(),
      });
    } else {
      const errorMsg = result.error || "Failed to send email via SMTP";
      await this.notificationLogRepo.create({
        recipientId: event.recipientId,
        notificationType: "EMAIL",
        provider: "SMTP",
        subject: rendered.subject,
        message: rendered.text || rendered.html,
        payload: payload as any,
        status: "Failed",
        errorMessage: errorMsg,
        sentAt: new Date(),
      });
      throw new Error(errorMsg);
    }
  }
}
