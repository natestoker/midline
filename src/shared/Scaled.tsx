import type { ReactNode } from 'react';

// Draws a block's content larger or smaller without changing its box.
// Quiz blocks use fixed text sizes, which read as tiny on a 1920-wide slide;
// Block.scale enlarges the content and shrinks the layout area to match, so it
// still fills exactly the block's width and height.
export function Scaled({ scale, children }: { scale?: number; children: ReactNode }) {
  if (!scale || Math.abs(scale - 1) < 0.01) return <>{children}</>;
  // A transform, not CSS zoom: browsers disagree on how zoom treats percentage
  // sizes, and a transform scales the laid-out box exactly.
  return <div style={{ transform: `scale(${scale})`, transformOrigin: '0 0', width: `${100 / scale}%`, height: `${100 / scale}%` }}>{children}</div>;
}
