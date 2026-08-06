export type QueueStatus = 'Queued' | 'Processing' | 'Sent' | 'Failed' | 'Retrying' | 'DeadLetter';
export type DeliveryStatus = 'Sent' | 'Failed' | 'Retrying' | 'DeadLetter';
export type PlatformType = 'android' | 'ios' | 'web';

export interface TokenRegistrationDto {
  userId: string;
  deviceToken: string;
  platform: PlatformType;
  appVersion?: string;
}
