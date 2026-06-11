import {
  BookOpen,
  CircleCheck,
  Copy,
  Expand,
  ExternalLink,
  Maximize2,
  Minus,
  Plus,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DetailList, DetailRow } from "@/components/ui/detail-list";
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
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Timestamp } from "@/components/ui/timestamp";
import {
  type EventRow,
  fmtRelative,
  KIND_BADGE_VARIANT,
  truncateHex,
} from "@/data/audit-trail";

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
// Pure pan-overshoot damping — module scope so effects need not depend on it.
const dampedClamp = (v: number, max: number) => {
  if (v > max) {
    return max + (v - max) * 0.3;
  }
  if (v < -max) {
    return -max + (v + max) * 0.3;
  }
  return v;
};

function VerifiedBySeal() {
  return (
    <img
      alt="Verified by Constellation Digital Evidence"
      className="h-6 w-auto self-start"
      src="/icons/de-verified-badge.svg"
    />
  );
}

/* ─── Merkle path panel ───────────────────────────────────────────────── */

// ── FNV-1a 32-bit inline hash ─────────────────────────────────────────
// No external dependencies. Same input → same output, tree is stable.
function fnv32(input: string): number {
  let h = 0x81_1c_9d_c5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01_00_01_93);
  }
  return h >>> 0; // unsigned 32-bit
}

// 8-char hex from FNV-32
function fnv32Hex(input: string): string {
  return fnv32(input).toString(16).padStart(8, "0");
}

// Extended 16-char hex by hashing twice with salt
function fnv32HexLong(input: string): string {
  return fnv32Hex(input) + fnv32Hex(input + "_b");
}

// ── Tree constants ────────────────────────────────────────────────────
const TREE_DEPTH = 3; // L0=ROOT, L1, L2, L3 (leaves)
// Derived: 2^TREE_DEPTH leaves, TREE_DEPTH hash operations in a proof
const LEAF_COUNT = 2 ** TREE_DEPTH; // 8

// ── SVG layout constants ──────────────────────────────────────────────
const VB_W = 760;
const VB_H = 372;
const NODE_W = 64;
const NODE_H = 32;
const NODE_RX = 6;
const ROOT_W = 80;
// Y centers shifted up 14px from the original layout (which had a binary
// label above each rect that needed top breathing room). Without those
// labels, ROOT's rect now sits 18px from the viewBox top and the leaf
// hex baseline sits 18px from the bottom — symmetric.
const Y: Record<number, number> = { 0: 34, 1: 134, 2: 224, 3: 318 };
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
type NodeState = "root" | "on-path" | "off-leaf" | "off-intermediate";

