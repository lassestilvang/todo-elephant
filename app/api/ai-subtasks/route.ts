import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
});

interface SubtaskRequest {
  title: string;
  priority?: "low" | "medium" | "high";
}

interface Subtask {
  id: string;
  title: string;
  description?: string;
  estimatedMinutes?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: SubtaskRequest = await request.json();
    const { title, priority = "medium" } = body;

    if (!title || title.trim().length < 2) {
      return NextResponse.json(
        { error: "Task title is required" },
        { status: 400 }
      );
    }

    const prompt = `
Break down the following task into 3-5 actionable subtasks:

Task: "${title}"
Priority: ${priority}

Requirements:
- Each subtask should be a specific, actionable step
- Subtasks should be in logical order
- Include estimated time in minutes for each
- Keep subtasks concise (under 100 characters each)

Return ONLY valid JSON with this structure:
{
  "subtasks": [
    {"title": "...", "description": "...", "estimatedMinutes": N},
    ...
  ]
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "You are a task breakdown expert. Break down tasks into clear, actionable subtasks. Return only valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const content = response.choices[0].message.content || "{}";
    const data = JSON.parse(content);

    // Add IDs to subtasks
    const subtasks: Subtask[] = (data.subtasks || []).map((sub: any, index: number) => ({
      id: `sub-${Date.now()}-${index}`,
      title: sub.title,
      description: sub.description,
      estimatedMinutes: sub.estimatedMinutes,
    }));

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error("AI subtasks error:", error);

    // Fallback suggestions based on task title
    const fallbackSubtasks = generateFallbackSubtasks(title, priority);
    return NextResponse.json({ subtasks: fallbackSubtasks });
  }
}

function generateFallbackSubtasks(
  title: string,
  priority: "low" | "medium" | "high"
): any[] {
  const baseSubtasks = [
    {
      id: `sub-${Date.now()}-1`,
      title: `Research and plan: ${title}`,
      description: "Gather information and create a plan of action",
      estimatedMinutes: priority === "high" ? 15 : 30,
    },
    {
      id: `sub-${Date.now()}-2`,
      title: `Execute: ${title}`,
      description: "Complete the main work for this task",
      estimatedMinutes: priority === "high" ? 45 : 60,
    },
    {
      id: `sub-${Date.now()}-3`,
      title: `Review and finalize: ${title}`,
      description: "Check quality and mark as complete",
      estimatedMinutes: 10,
    },
  ];

  return baseSubtasks;
}