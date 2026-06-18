import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import { env as privateEnv } from "$env/dynamic/private";
import { requireAdmin } from "$lib/server/auth";

export async function POST(event: RequestEvent) {
  const denied = requireAdmin(event);
  if (denied) return denied;
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
      model: "google/gemini-3-flash-preview",
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
              text: `You are an AI assistant for EcoPlate, a food rescue program serving dining halls at the University of Michigan.

Analyze this photo of dining hall food and return a JSON object with ALL of the following fields:
1. "description": A concise, appetizing 1-2 sentence description suitable for a Fresh Box listing. Include the station type (e.g., "Pasta bar:", "Stir-fry station:", "Grill station:") followed by specific items visible.
2. "suggestedBoxes": Estimated number of Fresh Boxes that could be made from the quantity visible. Use these as a guide: full hotel/steam tray ≈ 15–20 boxes, half tray ≈ 8–10 boxes, smaller dish or partial tray ≈ 5–7 boxes. Return an integer between 5–30.
3. "suggestedPriceMin": Always 7.
4. "suggestedPriceMax": Always 7.
5. "tags": Array of relevant dietary tags from: ["Vegetarian", "Vegan", "Gluten-Free", "High Protein", "Dairy-Free"].
6. "allergens": Array of allergens you can visually confirm or reasonably infer from the dish type and visible ingredients. Do NOT guess — only include what is evident from what you see or standard recipe knowledge for this dish. If a dish is ambiguous and you cannot confidently confirm an allergen, omit it. Choose from: ["Dairy", "Eggs", "Tree Nuts", "Peanuts", "Soy", "Gluten", "Shellfish", "Fish", "Sesame"].
7. "calories": Estimated calorie range per serving, where one serving ≈ 500g or a standard takeout container. Return as object: { "min": integer, "max": integer }.
8. "macros": Estimated grams per serving (same ≈ 500g serving as calories): { "protein": integer, "carbs": integer, "fat": integer }.

Return ONLY valid JSON, no markdown fences, no explanation.`,
            },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
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
      suggestedPriceMin: 7,
      suggestedPriceMax: 7,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
      allergens: Array.isArray(parsed.allergens) ? parsed.allergens : [],
      calories:
        parsed.calories && typeof parsed.calories === "object"
          ? { min: parseInt(parsed.calories.min) || 0, max: parseInt(parsed.calories.max) || 0 }
          : null,
      macros:
        parsed.macros && typeof parsed.macros === "object"
          ? {
              protein: parseInt(parsed.macros.protein) || 0,
              carbs: parseInt(parsed.macros.carbs) || 0,
              fat: parseInt(parsed.macros.fat) || 0,
            }
          : null,
    });
  } catch (e) {
    console.log("Error in analyze-food-photo:", e);
    return json({ error: `Failed to analyze photo: ${e}` }, { status: 500 });
  }
}
