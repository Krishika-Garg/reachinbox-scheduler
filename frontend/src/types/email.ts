export interface Email {
  id: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAt: string;
  status: "scheduled" | "processing" | "sent" | "failed";
  sentAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}