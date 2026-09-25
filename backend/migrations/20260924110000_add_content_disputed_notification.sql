-- Add CONTENT_DISPUTED to NotificationType enum if not exists
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'CONTENT_DISPUTED';
