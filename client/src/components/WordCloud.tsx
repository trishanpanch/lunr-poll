/**
 * WordCloud.tsx
 *
 * Renders a word-frequency cloud for Short Text responses using d3-cloud.
 * Words are sized by frequency; common stop-words are filtered out.
 */

import { useEffect, useRef, useState } from "react";
import cloud from "d3-cloud";

// ── Stop-words ────────────────────────────────────────────────────────────────
const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would",
  "could", "should", "may", "might", "shall", "can", "that", "this",
  "these", "those", "it", "its", "i", "we", "you", "he", "she", "they",
  "me", "us", "him", "her", "them", "my", "our", "your", "his", "their",
  "what", "which", "who", "how", "when", "where", "why", "not", "no",
  "so", "if", "as", "up", "out", "about", "into", "than", "then",
  "also", "just", "more", "very", "much", "such", "like", "well",
]);

// ── Colour palette ────────────────────────────────────────────────────────────
const PALETTE = [
  "oklch(0.55 0.2 250)",   // indigo
  "oklch(0.52 0.18 160)",  // green
  "oklch(0.52 0.22 290)",  // purple
  "oklch(0.62 0.18 60)",   // amber
  "oklch(0.514 0.2 13.9)", // crimson
  "oklch(0.48 0.18 200)",  // teal
  "oklch(0.58 0.2 330)",   // pink
];

// ── Word frequency builder ────────────────────────────────────────────────────
function buildFrequency(texts: string[]): Array<{ text: string; value: number }> {
  const freq: Record<string, number> = {};
  for (const t of texts) {
    const words = t
      .toLowerCase()
      .replace(/[^a-z0-9\s'-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
    for (const w of words) {
      freq[w] = (freq[w] ?? 0) + 1;
    }
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60)
    .map(([text, value]) => ({ text, value }));
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface CloudWord {
  text: string;
  value: number;
  x?: number;
  y?: number;
  size?: number;
  rotate?: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function WordCloud({
  responses,
  width = 520,
  height = 260,
}: {
  responses: string[];
  width?: number;
  height?: number;
}) {
  const [words, setWords] = useState<CloudWord[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (responses.length === 0) {
      setWords([]);
      return;
    }

    const freq = buildFrequency(responses);
    if (freq.length === 0) {
      setWords([]);
      return;
    }

    const maxVal = freq[0]?.value ?? 1;
    const minVal = freq[freq.length - 1]?.value ?? 1;
    const range = maxVal - minVal || 1;

    const MIN_FONT = 12;
    const MAX_FONT = 52;

    const layout = cloud<CloudWord>()
      .size([width, height])
      .words(
        freq.map((d) => ({
          ...d,
          size: MIN_FONT + ((d.value - minVal) / range) * (MAX_FONT - MIN_FONT),
        }))
      )
      .padding(4)
      .rotate(() => (Math.random() > 0.7 ? (Math.random() > 0.5 ? 90 : -90) : 0))
      .font("'Geist', system-ui, sans-serif")
      .fontSize((d: CloudWord) => d.size ?? MIN_FONT)
      .on("end", (placed: CloudWord[]) => setWords(placed));

    layout.start();
  }, [responses, width, height]);

  if (responses.length === 0) {
    return (
      <p style={{ fontSize: 13, color: "oklch(0.556 0 0)", margin: 0 }}>
        No text responses yet.
      </p>
    );
  }

  return (
    <div ref={containerRef} style={{ width, height, position: "relative", overflow: "hidden" }}>
      <svg width={width} height={height}>
        <g transform={`translate(${width / 2},${height / 2})`}>
          {words.map((w, i) => (
            <text
              key={w.text}
              style={{
                fontSize: w.size,
                fontFamily: "'Geist', system-ui, sans-serif",
                fontWeight: (w.value ?? 1) > 2 ? 700 : 500,
                fill: PALETTE[i % PALETTE.length],
                cursor: "default",
                userSelect: "none",
              }}
              textAnchor="middle"
              transform={`translate(${w.x ?? 0},${w.y ?? 0}) rotate(${w.rotate ?? 0})`}
            >
              {w.text}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}
