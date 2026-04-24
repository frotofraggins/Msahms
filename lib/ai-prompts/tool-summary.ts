/**
 * Tool summary prompt — generates "What This Means For You" plain-English summaries.
 *
 * Temperature: 0.3 | Max tokens: 150
 */

export interface ToolSummaryInput {
  toolName: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
  userContext?: string;
}

export interface ToolSummaryOutput {
  summary: string;
  nextStep: string;
  wordCount: number;
}

export function buildToolSummaryPrompt(input: ToolSummaryInput): {
  system: string;
  user: string;
} {
  const system = `You are a real estate advisor summarizing tool results for a Mesa, AZ homeowner or buyer.

RULES:
- Output ONLY valid JSON: {"summary": "...", "nextStep": "...", "wordCount": N}
- summary: 2-3 sentences, plain English, no jargon
- nextStep: one concrete action the user should take next
- Reference the actual numbers from the results
- Never give legal or financial advice — frame as "based on these numbers"
- Be honest about uncertainty — if the data suggests waiting, say so`;

  const user = `Summarize the results of the ${input.toolName} tool:
Inputs: ${JSON.stringify(input.inputs)}
Results: ${JSON.stringify(input.results)}
${input.userContext ? `Context: ${input.userContext}` : ''}

Output JSON only.`;

  return { system, user };
}

export function validateToolSummaryOutput(output: unknown): string | null {
  if (!output || typeof output !== 'object') return 'Output is not an object';
  const o = output as Record<string, unknown>;
  if (typeof o.summary !== 'string') return 'Missing summary field';
  if (typeof o.nextStep !== 'string') return 'Missing nextStep field';
  if (o.summary.length < 20) return 'Summary too short';
  return null;
}
