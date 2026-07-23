const NIM_API_KEY = import.meta.env.VITE_NVIDIA_NIM_API_KEY;
const NIM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const MODEL = 'meta/llama-3.1-70b-instruct';

const SYSTEM_PROMPT = `You are a calisthenics and fitness routine builder AI. When a user asks for a routine, respond with ONLY a JSON object (no markdown, no explanation) in this exact format:

{
  "routine_name": "Routine Name",
  "exercises": [
    {
      "name": "Exercise Name",
      "exercise_type": "bodyweight|weighted|assisted|duration|static_hold",
      "sets": 3,
      "reps": 10,
      "duration_seconds": null,
      "rest_seconds": 90
    }
  ]
}

Rules:
- exercise_type must be one of: bodyweight, weighted, assisted, duration, static_hold
- For duration/static_hold exercises, use duration_seconds instead of reps (set reps to null)
- For rep-based exercises, set duration_seconds to null
- Include 4-8 exercises per routine
- Use proper calisthenics exercise names
- rest_seconds between 60-180 depending on intensity

If the user asks a general question (not requesting a routine), respond normally in plain text. Only output JSON when they're clearly requesting a routine to be created.`;

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GeneratedRoutine {
  routine_name: string;
  exercises: {
    name: string;
    exercise_type: string;
    sets: number;
    reps: number | null;
    duration_seconds: number | null;
    rest_seconds: number;
  }[];
}

export async function sendChatMessage(messages: AIMessage[]): Promise<string> {
  const response = await fetch(NIM_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NIM_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI request failed: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export function parseRoutineFromResponse(content: string): GeneratedRoutine | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*"routine_name"[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]) as GeneratedRoutine;
  } catch {
    return null;
  }
}
