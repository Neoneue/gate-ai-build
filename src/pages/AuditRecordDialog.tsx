import { BookOpen, CircleCheck, Copy, Expand, ExternalLink, Minus, Plus } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogScrollBody,
  DialogScrollContent,
  DialogScrollFooter,
  DialogScrollHeader,
  DialogScrollSummary,
  DialogTitle,
  DialogTitleBlock,
} from '@/components/ui/dialog';
import { DetailList, DetailRow } from '@/components/ui/detail-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type EventRow,
  KIND_BADGE_VARIANT,
  fmtRelative,
  truncateHex,
} from './AuditTrail';
import { Timestamp } from '@/components/ui/timestamp';

/* ─────────────────────────────────────────────────────────────────────────
 * AuditRecordDialog — drill-in modal for a single audit event row.
 *
 * Scroll-shell pattern (DialogScrollContent):
 *   Header → Summary (verification banner) → Body (tabbed detail)
 *   → Footer (actions)
 *
 * Only the "Event" tab is built out; "Merkle path" and "How it works"
 * render as "Coming next" placeholders.
 * ───────────────────────────────────────────────────────────────────────── */

/* ─── Verification seal placeholder ──────────────────────────────────── */

/** Constellation Digital Evidence "Verified" badge — native asset at
 *  269×40. Rendered at `h-8` (32px) to fit the banner without dominating. */
function VerifiedBySeal() {
  return (
    <img
      src="/icons/de-verified-badge.svg"
      alt="Verified by Constellation Digital Evidence"
      className="h-6 w-auto self-start"
    />
  );
}

/* ─── Merkle path panel ───────────────────────────────────────────────── */

// ── FNV-1a 32-bit inline hash ─────────────────────────────────────────
// No external dependencies. Same input → same output, tree is stable.
function fnv32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // unsigned 32-bit
}

// 8-char hex from FNV-32
function fnv32Hex(input: string): string {
  return fnv32(input).toString(16).padStart(8, '0');
}

// Extended 16-char hex by hashing twice with salt
function fnv32HexLong(input: string): string {
  return fnv32Hex(input) + fnv32Hex(input + '_b');
}

// Binary string from the first byte of a hex string (e.g. "a3" → "10100011")
function hexFirstByteBinary(hex: string): string {
  const byte = parseInt(hex.slice(0, 2), 16);
  return byte.toString(2).padStart(8, '0');
}

// ── Tree constants ────────────────────────────────────────────────────
const TREE_DEPTH = 3; // L0=ROOT, L1, L2, L3 (leaves)
// Derived: 2^TREE_DEPTH leaves, TREE_DEPTH hash operations in a proof
const LEAF_COUNT = Math.pow(2, TREE_DEPTH); // 8

// ── SVG layout constants ──────────────────────────────────────────────
const VB_W = 760;
const VB_H = 372;
const NODE_W = 64;
const NODE_H = 32;
const NODE_RX = 6;
const ROOT_W = 80;
const Y: Record<number, number> = { 0: 48, 1: 148, 2: 238, 3: 332 };
const LEAF_PITCH = 88; // horizontal spacing between leaf centers

// Leaf centers (8 leaves, centered in VB_W)
function leafCX(index: number): number {
  const totalSpan = (LEAF_COUNT - 1) * LEAF_PITCH;
  const startX = (VB_W - totalSpan) / 2;
  return startX + index * LEAF_PITCH;
}

// L2 parent center = midpoint of its two children
function l2CX(index: number): number {
  return (leafCX(index * 2) + leafCX(index * 2 + 1)) / 2;
}

// L1 parent center = midpoint of its two children
function l1CX(index: number): number {
  return (l2CX(index * 2) + l2CX(index * 2 + 1)) / 2;
}

// ROOT center = midpoint of both L1 nodes
const ROOT_CX = (l1CX(0) + l1CX(1)) / 2;

// ── Node state types ──────────────────────────────────────────────────
type NodeState = 'root' | 'on-path' | 'off-leaf' | 'off-intermediate';

// ── Node descriptor ───────────────────────────────────────────────────
interface MerkleNodeData {
  id: string;         // "ROOT" | "H1"–"H6" | "D1"–"D8"
  role: string;       // human-readable: "Root", "On-path parent", etc.
  state: NodeState;
  cx: number;
  cy: number;
  hex8: string;       // 8-char hex for under-node label
  hexLong: string;    // 16-char hex for tooltip
  binary: string;     // 8-bit binary from first byte
}

