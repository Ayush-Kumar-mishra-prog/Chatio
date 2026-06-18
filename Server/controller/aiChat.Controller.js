



import ai from "../configs/ai.js";

export const textMessageController = async (req, res) => {
  try {
    const { prompt, history = [] } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are MirrorAI, a friendly AI assistant inside the Chatio chat app (similar to Meta AI on WhatsApp). Reply in clear, helpful, conversational text. Keep answers concise unless the user asks for detail.",
      },

      ...history
        .filter((item) => item?.text?.trim())
        .slice(-20)
        .map((item) => ({
          role: item.role === "assistant" ? "assistant" : "user",
          content: item.text.trim(),
        })),

      {
        role: "user",
        content: prompt.trim(),
      },
    ];

    const response = await ai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    });

    const replyText =
      response.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a response right now.";

    res.json({
      success: true,
      message: {
        role: "assistant",
        text: replyText,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("MirrorAI error:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};