// ── Node descriptor ───────────────────────────────────────────────────
interface MerkleNodeData {
  cx: number;
  cy: number;
  hex8: string; // 8-char hex for under-node label
  hexLong: string; // 16-char hex for tooltip
  id: string; // "ROOT" | "H1"–"H6" | "D1"–"D8"
  role: string; // human-readable: "Root", "On-path parent", etc.
  state: NodeState;
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
  const strippedId = row.eventId.replace(/^e_/, "").replace(/-/g, "");
  const targetLeafHex = strippedId.slice(0, 8).padEnd(8, "0");

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
      : fnv32Hex(row.anchor + "_leaf_" + i);
    leafNodes.push({
      id: `D${i + 1}`,
      role: isTarget ? "Target leaf" : `Leaf D${i + 1}`,
      state: isTarget ? "on-path" : "off-leaf",
      cx: leafCX(i),
      cy: Y[3],
      hex8: leafHex,
      hexLong: isTarget
        ? strippedId.slice(0, 16).padEnd(16, "0")
        : fnv32HexLong(row.anchor + "_leaf_" + i),
    });
  }

  // Build L2 nodes (H1–H4)
  const l2Nodes: MerkleNodeData[] = [];
  for (let i = 0; i < LEAF_COUNT / 2; i++) {
    const isOnPath = i === onPathL2;
    const l2Hex = fnv32Hex(row.anchor + "_l2_" + i);
    // Sibling of the on-path L2 node — pairs with it to compute the L1 parent.
    // onPathL2 XOR 1 gives the pair: (0,1), (1,0), (2,3), (3,2).
    const isSiblingToOnPath = !isOnPath && i === (onPathL2 ^ 1);
    l2Nodes.push({
      id: `H${i + 1}`,
      role: isOnPath
        ? "On-path parent (L2)"
        : isSiblingToOnPath
          ? `Sibling at L2 (${(onPathL2 & 1) === 0 ? "right" : "left"})`
          : `Intermediate H${i + 1}`,
      state: isOnPath ? "on-path" : "off-intermediate",
      cx: l2CX(i),
      cy: Y[2],
      hex8: l2Hex,
      hexLong: fnv32HexLong(row.anchor + "_l2_" + i),
    });
  }

  // Build L1 nodes (H5–H6)
  const l1Nodes: MerkleNodeData[] = [];
  for (let i = 0; i < LEAF_COUNT / 4; i++) {
    const isOnPath = i === onPathL1;
    const l1Hex = fnv32Hex(row.anchor + "_l1_" + i);
    l1Nodes.push({
      id: `H${i + 5}`,
      role: isOnPath ? "On-path parent (L1)" : `Intermediate H${i + 5}`,
      state: isOnPath ? "on-path" : "off-intermediate",
      cx: l1CX(i),
      cy: Y[1],
      hex8: l1Hex,
      hexLong: fnv32HexLong(row.anchor + "_l1_" + i),
    });
  }

  // ROOT node
  const rootNode: MerkleNodeData = {
    id: "ROOT",
    role: "Merkle root",
    state: "root",
    cx: ROOT_CX,
    cy: Y[0],
    hex8: anchorHex8,
    hexLong: row.anchor.slice(0, 16),
  };

  const nodes = [rootNode, ...l1Nodes, ...l2Nodes, ...leafNodes];

  // IDs of nodes on the proof path (for animation ordering)
  const onPathIds = new Set([
    "ROOT",
    l1Nodes[onPathL1].id,
    l2Nodes[onPathL2].id,
    leafNodes[targetIndex].id,
  ]);

  return { nodes, targetIndex, onPathIds };
}

// Proof-steps builder + ProofStepsList component were removed when the
// CTO scoped this section out. See git history (commit 87611a1 and
// earlier) for the previous implementation, which derived a 3-step
// directional proof (`H(D1 ‖ D2) = … · sibling at L3 (right)` etc.)
// from the same FNV-1a hashes that label the tree nodes.