// ── Build the full tree from a single EventRow ────────────────────────
function buildMerkleTree(row: EventRow): {
  nodes: MerkleNodeData[];
  targetIndex: number;
  onPathIds: Set<string>;
} {
  // Target leaf: FNV-32 of the full eventId, low 3 bits
  const targetIndex = fnv32(row.eventId) & 0b111;

  // Leaf hex for target = first 8 chars of eventId stripped of prefix/dashes
  const strippedId = row.eventId.replace(/^e_/, '').replace(/-/g, '');
  const targetLeafHex = strippedId.slice(0, 8).padEnd(8, '0');

  // ROOT hex = truncate of anchor (4+4 style, stripped of ellipsis)
  const anchorHex8 = row.anchor.slice(0, 8);

  // Determine on-path: leaf index → L2 parent index → L1 parent index → ROOT
  const onPathL2 = Math.floor(targetIndex / 2);
  const onPathL1 = Math.floor(targetIndex / 4);

  // Build leaves (L3): D1–D8
  const leafNodes: MerkleNodeData[] = [];
  for (let i = 0; i < LEAF_COUNT; i++) {
    const isTarget = i === targetIndex;
    const leafHex = isTarget
      ? targetLeafHex
      : fnv32Hex(row.anchor + '_leaf_' + i);
    leafNodes.push({
      id: `D${i + 1}`,
      role: isTarget ? 'Target leaf' : `Leaf D${i + 1}`,
      state: isTarget ? 'on-path' : 'off-leaf',
      cx: leafCX(i),
      cy: Y[3],
      hex8: leafHex,
      hexLong: isTarget ? strippedId.slice(0, 16).padEnd(16, '0') : fnv32HexLong(row.anchor + '_leaf_' + i),
      binary: hexFirstByteBinary(leafHex),
    });
  }

  // Build L2 nodes (H1–H4)
  const l2Nodes: MerkleNodeData[] = [];
  for (let i = 0; i < LEAF_COUNT / 2; i++) {
    const isOnPath = i === onPathL2;
    const l2Hex = fnv32Hex(row.anchor + '_l2_' + i);
    // Sibling of the on-path L2 node — pairs with it to compute the L1 parent.
    // onPathL2 XOR 1 gives the pair: (0,1), (1,0), (2,3), (3,2).
    const isSiblingToOnPath = !isOnPath && i === (onPathL2 ^ 1);
    l2Nodes.push({
      id: `H${i + 1}`,
      role: isOnPath
        ? `On-path parent (L2)`
        : isSiblingToOnPath
          ? `Sibling at L2 (${(onPathL2 & 1) === 0 ? 'right' : 'left'})`
          : `Intermediate H${i + 1}`,
      state: isOnPath ? 'on-path' : 'off-intermediate',
      cx: l2CX(i),
      cy: Y[2],
      hex8: l2Hex,
      hexLong: fnv32HexLong(row.anchor + '_l2_' + i),
      binary: hexFirstByteBinary(l2Hex),
    });
  }

  // Build L1 nodes (H5–H6)
  const l1Nodes: MerkleNodeData[] = [];
  for (let i = 0; i < LEAF_COUNT / 4; i++) {
    const isOnPath = i === onPathL1;
    const l1Hex = fnv32Hex(row.anchor + '_l1_' + i);
    l1Nodes.push({
      id: `H${i + 5}`,
      role: isOnPath ? `On-path parent (L1)` : `Intermediate H${i + 5}`,
      state: isOnPath ? 'on-path' : 'off-intermediate',
      cx: l1CX(i),
      cy: Y[1],
      hex8: l1Hex,
      hexLong: fnv32HexLong(row.anchor + '_l1_' + i),
      binary: hexFirstByteBinary(l1Hex),
    });
  }

  // ROOT node
  const rootNode: MerkleNodeData = {
    id: 'ROOT',
    role: 'Merkle root',
    state: 'root',
    cx: ROOT_CX,
    cy: Y[0],
    hex8: anchorHex8,
    hexLong: row.anchor.slice(0, 16),
    binary: hexFirstByteBinary(anchorHex8),
  };

  const nodes = [rootNode, ...l1Nodes, ...l2Nodes, ...leafNodes];

  // IDs of nodes on the proof path (for animation ordering)
  const onPathIds = new Set([
    'ROOT',
    l1Nodes[onPathL1].id,
    l2Nodes[onPathL2].id,
    leafNodes[targetIndex].id,
  ]);

  return { nodes, targetIndex, onPathIds };
}

