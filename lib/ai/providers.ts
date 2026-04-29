type AIProvider = "openai" | "anthropic";

export type AIMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function getProvider() {
  const provider = (process.env.AI_PROVIDER ?? "openai").toLowerCase();
  return (provider === "anthropic" ? "anthropic" : "openai") as AIProvider;
}

async function callOpenAI(messages: AIMessage[]) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured.");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages,
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed: ${response.status} ${errorBody}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(messages: AIMessage[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");

  const system = messages.find((message) => message.role === "system")?.content ?? "";
  const prompt = messages
    .filter((message) => message.role !== "system")
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Anthropic request failed: ${response.status} ${errorBody}`);
  }

  const json = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  return json.content?.find((chunk) => chunk.type === "text")?.text ?? "";
}

export async function runAI(messages: AIMessage[]) {
  const provider = getProvider();
  if (provider === "anthropic") return callAnthropic(messages);
  return callOpenAI(messages);
}