// ── Visual fill/stroke per node state ────────────────────────────────
function nodeColors(state: NodeState): {
  fill: string;
  stroke: string | null;
  strokeWidth: number;
  labelFill: string;
  hexFill: string;
} {
  switch (state) {
    case "root":
      return {
        fill: "var(--color-neutral-900)",
        stroke: null,
        strokeWidth: 0,
        labelFill: "var(--color-white)",
        hexFill: "var(--color-neutral-900)",
      };
    case "on-path":
      return {
        fill: "var(--color-blue-500)",
        stroke: null,
        strokeWidth: 0,
        labelFill: "var(--color-white)",
        hexFill: "var(--color-neutral-900)",
      };
    case "off-leaf":
      return {
        fill: "var(--color-white)",
        stroke: "var(--color-neutral-700)",
        strokeWidth: 1.5,
        labelFill: "var(--color-neutral-900)",
        hexFill: "var(--color-neutral-500)",
      };
    case "off-intermediate":
      return {
        fill: "var(--color-white)",
        stroke: "var(--color-neutral-300)",
        strokeWidth: 1,
        labelFill: "var(--color-neutral-500)",
        hexFill: "var(--color-neutral-500)",
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
  const w = node.state === "root" ? ROOT_W : NODE_W;
  const x = node.cx - w / 2;
  const y = node.cy - NODE_H / 2;

  // Animation: on-path nodes and ROOT fade+scale in sequentially with stagger.
  // prefers-reduced-motion: end state is always visible immediately.
  const isAnimated = node.state === "on-path" || node.state === "root";

  return (
    <g
      className="motion-reduce:!opacity-100 motion-reduce:!transition-none"
      // Outer group: opacity-only fade. Labels live here so they don't
      // ride the scale transform on the rect below.
      style={{
        opacity: visible ? 1 : 0,
        willChange: "opacity",
        transition: visible
          ? `opacity 200ms ease-out ${isAnimated ? delayMs : 0}ms`
          : "none",
      }}
    >
      {/* Inner group: scale transform on the rect ONLY (no labels). The
          group is centered on the node so the scale "pops" the block
          without moving any text. */}
      <g
        className="motion-reduce:![transform:scale(1)] motion-reduce:!transition-none"
        style={
          isAnimated
            ? {
                transform: visible ? "scale(1)" : "scale(0.96)",
                transformOrigin: `${node.cx}px ${node.cy}px`,
                transition: visible
                  ? `transform 200ms ease-out ${delayMs}ms`
                  : "none",
              }
            : undefined
        }
      >
        <rect
          fill={colors.fill}
          height={NODE_H}
          rx={NODE_RX}
          stroke={colors.stroke ?? undefined}
          strokeWidth={colors.strokeWidth}
          width={w}
          x={x}
          y={y}
        />
      </g>

      {/* Role label inside rect (rendered AFTER rect so it paints on top
          of the filled background; sits outside the scaling group so it
          stays at full size and doesn't drift during the pop). */}
      <text
        dominantBaseline="middle"
        fill={colors.labelFill}
        fontFamily="var(--font-mono)"
        fontSize="11"
        fontWeight="500"
        textAnchor="middle"
        x={node.cx}
        y={node.cy}
      >
        {node.id}
      </text>

      {/* 8-char hex label below rect (12px visible gap) */}
      <text
        dominantBaseline="auto"
        fill={colors.hexFill}
        fontFamily="var(--font-mono)"
        fontSize="11"
        textAnchor="middle"
        x={node.cx}
        y={node.cy + NODE_H / 2 + 20}
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
  edges.push({ parentId: "ROOT", childId: "H5" });
  edges.push({ parentId: "ROOT", childId: "H6" });

  // L1 → L2
  edges.push({ parentId: "H5", childId: "H1" });
  edges.push({ parentId: "H5", childId: "H2" });
  edges.push({ parentId: "H6", childId: "H3" });
  edges.push({ parentId: "H6", childId: "H4" });

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
        if (!(parent && child)) {
          return null;
        }

        const isOnPath = onPathIds.has(parentId) && onPathIds.has(childId);
        const x1 = parent.cx;
        const y1 = parent.cy + NODE_H / 2;
        const x2 = child.cx;
        const y2 = child.cy - NODE_H / 2;

        if (!isOnPath) {
          // Off-path scaffolding: ambient fade-in at t=0.
          return (
            <line
              className="motion-reduce:!opacity-100 motion-reduce:!transition-none"
              key={`${parentId}-${childId}`}
              stroke="var(--color-neutral-300)"
              strokeWidth={1}
              style={{
                opacity: visibleOnPath ? 1 : 0,
                transition: visibleOnPath ? "opacity 200ms ease-out" : "none",
              }}
              x1={x1}
              x2={x2}
              y1={y1}
              y2={y2}
            />
          );
        }

        // On-path edge: stroke-dashoffset draw-in animation. Cascade
        // starts after scaffold fade-in (200ms) and after each node lands.
        const length = Math.hypot(x2 - x1, y2 - y1);
        let delayMs = 360; // ROOT → L1 (after ROOT lands at 200ms + 160 beat)
        if (parent.cy === Y[1]) {
          delayMs = 680; // L1 → L2 (after L1 lands at 520ms)
        } else if (parent.cy === Y[2]) {
          delayMs = 1000; // L2 → leaf (after L2 lands at 840ms)
        }

        return (
          <line
            className="motion-reduce:![stroke-dashoffset:0] motion-reduce:!transition-none"
            key={`${parentId}-${childId}`}
            stroke="var(--color-blue-500)"
            strokeDasharray={length}
            strokeDashoffset={visibleOnPath ? 0 : length}
            strokeWidth={2}
            style={{
              transition: visibleOnPath
                ? `stroke-dashoffset 180ms ease-out ${delayMs}ms`
                : "none",
            }}
            x1={x1}
            x2={x2}
            y1={y1}
            y2={y2}
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
// proof was previously surfaced via the ProofStepsList below the tree;
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
      aria-label={ariaLabel}
      className={className ?? "h-auto w-full"}
      role="img"
      viewBox={viewBox ?? `0 0 ${VB_W} ${VB_H}`}
    >
      {/* Edges rendered before nodes so rects paint over endpoints */}
      <MerkleEdges
        nodes={nodes}
        onPathIds={onPathIds}
        visibleOnPath={visibleOnPath}
      />

      {/* Two-phase reveal:
          Phase A (0–200ms): scaffolding fades in (off-path nodes + gray edges).
          Phase B (200ms+): proof cascade. ROOT(200) → edge(360) →
          L1(520) → edge(680) → L2(840) → edge(1000) → leaf(1160).
          Reads as "tree exists, then the proof unfolds through it." */}
      {nodes.map((node) => {
        const isAnimated = node.state === "on-path" || node.state === "root";
        let delayMs = 0;
        if (isAnimated) {
          if (node.cy === Y[0]) {
            delayMs = 200;
          } else if (node.cy === Y[1]) {
            delayMs = 520;
          } else if (node.cy === Y[2]) {
            delayMs = 840;
          } else {
            delayMs = 1160; // target leaf at Y[3]
          }
        }
        return (
          <MerkleSvgNode
            delayMs={delayMs}
            key={node.id}
            node={node}
            visible={visibleOnPath}
          />
        );
      })}
    </svg>
  );
}

/* ── Zoomable, pannable tree viewer (used inside expand dialog) ── */
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
  // Pan clamp: half the canvas in each axis. Past the boundary the
  // gesture damps to 30% of further drag (linear friction) rather than
  // hard-stopping — matches the emil-design-eng "friction over hard
  // stops" guidance.
  const panClampX = VB_W / 2;
  const panClampY = VB_H / 2;

  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStart = React.useRef({ clientX: 0, clientY: 0, panX: 0, panY: 0 });

  const zoomIn = () =>
    setZoom((z) => Math.min(MAX_ZOOM, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () =>
    setZoom((z) => Math.max(MIN_ZOOM, +(z - ZOOM_STEP).toFixed(2)));
  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const isDefaultView = zoom === 1 && pan.x === 0 && pan.y === 0;

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) {
      return; // primary button only
    }
    setIsDragging(true);
    dragStart.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  React.useEffect(() => {
    if (!isDragging) {
      return;
    }
    const onMove = (e: MouseEvent) => {
      // dx/dy in pixels — convert to viewBox units by dividing by zoom
      const dx = (e.clientX - dragStart.current.clientX) / zoom;
      const dy = (e.clientY - dragStart.current.clientY) / zoom;
      // Dragging right pans content right → viewBox origin moves left.
      // Damped past the boundary so the tree resists rather than hard-stops.
      setPan({
        x: dampedClamp(dragStart.current.panX - dx, panClampX),
        y: dampedClamp(dragStart.current.panY - dy, panClampY),
      });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, zoom, panClampX, panClampY]);

  // viewBox keeps the tree centered as zoom changes
  const vbW = VB_W / zoom;
  const vbH = VB_H / zoom;
  const vbX = pan.x + (VB_W - vbW) / 2;
  const vbY = pan.y + (VB_H - vbH) / 2;
  const viewBox = `${vbX} ${vbY} ${vbW} ${vbH}`;

  return (
    <div className="relative min-h-0 w-full flex-1 overflow-hidden">
      <div
        className="flex h-full w-full select-none items-center justify-center"
        onMouseDown={onMouseDown}
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <MerkleTreeSvg
          ariaLabel={ariaLabel}
          className="h-full w-full"
          nodes={nodes}
          onPathIds={onPathIds}
          viewBox={viewBox}
          visibleOnPath={true}
        />
      </div>

      {/* Live region announces zoom changes to assistive tech */}
      <span aria-live="polite" className="sr-only">
        Zoom level {Math.round(zoom * 100)} percent
      </span>

      {/* Stacked zoom control */}
      <div className="absolute top-4 right-4 flex flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <button
          aria-label="Zoom in"
          className="inline-flex size-8 items-center justify-center text-neutral-700 transition-[colors,transform] duration-150 ease-out hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:enabled:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100"
          disabled={zoom >= MAX_ZOOM}
          onClick={zoomIn}
          type="button"
        >
          <Plus aria-hidden className="size-4" />
        </button>
        <div className="h-px bg-border" />
        <button
          aria-label="Zoom out"
          className="inline-flex size-8 items-center justify-center text-neutral-700 transition-[colors,transform] duration-150 ease-out hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:enabled:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100"
          disabled={zoom <= MIN_ZOOM}
          onClick={zoomOut}
          type="button"
        >
          <Minus aria-hidden className="size-4" />
        </button>
        <div className="h-px bg-border" />
        <button
          aria-label="Reset view"
          className="inline-flex size-8 items-center justify-center text-neutral-700 transition-[colors,transform] duration-150 ease-out hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:enabled:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:transition-none motion-reduce:active:scale-100"
          disabled={isDefaultView}
          onClick={resetView}
          type="button"
        >
          <Maximize2 aria-hidden className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* Renders the depth-3 Merkle inclusion proof as a live SVG tree built from
 * the event's own id + anchor (ported from feature/merkle-tree-v2). It fills
 * the same bordered card frame the static diagram used; the on-path cascade
 * reveals shortly after mount. */
function MerklePathPanel({ row }: { row: EventRow }) {
  const { nodes, onPathIds } = React.useMemo(() => buildMerkleTree(row), [row]);

  // Sequential reveal on mount — small delay lets the tab transition settle
  // before the on-path cascade starts.
  const [visibleOnPath, setVisibleOnPath] = React.useState(false);
  React.useEffect(() => {
    const t = window.setTimeout(() => setVisibleOnPath(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  // Expand dialog — full interactive zoom/pan viewer.
  const [expandOpen, setExpandOpen] = React.useState(false);

  const anchorShort = truncateHex(row.anchor, 4, 4);
  const strippedId = row.eventId.replace(/^e_/, "").replace(/-/g, "");
  const leafHex = strippedId.slice(0, 8).padEnd(8, "0");
  const treeAriaLabel = `Merkle inclusion proof: leaf ${leafHex} verified against fingerprint root ${anchorShort} in ${TREE_DEPTH} hash operations.`;

  return (
    <div className="flex flex-col gap-4">
      {/* Description */}
      <p className="m-0 text-neutral-800 text-sm">
        Highlighted path cryptographically proves{" "}
        <span className="font-mono text-neutral-900">{leafHex}</span> is
        included in fingerprint root{" "}
        <span className="font-mono text-neutral-900">{anchorShort}</span>.
      </p>

      {/* Tree card — SVG fills the card edge-to-edge; the card chrome owns the
  rounded border. `overflow-hidden` clips the SVG to the rounded corners. */}
      <div className="relative overflow-hidden rounded-md border border-border">
        {/* Expand FAB — opens the interactive zoom/pan viewer. */}
        <button
          aria-label="Expand Merkle tree"
          className="absolute top-2 right-2 z-10 inline-flex size-8 items-center justify-center rounded-sm border border-border bg-card text-neutral-700 transition-[colors,transform] duration-150 ease-out hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:enabled:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
          onClick={() => setExpandOpen(true)}
          type="button"
        >
          <Expand aria-hidden className="size-4" />
        </button>
        <MerkleTreeSvg
          ariaLabel={treeAriaLabel}
          nodes={nodes}
          onPathIds={onPathIds}
          visibleOnPath={visibleOnPath}
        />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-neutral-500 text-xs">
        <span>
          <span className="text-neutral-500">Path:</span>{" "}
          <span className="font-mono text-neutral-700">
            leaf → L2 → L1 → ROOT
          </span>
        </span>
        <span>
          Tree depth: {TREE_DEPTH} · Hash operations: {TREE_DEPTH}
        </span>
      </div>

      {/* Expand dialog — interactive viewer. `nestedBackdrop` renders a manual
  scrim between this dialog and the parent audit-record dialog (Base UI
  dedups nested backdrops, so we opt in here). */}
      <Dialog onOpenChange={setExpandOpen} open={expandOpen}>
        <DialogContent
          className="flex flex-col gap-4 overflow-hidden p-6"
          nestedBackdrop
          overlayClassName="bg-neutral-900/60"
          showCloseButton={true}
          style={{ width: 800, height: 640, maxWidth: 800 }}
        >
          <DialogTitle className="m-0 font-medium font-sans text-lg text-neutral-900 leading-none">
            Merkle tree
          </DialogTitle>
          <MerkleTreeViewer
            ariaLabel={treeAriaLabel}
            nodes={nodes}
            onPathIds={onPathIds}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ─── How it works panel ─────────────────────────────────────────────── */

const HOW_STEPS = [
  {
    id: "01",
    title: "Hash",
    body: "Each request, policy decision, and limit check is hashed at the gateway edge using SHA-256.",
  },
  {
    id: "02",
    title: "Batch",
    body: "Hashes are batched into a Merkle tree every 5 minutes, or 64 events, whichever comes first.",
  },
  {
    id: "03",
    title: "Fingerprint",
    body: "The Merkle root is submitted to Constellation Digital Evidence with a 3-of-3 validator quorum.",
  },
  {
    id: "04",
    title: "Verify",
    body: "Anyone with the leaf, root, and sibling hashes can re-derive the root locally. No trust in us required.",
  },
] as const;

function NumberChip({ children }: { children: string }) {
  return (
    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xs bg-neutral-100 font-medium font-mono text-neutral-700 text-xs">
      {children}
    </span>
  );
}

function HowItWorksPanel() {
  return (
    <div className="flex flex-col gap-4">
      {/* 2×2 step grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {HOW_STEPS.map((step) => (
          <div
            className="flex flex-col gap-2 rounded-md border border-border bg-card p-4"
            key={step.id}
          >
            <div className="flex items-center gap-2">
              <NumberChip>{step.id}</NumberChip>
              <h3 className="m-0 font-medium text-neutral-900 text-sm">
                {step.title}
              </h3>
            </div>
            <p className="m-0 text-pretty text-neutral-700 text-sm">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      {/* Go-deeper CTA — single primary resource. Links straight to the
          Digital Evidence product surface (no separate /docs path in the
          knowledge graph yet). Copy uses the approved tamper-evident /
          cryptographic-proof vocabulary from the DE product record. */}
      <a
        className="group flex items-center justify-between gap-4 rounded-md border border-border bg-card p-4 text-left transition-colors duration-150 ease-out hover-fine:bg-neutral-50 motion-reduce:transition-none"
        href="https://digitalevidence.constellationnetwork.io/"
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-xs bg-neutral-100">
            <BookOpen aria-hidden className="size-4 text-neutral-700" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-medium text-neutral-900 text-sm">
              Digital Evidence docs
            </span>
            <span className="text-pretty text-neutral-700 text-sm">
              How Constellation's tamper-evident layer makes every event in this
              log independently verifiable.
            </span>
          </span>
        </span>
        <ExternalLink
          aria-hidden
          className="size-4 shrink-0 text-neutral-500 transition-colors duration-150 ease-out group-hover:text-neutral-900 motion-reduce:transition-none"
        />
      </a>
    </div>
  );
}

/* ─── Main export ─────────────────────────────────────────────────────── */

export function AuditRecordDialogMerkle({
  row,
  open,
  onOpenChange,
}: {
  row: EventRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!row) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogScrollContent className="sm:max-w-2xl">
        {/* ── Header ── */}
        <DialogScrollHeader>
          <DialogTitleBlock badge={<VerifiedBySeal />}>
            Audit record
          </DialogTitleBlock>
        </DialogScrollHeader>

        {/* ── Anchor banner ──
         *
         * Restored 2026-05-18 with the seal moved to the title row. The
         * banner now carries the differentiator claim in plain prose plus
         * the anchor + relative-time footer so the user reads the proof
         * statement before the tabbed detail. */}
        <DialogScrollSummary className="pt-4">
          <div className="flex flex-col gap-2">
            <p className="m-0 text-neutral-900 text-sm">
              This event is fingerprinted to{" "}
              <span className="font-medium">
                Constellation's Digital Evidence
              </span>{" "}
              layer.
            </p>
            <p className="m-0 text-neutral-500 text-xs">
              Fingerprinted ·{" "}
              <span className="font-mono text-neutral-800">
                {truncateHex(row.anchor, 4, 4)}
              </span>
              {" · "}
              {fmtRelative(row.at)}
            </p>
          </div>
        </DialogScrollSummary>

        {/* ── Tabbed body ── */}
        <DialogScrollBody className="pt-4">
          <Tabs defaultValue="event">
            <TabsList className="mb-2 px-0" variant="line">
              <TabsTrigger className="pl-0" value="event">
                Event
              </TabsTrigger>
              <TabsTrigger value="merkle">Merkle path</TabsTrigger>
              <TabsTrigger value="how">How it works</TabsTrigger>
            </TabsList>

            {/* Event panel */}
            <TabsContent value="event">
              <DetailList>
                <DetailRow
                  label="Time"
                  value={
                    <Timestamp
                      className="font-mono text-neutral-800"
                      date={row.at}
                    />
                  }
                />
                <DetailRow
                  label="Event ID"
                  value={
                    <span className="break-all font-mono text-neutral-800">
                      {row.eventId}
                    </span>
                  }
                />
                <DetailRow
                  label="Event type"
                  value={
                    <Badge variant={KIND_BADGE_VARIANT[row.kind]}>
                      {row.kind}
                    </Badge>
                  }
                />
                <DetailRow
                  label="Description"
                  value={
                    <span className="text-neutral-900">{row.description}</span>
                  }
                />
                <DetailRow
                  label="Member"
                  value={<span className="text-neutral-800">{row.member}</span>}
                />
                <DetailRow
                  label="Fingerprint"
                  value={
                    <span className="inline-flex items-center gap-2">
                      <CircleCheck
                        aria-hidden
                        className="size-4 shrink-0 text-success-600"
                        strokeWidth={1.75}
                      />
                      <span className="sr-only">Verified fingerprint</span>
                      <span className="whitespace-nowrap font-mono text-neutral-800">
                        {truncateHex(row.anchor, 4, 4)}
                      </span>
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
          <Button size="sm" variant="outline">
            <Copy className="size-3.5" />
            Copy proof JSON
          </Button>
          <Button size="sm">
            <ExternalLink className="size-3.5" />
            Open DE Explorer
          </Button>
        </DialogScrollFooter>
      </DialogScrollContent>
    </Dialog>
  );
}