// ── Build proof steps list ────────────────────────────────────────────
interface ProofStep {
  stepNum: number;
  leafLabel: string;
  sibLabel: string;
  resultHex: string;
  isRoot: boolean;
  sibSide: 'left' | 'right';
  levelLabel: string;
}

function buildProofSteps(row: EventRow, targetIndex: number): ProofStep[] {
  const strippedId = row.eventId.replace(/^e_/, '').replace(/-/g, '');
  const targetLeafHex = strippedId.slice(0, 8).padEnd(8, '0');

  const steps: ProofStep[] = [];

  // Level 2 (L3→L2): sibling at L2 level (a leaf sibling)
  const sibL2Index = targetIndex % 2 === 0 ? targetIndex + 1 : targetIndex - 1;
  const sibL2Hex = fnv32Hex(row.anchor + '_leaf_' + sibL2Index);
  const parentL2Hex = fnv32Hex(row.anchor + '_l2_' + Math.floor(targetIndex / 2));
  const sibL2Side: 'left' | 'right' = (targetIndex & 1) === 0 ? 'right' : 'left';
  const l2LeafLabel = `D${targetIndex + 1}`;
  const sibL2Label = `D${sibL2Index + 1}`;

  steps.push({
    stepNum: 1,
    leafLabel: sibL2Side === 'right' ? `${l2LeafLabel} ‖ ${sibL2Label}` : `${sibL2Label} ‖ ${l2LeafLabel}`,
    sibLabel: `sibling at L3 (${sibL2Side})`,
    resultHex: parentL2Hex,
    isRoot: false,
    sibSide: sibL2Side,
    levelLabel: 'L3',
  });

  // Level 1 (L2→L1): sibling at L1 level (L2 node sibling)
  const onPathL2Index = Math.floor(targetIndex / 2);
  const sibL1Index = onPathL2Index % 2 === 0 ? onPathL2Index + 1 : onPathL2Index - 1;
  const sibL1Hex = fnv32Hex(row.anchor + '_l2_' + sibL1Index);
  const parentL1Hex = fnv32Hex(row.anchor + '_l1_' + Math.floor(targetIndex / 4));
  const sibL1Side: 'left' | 'right' = (onPathL2Index & 1) === 0 ? 'right' : 'left';
  const l2ParentLabel = `H${onPathL2Index + 1}`;
  const sibL1Label = `H${sibL1Index + 1}`;

  steps.push({
    stepNum: 2,
    leafLabel: sibL1Side === 'right' ? `${l2ParentLabel} ‖ ${sibL1Label}` : `${sibL1Label} ‖ ${l2ParentLabel}`,
    sibLabel: `sibling at L2 (${sibL1Side})`,
    resultHex: parentL1Hex,
    isRoot: false,
    sibSide: sibL1Side,
    levelLabel: 'L2',
  });

  // Level 0 (L1→ROOT): sibling at root level (L1 node sibling)
  const onPathL1Index = Math.floor(targetIndex / 4);
  const sibRootIndex = onPathL1Index === 0 ? 1 : 0;
  const sibRootHex = fnv32Hex(row.anchor + '_l1_' + sibRootIndex);
  const sibRootSide: 'left' | 'right' = (onPathL1Index & 1) === 0 ? 'right' : 'left';
  const l1ParentLabel = `H${onPathL1Index + 5}`;
  const sibRootLabel = `H${sibRootIndex + 5}`;

  steps.push({
    stepNum: 3,
    leafLabel: sibRootSide === 'right' ? `${l1ParentLabel} ‖ ${sibRootLabel}` : `${sibRootLabel} ‖ ${l1ParentLabel}`,
    sibLabel: `sibling at L1 (${sibRootSide})`,
    resultHex: row.anchor.slice(0, 8),
    isRoot: true,
    sibSide: sibRootSide,
    levelLabel: 'L1',
  });

  // Suppress unused variable warning — these are used in the step objects above
  void targetLeafHex;
  void sibL2Hex;
  void sibL1Hex;
  void sibRootHex;

  return steps;
}

