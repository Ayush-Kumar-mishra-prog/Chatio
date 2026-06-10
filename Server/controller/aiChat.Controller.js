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

    const contents = [
      ...history
        .filter((item) => item?.text?.trim())
        .slice(-20)
        .map((item) => ({
          role: item.role === "user" ? "user" : "model",
          parts: [{ text: item.text.trim() }],
        })),
      { role: "user", parts: [{ text: prompt.trim() }] },
    ];

    const response = await ai.models.generateContent({
      model:"gemini-3.5-flash",
      contents,
      config: {
        systemInstruction:
          "You are MirrorAI, a friendly AI assistant inside the Chatio chat app (similar to Meta AI on WhatsApp). Reply in clear, helpful, conversational text. Keep answers concise unless the user asks for detail.",
      },
    });

    const replyText =
      response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
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
