import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { env as privateEnv } from "$env/dynamic/private";

export async function POST(event: RequestEvent) {
  const session = event.locals.session;
  if (!session?.user) {
    return json({ error: "Authentication required" }, { status: 401 });
  }
  const role =
    (session.user.user_metadata?.role as string) ?? (session.user.app_metadata?.role as string);
  if (role !== "admin") {
    return json({ error: "Admin access required" }, { status: 403 });
  }
  const request = event.request;
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return json({ error: "Missing imageBase64 field" }, { status: 400 });
    }

    const openRouterKey = privateEnv.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      return json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
    }

    let mimeType = "image/jpeg";
    let rawBase64 = imageBase64;
    if (imageBase64.startsWith("data:")) {
      const match = imageBase64.match(/^data:(image\/\w+);base64,/);
      if (match) {
        mimeType = match[1];
        rawBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      }
    }

    const payload = {
      model: "google/gemini-2.0-flash-001",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${rawBase64}`,
              },
            },
            {
              type: "text",
              text: `You are an AI assistant for EcoPlate, a campus food rescue program at UC Irvine.

Analyze this photo of dining hall food and return a JSON object with:
1. "description": A concise, appetizing 1-2 sentence description of what's in the photo suitable for a Rescue Box listing. Include the station type (e.g., "Pasta bar:", "Stir-fry station:", "Grill station:") followed by specific items.
2. "suggestedBoxes": Estimated number of Rescue Boxes that could be made from what you see (integer between 5-30).
3. "suggestedPriceMin": Suggested minimum price in dollars (integer, typically 3-4).
4. "suggestedPriceMax": Suggested maximum price in dollars (integer, typically 4-5).
5. "tags": Array of relevant dietary tags from: ["Vegetarian", "Vegan", "Gluten-Free", "High Protein", "Dairy-Free"].

Return ONLY valid JSON, no markdown fences, no explanation.`,
            },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    };

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openRouterKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.log("OpenRouter API error:", response.status, errText);
      return json(
        { error: `AI analysis failed (${response.status}): ${errText}` },
        { status: 502 }
      );
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content ?? "";
    console.log("AI raw response:", content);

    let parsed;
    try {
      const cleaned = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch (parseErr) {
      console.log("Failed to parse AI response as JSON:", parseErr, "raw:", content);
      return json(
        {
          error: "AI returned invalid JSON",
          raw: content,
        },
        { status: 502 }
      );
    }

    return json({
      description: parsed.description ?? "",
      suggestedBoxes: Math.min(30, Math.max(1, parseInt(parsed.suggestedBoxes) || 15)),
      suggestedPriceMin: Math.max(1, parseInt(parsed.suggestedPriceMin) || 3),
      suggestedPriceMax: Math.max(1, parseInt(parsed.suggestedPriceMax) || 5),
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    });
  } catch (e) {
    console.log("Error in analyze-food-photo:", e);
    return json({ error: `Failed to analyze photo: ${e}` }, { status: 500 });
  }
}