// ── Visual fill/stroke per node state ────────────────────────────────
function nodeColors(state: NodeState): {
  fill: string;
  stroke: string | null;
  strokeWidth: number;
  labelFill: string;
  hexFill: string;
  binaryFill: string;
} {
  switch (state) {
    case 'root':
      return {
        fill: 'var(--color-neutral-900)',
        stroke: null,
        strokeWidth: 0,
        labelFill: 'var(--color-white)',
        hexFill: 'var(--color-neutral-900)',
        binaryFill: 'var(--color-neutral-900)',
      };
    case 'on-path':
      return {
        fill: 'var(--color-blue-500)',
        stroke: null,
        strokeWidth: 0,
        labelFill: 'var(--color-white)',
        hexFill: 'var(--color-neutral-900)',
        binaryFill: 'var(--color-neutral-900)',
      };
    case 'off-leaf':
      return {
        fill: 'var(--color-white)',
        stroke: 'var(--color-neutral-700)',
        strokeWidth: 1.5,
        labelFill: 'var(--color-neutral-900)',
        hexFill: 'var(--color-neutral-500)',
        binaryFill: 'var(--color-neutral-500)',
      };
    case 'off-intermediate':
      return {
        fill: 'var(--color-white)',
        stroke: 'var(--color-neutral-300)',
        strokeWidth: 1,
        labelFill: 'var(--color-neutral-500)',
        hexFill: 'var(--color-neutral-500)',
        binaryFill: 'var(--color-neutral-500)',
      };
  }
}

// ── Single Merkle node rendered in SVG ───────────────────────────────
function MerkleSvgNode({
  node,
  visible,
  delayMs = 0,
}: {
  node: MerkleNodeData;
  visible: boolean;
  delayMs?: number;
}) {
  const colors = nodeColors(node.state);
  const w = node.state === 'root' ? ROOT_W : NODE_W;
  const x = node.cx - w / 2;
  const y = node.cy - NODE_H / 2;

  // Animation: on-path nodes and ROOT fade+scale in sequentially with stagger.
  // prefers-reduced-motion: end state is always visible immediately.
  const isAnimated = node.state === 'on-path' || node.state === 'root';

  return (
    <g
      style={
        isAnimated
          ? {
              opacity: visible ? 1 : 0,
              transform: visible ? 'scale(1)' : 'scale(0.96)',
              transformOrigin: `${node.cx}px ${node.cy}px`,
              // motion-reduce: transition-none is applied via class below;
              // the inline style handles the delay for the normal case.
              transition: visible
                ? `opacity 200ms ease-out ${delayMs}ms, transform 200ms ease-out ${delayMs}ms`
                : 'none',
            }
          : {
              // Scaffolding: ambient fade-in at t=0, before the proof cascade.
              opacity: visible ? 1 : 0,
              transition: visible ? 'opacity 200ms ease-out' : 'none',
            }
      }
      className="motion-reduce:!opacity-100 motion-reduce:![transform:scale(1)] motion-reduce:!transition-none"
    >
      {/* Binary first-byte label above rect (12px visible gap) */}
      <text
        x={node.cx}
        y={node.cy - NODE_H / 2 - 12}
        textAnchor="middle"
        dominantBaseline="auto"
        fontSize="10"
        fontFamily="var(--font-mono)"
        letterSpacing="0.08em"
        fill={colors.binaryFill}
      >
        {node.binary}
      </text>

      {/* Rounded rect */}
      <rect
        x={x}
        y={y}
        width={w}
        height={NODE_H}
        rx={NODE_RX}
        fill={colors.fill}
        stroke={colors.stroke ?? undefined}
        strokeWidth={colors.strokeWidth}
      />

      {/* Role label inside rect */}
      <text
        x={node.cx}
        y={node.cy}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontWeight="500"
        fontFamily="var(--font-mono)"
        fill={colors.labelFill}
      >
        {node.id}
      </text>

      {/* 8-char hex label below rect (12px visible gap) */}
      <text
        x={node.cx}
        y={node.cy + NODE_H / 2 + 20}
        textAnchor="middle"
        dominantBaseline="auto"
        fontSize="11"
        fontFamily="var(--font-mono)"
        fill={colors.hexFill}
      >
        {node.hex8}
      </text>
    </g>
  );
}

