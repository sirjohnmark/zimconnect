import { z } from "zod";

export const startConversationSchema = z.object({
  body:      z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  listing_id: z.string().uuid("Invalid listing"),
  seller_id:  z.string().uuid("Invalid seller"),
});

export const sendMessageSchema = z.object({
  body:            z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  conversation_id: z.string().uuid("Invalid conversation"),
});
