import type { Task } from './types';

// AI service — fully optional. Works without any external API key.
// If VITE_OPENAI_API_KEY is set, the task-description generator will call an
// OpenAI-compatible endpoint. Otherwise it falls back to a template generator
// built from the task title and priority. The overdue recommendations are
// always computed locally from the task list.

const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY as string | undefined;

export async function generateTaskDescription(title: string, priority: string): Promise<string> {
  if (OPENAI_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You write concise, professional task descriptions for a project management tool. 2-4 sentences. No headings.',
            },
            { role: 'user', content: `Task title: "${title}". Priority: ${priority}.` },
          ],
          temperature: 0.6,
          max_tokens: 160,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json?.choices?.[0]?.message?.content?.trim();
        if (text) return text;
      }
    } catch {
      // fall through to local generator
    }
  }
  return localDescription(title, priority);
}

function localDescription(title: string, priority: string): string {
  const prio = priority.toLowerCase();
  const urgency =
    prio === 'high' ? 'This is a high-priority item and should be started promptly.' : prio === 'low' ? 'There is no immediate urgency; schedule when capacity allows.' : 'Plan this within the current sprint cycle.';
  return `Implement and validate "${title}". Define acceptance criteria, coordinate with stakeholders, and confirm the outcome meets the agreed standard. ${urgency}`;
}

export interface Recommendation {
  taskId: string;
  title: string;
  reason: string;
  suggestion: string;
}

export function recommendOverdueActions(tasks: Task[]): Recommendation[] {
  const today = new Date().toISOString().slice(0, 10);
  return tasks
    .filter((t) => t.due_date && t.due_date < today && t.status !== 'Completed')
    .map((t) => {
      const daysLate = Math.max(
        1,
        Math.round((new Date(today).getTime() - new Date(t.due_date!).getTime()) / 86400000),
      );
      let suggestion: string;
      if (daysLate >= 7) suggestion = 'Reassign or split into smaller subtasks; risk of stalling is high.';
      else if (t.status === 'Pending') suggestion = 'Escalate to the assignee and set a revised due date within 2 days.';
      else suggestion = 'Check blockers with the assignee and confirm a completion date this week.';
      return {
        taskId: t.id,
        title: t.title,
        reason: `Overdue by ${daysLate} day${daysLate === 1 ? '' : 's'} (due ${t.due_date}).`,
        suggestion,
      };
    });
}
