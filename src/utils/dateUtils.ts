export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatRelative(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
  return formatDate(isoString);
}

export function isToday(isoString: string): boolean {
  const date = new Date(isoString);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

export function isYesterday(isoString: string): boolean {
  const date = new Date(isoString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
}

export function isThisWeek(isoString: string): boolean {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays < 7 && diffDays > 1;
}

export function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours}h ${minutes}min`;
  return `${minutes}min`;
}

export function getReadingStreak(sessions: { date: string }[]): number {
  if (sessions.length === 0) return 0;
  const uniqueDays = [...new Set(sessions.map(s => new Date(s.date).toDateString()))];
  uniqueDays.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  let streak = 0;
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let expected = uniqueDays[0] === today ? new Date() : new Date(Date.now() - 86400000);
  for (const day of uniqueDays) {
    if (day === expected.toDateString()) {
      streak++;
      expected = new Date(expected.getTime() - 86400000);
    } else {
      break;
    }
  }
  return streak;
}
