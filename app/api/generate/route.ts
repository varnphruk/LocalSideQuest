import { NextRequest, NextResponse } from "next/server";

// This runs on the SERVER only. The API key never reaches the browser.
export async function POST(req: NextRequest) {
  try {
    const { prompt, systemPrompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY not configured. Add it in Vercel Environment Variables." },
        { status: 500 }
      );
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.7,
        max_tokens: 6000,
        messages: [
          {
            role: "system",
            content:
              systemPrompt ||
              "You are a world-class travel agent. Output ONLY valid JSON. No markdown, no backticks, no text outside the JSON object. Local friend voice. Specific dishes, honest takes, neighborhood logic.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("OpenAI API error:", res.status, errText);
      return NextResponse.json(
        { error: `OpenAI API returned ${res.status}: ${errText.slice(0, 200)}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Extract the text content from OpenAI's response format
    const text = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ text });
  } catch (err: any) {
    console.error("Generate API error:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
