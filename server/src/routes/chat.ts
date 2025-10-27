import { Router } from "express";
import { z } from "zod";

const router = Router();

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string()
});

const ChatPayloadSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1)
});

router.post("/", (req, res, next) => {
  try {
    const payload = ChatPayloadSchema.parse(req.body);
    const lastUserMessage = [...payload.messages]
      .reverse()
      .find((message) => message.role === "user");

    const reply = lastUserMessage
      ? `Thanks! I noted: "${lastUserMessage.content.slice(0, 200)}". Let me refine the gift ideas.`
      : "Happy to keep ideating whenever you're ready.";

    res.json({ reply });
  } catch (error) {
    next(error);
  }
});

export default router;
