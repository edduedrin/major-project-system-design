export type NotificationType = 'PUSH' | 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';
export type EventPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface CommunicationEventPayload<T = any> {
  eventId: string;
  eventType: string;
  notificationType: NotificationType;
  recipientId: string;
  priority?: EventPriority;
  payload: T;
  createdAt: string;
  retryCount?: number;
}

export interface PushPayload {
  title: string;
  body: string;
  imageUrl?: string;
  clickAction?: string;
  deviceTokens?: string[];
  data?: Record<string, string>;
}

export interface EmailPayload {
  to: string[];
  subject?: string;
  template: string;
  variables: Record<string, any>;
  attachments?: Array<{ filename: string; content?: string; path?: string }>;
}