// ── All edges for the tree ────────────────────────────────────────────
function MerkleEdges({
  nodes,
  onPathIds,
  visibleOnPath,
}: {
  nodes: MerkleNodeData[];
  onPathIds: Set<string>;
  visibleOnPath: boolean;
}) {
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  // Build parent→children map
  type EdgeDef = { parentId: string; childId: string };
  const edges: EdgeDef[] = [];

  // ROOT → L1
  edges.push({ parentId: 'ROOT', childId: 'H5' });
  edges.push({ parentId: 'ROOT', childId: 'H6' });

  // L1 → L2
  edges.push({ parentId: 'H5', childId: 'H1' });
  edges.push({ parentId: 'H5', childId: 'H2' });
  edges.push({ parentId: 'H6', childId: 'H3' });
  edges.push({ parentId: 'H6', childId: 'H4' });

  // L2 → L3 (leaves)
  for (let i = 0; i < 4; i++) {
    const parentId = `H${i + 1}`;
    edges.push({ parentId, childId: `D${i * 2 + 1}` });
    edges.push({ parentId, childId: `D${i * 2 + 2}` });
  }

  return (
    <>
      {edges.map(({ parentId, childId }) => {
        const parent = nodeById.get(parentId);
        const child = nodeById.get(childId);
        if (!parent || !child) return null;

        const isOnPath = onPathIds.has(parentId) && onPathIds.has(childId);
        const x1 = parent.cx;
        const y1 = parent.cy + NODE_H / 2;
        const x2 = child.cx;
        const y2 = child.cy - NODE_H / 2;

        if (!isOnPath) {
          // Off-path scaffolding: ambient fade-in at t=0.
          return (
            <line
              key={`${parentId}-${childId}`}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="var(--color-neutral-300)"
              strokeWidth={1}
              style={{
                opacity: visibleOnPath ? 1 : 0,
                transition: visibleOnPath ? 'opacity 200ms ease-out' : 'none',
              }}
              className="motion-reduce:!opacity-100 motion-reduce:!transition-none"
            />
          );
        }

        // On-path edge: stroke-dashoffset draw-in animation. Cascade
        // starts after scaffold fade-in (200ms) and after each node lands.
        const length = Math.hypot(x2 - x1, y2 - y1);
        let delayMs = 360;            // ROOT → L1 (after ROOT lands at 200ms + 160 beat)
        if (parent.cy === Y[1]) delayMs = 680;  // L1 → L2 (after L1 lands at 520ms)
        else if (parent.cy === Y[2]) delayMs = 1000; // L2 → leaf (after L2 lands at 840ms)

        return (
          <line
            key={`${parentId}-${childId}`}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="var(--color-blue-500)"
            strokeWidth={2}
            strokeDasharray={length}
            strokeDashoffset={visibleOnPath ? 0 : length}
            style={{
              transition: visibleOnPath
                ? `stroke-dashoffset 180ms ease-out ${delayMs}ms`
                : 'none',
            }}
            className="motion-reduce:![stroke-dashoffset:0] motion-reduce:!transition-none"
          />
        );
      })}
    </>
  );
}

// ── The core SVG tree ─────────────────────────────────────────────────
//
// SVG is exposed as a presentational image (`role="img"`) with a
// descriptive label. The canonical AT-accessible representation of the
// proof is the ProofStepsList below the tree — that's where the
// step-by-step hash operations and direction flags live in plain text.
function MerkleTreeSvg({
  nodes,
  onPathIds,
  visibleOnPath,
  viewBox,
  className,
  ariaLabel,
}: {
  nodes: MerkleNodeData[];
  onPathIds: Set<string>;
  visibleOnPath: boolean;
  viewBox?: string;
  className?: string;
  ariaLabel: string;
}) {
  return (
    <svg
      viewBox={viewBox ?? `0 0 ${VB_W} ${VB_H}`}
      className={className ?? 'w-full h-auto'}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Edges rendered before nodes so rects paint over endpoints */}
      <MerkleEdges nodes={nodes} onPathIds={onPathIds} visibleOnPath={visibleOnPath} />

      {/* Two-phase reveal:
          Phase A (0–200ms): scaffolding fades in (off-path nodes + gray edges).
          Phase B (200ms+): proof cascade. ROOT(200) → edge(360) →
          L1(520) → edge(680) → L2(840) → edge(1000) → leaf(1160).
          Reads as "tree exists, then the proof unfolds through it." */}
      {nodes.map((node) => {
        const isAnimated = node.state === 'on-path' || node.state === 'root';
        let delayMs = 0;
        if (isAnimated) {
          if (node.cy === Y[0]) delayMs = 200;
          else if (node.cy === Y[1]) delayMs = 520;
          else if (node.cy === Y[2]) delayMs = 840;
          else delayMs = 1160; // target leaf at Y[3]
        }
        return (
          <MerkleSvgNode
            key={node.id}
            node={node}
            visible={visibleOnPath}
            delayMs={delayMs}
          />
        );
      })}
    </svg>
  );
}

