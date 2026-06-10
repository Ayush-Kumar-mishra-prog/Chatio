export const MIRROR_AI_ID = "mirror-ai";

export const isMirrorAi = (chat) =>
  chat?.type === "mirror-ai" || chat?._id === MIRROR_AI_ID;

export const buildMirrorAiChat = (profilePic) => ({
  _id: MIRROR_AI_ID,
  type: "mirror-ai",
  fullName: "MirrorAI",
  name: "MirrorAI",
  profilePic,
  bio: "AI assistant · Always available",
});

const storageKey = (userId) => `chatio_mirror_ai_${userId}`;

export const loadMirrorAiMessages = (userId) => {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveMirrorAiMessages = (userId, messages) => {
  localStorage.setItem(storageKey(userId), JSON.stringify(messages));
};

export const getMirrorAiPreview = (userId) => {
  const messages = loadMirrorAiMessages(userId);
  const last = messages.at(-1);
  if (!last) return "Ask me anything";
  return last.text?.slice(0, 60) || "Message";
};
