// Score mapping utilities for Tombola game

export interface ScoreInfo {
  label: string;
  description: string;
  emoji: string;
  color: string;
}

// Score level mapping - maps score numbers to their meanings
export const SCORE_MAPPING: Record<number, ScoreInfo> = {
  2: {
    label: "2 in Line",
    description: "2 numbers in a line",
    emoji: "📍",
    color: "#17a2b8"
  },
  3: {
    label: "3 in Line",
    description: "3 numbers in a line",
    emoji: "📌",
    color: "#28a745"
  },
  4: {
    label: "4 in Line",
    description: "4 numbers in a line",
    emoji: "🎯",
    color: "#ffc107"
  },
  5: {
    label: "5 in Line",
    description: "5 numbers in a line (Full Line)",
    emoji: "🏆",
    color: "#fd7e14"
  },
  15: {
    label: "BINGO!!!",
    description: "Full card completion",
    emoji: "🎉",
    color: "#dc3545"
  }
};

// Get score info by score number
export function getScoreInfo(score: number): ScoreInfo | null {
  return SCORE_MAPPING[score] || null;
}

// Get formatted score text
export function getScoreText(score: number): string {
  const info = getScoreInfo(score);
  if (!info) return `Score ${score}`;
  return `${info.emoji} ${info.label}`;
}

// Get score description
export function getScoreDescription(score: number): string {
  const info = getScoreInfo(score);
  if (!info) return `Achievement level ${score}`;
  return info.description;
}

// Get score color
export function getScoreColor(score: number): string {
  const info = getScoreInfo(score);
  return info?.color || "#6c757d";
}

// Get all available score levels (sorted)
export function getAllScoreLevels(): number[] {
  return Object.keys(SCORE_MAPPING).map(Number).sort((a, b) => a - b);
}

// Check if score is a major achievement (5 in line or BINGO)
export function isMajorAchievement(score: number): boolean {
  return score === 5 || score === 15;
}

// Check if score is BINGO
export function isBingo(score: number): boolean {
  return score === 15;
}

// Get the next score level after current score
export function getNextScoreLevel(currentScore: number): number | null {
  const levels = getAllScoreLevels();
  const nextLevel = levels.find(level => level > currentScore);
  return nextLevel || null;
}
