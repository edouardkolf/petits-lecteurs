// Illustration d'une difficulté pour un jeu (écran de choix) : SVG décoratif, déduit des vrais paramètres.
import type { PuzzlePreset } from '../../socle/storage/puzzles';
import type { HubPuzzleId } from './presets';
import { mazePreview, memoryPreview, orderPreview, robotPreview } from './previewGeometry';

const STAR_PATH = 'M0 -9l2.6 5.6 6 .7-4.5 4 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.5-4 6-.7z';
const BAR_COLORS = ['#4aa3e8', '#ffc93c', '#e63946', '#5fb85a'];

export function PresetPreview({ game, preset }: { game: HubPuzzleId; preset: PuzzlePreset }) {
  if (game === 'memory') return <MemoryDrawing preset={preset} />;
  if (game === 'order') return <OrderDrawing preset={preset} />;
  if (game === 'maze') return <MazeDrawing preset={preset} />;
  return <RobotDrawing preset={preset} />;
}

function MemoryDrawing({ preset }: { preset: PuzzlePreset }) {
  const { cols, rows, count } = memoryPreview(preset);
  const w = 30;
  const h = 42;
  const gap = 8;
  const width = cols * w + (cols - 1) * gap;
  const height = rows * h + (rows - 1) * gap;
  return (
    <svg class="puzzle-preview" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      {Array.from({ length: count }, (_, i) => {
        const x = (i % cols) * (w + gap);
        const y = Math.floor(i / cols) * (h + gap);
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx="6" fill="#8a7ce8" stroke="#fff" stroke-width="1.5" />
            <path transform={`translate(${x + w / 2} ${y + h / 2})`} d={STAR_PATH} fill="#fff6c9" />
          </g>
        );
      })}
    </svg>
  );
}

function OrderDrawing({ preset }: { preset: PuzzlePreset }) {
  const { heights } = orderPreview(preset);
  const w = 26;
  const gap = 10;
  const max = 100;
  const width = heights.length * w + (heights.length - 1) * gap;
  return (
    <svg class="puzzle-preview" viewBox={`0 0 ${width} ${max}`} aria-hidden="true" focusable="false">
      {heights.map((hf, i) => {
        const h = Math.round(max * (0.25 + 0.75 * hf));
        return (
          <rect
            key={i}
            x={i * (w + gap)}
            y={max - h}
            width={w}
            height={h}
            rx="7"
            fill={BAR_COLORS[i % BAR_COLORS.length]}
          />
        );
      })}
    </svg>
  );
}

function MazeDrawing({ preset }: { preset: PuzzlePreset }) {
  const { size, path } = mazePreview(preset);
  const u = 28;
  const total = size * u;
  const pts = path.map((c) => `${c.col * u + u / 2},${c.row * u + u / 2}`).join(' ');
  const first = path[0];
  const last = path[path.length - 1];
  return (
    <svg class="puzzle-preview" viewBox={`0 0 ${total} ${total}`} aria-hidden="true" focusable="false">
      <rect width={total} height={total} rx="8" fill="#fffdf7" stroke="#e6dcc4" stroke-width="2" />
      {Array.from({ length: size - 1 }, (_, i) => (
        <g key={i} stroke="#e6dcc4" stroke-width="1.5">
          <line x1={(i + 1) * u} y1="0" x2={(i + 1) * u} y2={total} />
          <line x1="0" y1={(i + 1) * u} x2={total} y2={(i + 1) * u} />
        </g>
      ))}
      <polyline points={pts} fill="none" stroke="#5fb85a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
      {first && <circle cx={first.col * u + u / 2} cy={first.row * u + u / 2} r="8" fill="#e63946" />}
      {last && <circle cx={last.col * u + u / 2} cy={last.row * u + u / 2} r="8" fill="#1f78d1" />}
    </svg>
  );
}

function RobotDrawing({ preset }: { preset: PuzzlePreset }) {
  const { size, robot, target, obstacles } = robotPreview(preset);
  const u = 28;
  const total = size * u;
  const cx = (c: number) => c * u + u / 2;
  return (
    <svg class="puzzle-preview" viewBox={`0 0 ${total} ${total}`} aria-hidden="true" focusable="false">
      <rect width={total} height={total} rx="8" fill="#fffdf7" stroke="#e6dcc4" stroke-width="2" />
      {Array.from({ length: size - 1 }, (_, i) => (
        <g key={i} stroke="#e6dcc4" stroke-width="1.5">
          <line x1={(i + 1) * u} y1="0" x2={(i + 1) * u} y2={total} />
          <line x1="0" y1={(i + 1) * u} x2={total} y2={(i + 1) * u} />
        </g>
      ))}
      {obstacles.map((o, i) => (
        <rect key={i} x={o.col * u + 5} y={o.row * u + 5} width={u - 10} height={u - 10} rx="5" fill="#9a8f80" />
      ))}
      <rect x={target.col * u + 4} y={target.row * u + 4} width={u - 8} height={u - 8} rx="6" fill="#ffb347" />
      <circle cx={cx(robot.col)} cy={cx(robot.row)} r="9" fill="#8a7ce8" stroke="#fff" stroke-width="2" />
    </svg>
  );
}
