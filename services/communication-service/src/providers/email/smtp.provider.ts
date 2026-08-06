import nodemailer, { Transporter } from "nodemailer";
import { config } from "../../config";
import logger from "../../utils/logger";

export interface SendEmailOptions {
  to: string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{ filename: string; content?: string; path?: string }>;
}

export interface SmtpSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class SmtpProvider {
  private static instance: SmtpProvider | null = null;
  private transporter: Transporter;

  private constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: config.smtp.user
        ? {
            user: config.smtp.user,
            pass: config.smtp.pass,
          }
        : undefined,
    });
  }

  public static getInstance(): SmtpProvider {
    if (!SmtpProvider.instance) {
      SmtpProvider.instance = new SmtpProvider();
    }
    return SmtpProvider.instance;
  }

  public async sendEmail(options: SendEmailOptions): Promise<SmtpSendResult> {
    if (!options.to || options.to.length === 0) {
      return { success: false, error: "No email recipients specified" };
    }

    if (!config.smtp.user) {
      logger.warn(`SMTP user not set. Mocking email delivery to: ${options.to.join(", ")} | Subject: ${options.subject}`);
      return {
        success: true,
        messageId: `mock-email-msg-id-${Date.now()}`,
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: config.smtp.from,
        to: options.to.join(", "),
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      });

      logger.info(`Email sent successfully: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      logger.error("Failed to send email via SMTP", { error: error.message });
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