// ── Zoomable, pannable tree viewer (used inside expand dialog) ────────
function MerkleTreeViewer({
  nodes,
  onPathIds,
  ariaLabel,
}: {
  nodes: MerkleNodeData[];
  onPathIds: Set<string>;
  ariaLabel: string;
}) {
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 4;
  const ZOOM_STEP = 0.25;
  // Pan clamp: half the canvas in each axis, scaled by inverse zoom so
  // the tree can't be dragged completely out of view.
  const panClampX = VB_W / 2;
  const panClampY = VB_H / 2;
  const clamp = (v: number, max: number) => Math.max(-max, Math.min(max, v));

  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStart = React.useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 });

  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // primary button only
    setIsDragging(true);
    dragStart.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y };
  };

  React.useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      // dx/dy in pixels — convert to viewBox units by dividing by zoom
      const dx = (e.clientX - dragStart.current.clientX) / zoom;
      const dy = (e.clientY - dragStart.current.clientY) / zoom;
      // Dragging right pans content right → viewBox origin moves left.
      // Clamp so the tree can't drift fully off-canvas.
      setPan({
        x: clamp(dragStart.current.panX - dx, panClampX),
        y: clamp(dragStart.current.panY - dy, panClampY),
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, zoom, panClampX, panClampY]);

  // viewBox keeps the tree centered as zoom changes
  const vbW = VB_W / zoom;
  const vbH = VB_H / zoom;
  const vbX = pan.x + (VB_W - vbW) / 2;
  const vbY = pan.y + (VB_H - vbH) / 2;
  const viewBox = `${vbX} ${vbY} ${vbW} ${vbH}`;

  return (
    <div className="relative flex-1 min-h-0 w-full overflow-hidden">
      <div
        className="w-full h-full flex items-center justify-center select-none"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
      >
        <MerkleTreeSvg
          nodes={nodes}
          onPathIds={onPathIds}
          visibleOnPath={true}
          viewBox={viewBox}
          className="w-full h-full"
          ariaLabel={ariaLabel}
        />
      </div>

      {/* Live region announces zoom changes to assistive tech */}
      <span className="sr-only" aria-live="polite">
        Zoom level {Math.round(zoom * 100)} percent
      </span>

      {/* Stacked zoom control */}
      <div className="absolute top-4 right-4 flex flex-col rounded-md border border-border bg-card shadow-sm overflow-hidden">
        <button
          type="button"
          aria-label="Zoom in"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="size-8 inline-flex items-center justify-center text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Plus className="size-4" aria-hidden />
        </button>
        <div className="h-px bg-border" />
        <button
          type="button"
          aria-label="Zoom out"
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          className="size-8 inline-flex items-center justify-center text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Minus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

// ── Proof steps list ──────────────────────────────────────────────────
function ProofStepsList({ steps }: { steps: ProofStep[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-neutral-900 m-0">Proof steps</h3>
      <div className="flex flex-col gap-2">
        {steps.map((step) => (
          <div key={step.stepNum} className="flex items-start gap-2">
            <span className="font-mono text-xs text-neutral-400 shrink-0 w-4">
              {step.stepNum}.
            </span>
            <span className="font-mono text-xs text-neutral-700 break-all">
              H({step.leafLabel}) = {step.resultHex}
              {step.isRoot ? (
                <span className="text-neutral-900 font-medium"> ← ROOT</span>
              ) : null}
              <span className="text-neutral-500"> · {step.sibLabel}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Renders a depth-3 Merkle inclusion proof for a single audit event.
 *
 *  Layout:
 *    - Description sentence (prose + mono spans)
 *    - Bordered card containing the inline SVG tree + expand button
 *    - Proof steps list
 *    - Footer: path notation left, tree metadata right
 *
 *  All SVG fills/strokes reference CSS custom properties. */
function MerklePathPanel({ row }: { row: EventRow }) {
  const { nodes, targetIndex, onPathIds } = React.useMemo(
    () => buildMerkleTree(row),
    [row],
  );
  const proofSteps = React.useMemo(
    () => buildProofSteps(row, targetIndex),
    [row, targetIndex],
  );

  // Sequential reveal animation on mount
  const [visibleOnPath, setVisibleOnPath] = React.useState(false);
  const [expandOpen, setExpandOpen] = React.useState(false);

  React.useEffect(() => {
    // Small timeout ensures the tab transition finishes before we start
    const t = window.setTimeout(() => setVisibleOnPath(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  const anchorShort = truncateHex(row.anchor, 4, 4);
  const strippedId = row.eventId.replace(/^e_/, '').replace(/-/g, '');
  const leafHex = strippedId.slice(0, 8).padEnd(8, '0');
  const treeAriaLabel = `Merkle inclusion proof: leaf ${leafHex} verified against anchor root ${anchorShort} in ${TREE_DEPTH} hash operations. Full step-by-step proof is listed below the diagram.`;

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <p className="text-sm text-neutral-800 m-0">
        Highlighted path cryptographically proves{' '}
        <span className="font-mono text-neutral-900">{leafHex}</span> is included
        in anchor root{' '}
        <span className="font-mono text-neutral-900">{anchorShort}</span>.
      </p>

      {/* Tree card */}
      <div className="relative rounded-md border border-border bg-card p-4">
        {/* Expand FAB */}
        <button
          type="button"
          aria-label="Expand Merkle tree"
          onClick={() => setExpandOpen(true)}
          className="absolute top-2 right-2 inline-flex items-center justify-center size-8 rounded-sm border border-border bg-card text-neutral-700 hover:bg-neutral-50 transition-colors duration-150 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Expand className="size-4" aria-hidden />
        </button>

        <MerkleTreeSvg
          nodes={nodes}
          onPathIds={onPathIds}
          visibleOnPath={visibleOnPath}
          ariaLabel={treeAriaLabel}
        />
      </div>

      {/* Proof steps */}
      <ProofStepsList steps={proofSteps} />

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-neutral-500">
        <span>
          <span className="text-neutral-400">Path:</span>{' '}
          <span className="font-mono text-neutral-700">
            leaf → L2 → L1 → ROOT
          </span>
        </span>
        <span>
          Tree depth: {TREE_DEPTH} · Hash operations: {TREE_DEPTH}
        </span>
      </div>

      {/* Expand dialog — interactive viewer.
          `nestedBackdrop` renders a manual scrim that sits between this
          dialog and the parent audit record dialog (Base UI dedups its
          own backdrops when nested, so we have to opt in here). */}
      <Dialog open={expandOpen} onOpenChange={setExpandOpen}>
        <DialogContent
          style={{ width: 800, height: 640, maxWidth: 800 }}
          className="p-6 flex flex-col gap-4 overflow-hidden"
          nestedBackdrop
          overlayClassName="bg-neutral-900/60"
          showCloseButton={true}
        >
          <DialogTitle className="font-sans text-lg leading-none font-medium text-neutral-900 m-0">
            Merkle tree
          </DialogTitle>
          <MerkleTreeViewer nodes={nodes} onPathIds={onPathIds} ariaLabel={treeAriaLabel} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── How it works panel ─────────────────────────────────────────────── */

const HOW_STEPS = [
  {
    id: '01',
    title: 'Hash',
    body: 'Each request, policy decision, and limit check is hashed at the gateway edge using SHA-256.',
  },
  {
    id: '02',
    title: 'Batch',
    body: 'Hashes are batched into a Merkle tree every 5 minutes, or 64 events, whichever comes first.',
  },
  {
    id: '03',
    title: 'Anchor',
    body: 'The Merkle root is submitted to Constellation Digital Evidence with a 3-of-3 validator quorum.',
  },
  {
    id: '04',
    title: 'Verify',
    body: 'Anyone with the leaf, root, and sibling hashes can re-derive the root locally. No trust in us required.',
  },
] as const;

function NumberChip({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center justify-center size-8 rounded-xs bg-neutral-100 text-neutral-700 font-mono text-xs font-medium shrink-0">
      {children}
    </span>
  );
}

function HowItWorksPanel() {
  return (
    <div className="flex flex-col gap-4">
      {/* 2×2 step grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {HOW_STEPS.map((step) => (
          <div
            key={step.id}
            className="rounded-md border border-border bg-card p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <NumberChip>{step.id}</NumberChip>
              <h3 className="text-sm font-medium text-neutral-900 m-0">{step.title}</h3>
            </div>
            <p className="text-sm text-neutral-700 text-pretty m-0">{step.body}</p>
          </div>
        ))}
      </div>

      {/* Go-deeper CTA — single primary resource. Links straight to the
          Digital Evidence product surface (no separate /docs path in the
          knowledge graph yet). Copy uses the approved tamper-evident /
          cryptographic-proof vocabulary from the DE product record. */}
      <a
        href="https://digitalevidence.constellationnetwork.io/"
        target="_blank"
        rel="noopener noreferrer"
        className="group rounded-md border border-border bg-card p-4 flex items-center justify-between gap-4 text-left transition-colors duration-150 ease-out hover-fine:bg-neutral-50 motion-reduce:transition-none"
      >
        <span className="flex items-center gap-3 min-w-0">
          <span className="size-8 rounded-xs bg-neutral-100 inline-flex items-center justify-center shrink-0">
            <BookOpen className="size-4 text-neutral-700" aria-hidden />
          </span>
          <span className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-neutral-900">Digital Evidence docs</span>
            <span className="text-sm text-neutral-700 text-pretty">
              How Constellation's tamper-evident layer makes every event in this log independently verifiable.
            </span>
          </span>
        </span>
        <ExternalLink
          className="size-4 text-neutral-500 shrink-0 transition-colors duration-150 ease-out group-hover:text-neutral-900 motion-reduce:transition-none"
          aria-hidden
        />
      </a>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────── */

export function AuditRecordDialog({
  row,
  open,
  onOpenChange,
}: {
  row: EventRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!row) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogScrollContent className="sm:max-w-2xl">
        {/* ── Header ── */}
        <DialogScrollHeader>
          <DialogTitleBlock badge={<VerifiedBySeal />}>Audit record</DialogTitleBlock>
        </DialogScrollHeader>

        {/* ── Anchor banner ──
         *
         * Restored 2026-05-18 with the seal moved to the title row. The
         * banner now carries the differentiator claim in plain prose plus
         * the anchor + relative-time footer so the user reads the proof
         * statement before the tabbed detail. */}
        <DialogScrollSummary className="pt-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-neutral-900 m-0">
              This event is anchored to{' '}
              <span className="font-medium">Constellation's Digital Evidence</span>{' '}
              layer.
            </p>
            <p className="text-xs text-neutral-500 m-0">
              Anchored ·{' '}
              <span className="font-mono text-neutral-800">{truncateHex(row.anchor, 4, 4)}</span>
              {' · '}
              {fmtRelative(row.at)}
            </p>
          </div>
        </DialogScrollSummary>

        {/* ── Tabbed body ── */}
        <DialogScrollBody className="pt-2">
          <Tabs defaultValue="event">
            <TabsList variant="line" className="mb-2 px-0">
              <TabsTrigger value="event" className="pl-0">Event</TabsTrigger>
              <TabsTrigger value="merkle">Merkle path</TabsTrigger>
              <TabsTrigger value="how">How it works</TabsTrigger>
            </TabsList>

            {/* Event panel */}
            <TabsContent value="event">
              <DetailList>
                <DetailRow
                  label="Time"
                  value={<Timestamp date={row.at} className="font-mono text-neutral-800" />}
                />
                <DetailRow
                  label="Event ID"
                  value={
                    <span className="font-mono break-all text-neutral-800">{row.eventId}</span>
                  }
                />
                <DetailRow
                  label="Event type"
                  value={<Badge variant={KIND_BADGE_VARIANT[row.kind]}>{row.kind}</Badge>}
                />
                <DetailRow
                  label="Description"
                  value={<span className="text-neutral-900">{row.description}</span>}
                />
                <DetailRow
                  label="Member"
                  value={<span className="text-neutral-800">{row.member}</span>}
                />
                <DetailRow
                  label="Anchor"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <CircleCheck
                        className="size-4 text-success-600 shrink-0"
                        strokeWidth={1.75}
                        aria-hidden
                      />
                      <span className="sr-only">Verified anchor</span>
                      <span className="font-mono whitespace-nowrap text-neutral-800">{truncateHex(row.anchor, 4, 4)}</span>
                    </span>
                  }
                />
              </DetailList>
            </TabsContent>

            {/* Merkle path panel */}
            <TabsContent value="merkle">
              <MerklePathPanel row={row} />
            </TabsContent>

            {/* How it works panel */}
            <TabsContent value="how">
              <HowItWorksPanel />
            </TabsContent>
          </Tabs>
        </DialogScrollBody>

        {/* ── Footer ── */}
        <DialogScrollFooter>
          <Button variant="outline" size="sm" onClick={() => {}}>
            <Copy className="size-3.5" />
            Copy proof JSON
          </Button>
          <Button size="sm" onClick={() => {}}>
            <ExternalLink className="size-3.5" />
            Open DE Explorer
          </Button>
        </DialogScrollFooter>
      </DialogScrollContent>
    </Dialog>
  );
}
