/**
 * High-performance canvas rendering utilities for The Forgettery.
 */

const COLORS = {
  VOID: "#03071e",
  DARK: "#370617",
  WINE: "#6a040f",
  RUBY: "#9d0208",
  RED: "#d00000",
  ORANGE: "#e85d04",
  YELLOW: "#faa307",
  BRIGHT_YELLOW: "#ffba08",
};

const THRESHOLDS = {
  VOID: 0.2,
  CRACK: 0.5,
  DIM: 0.8,
};

export function drawTile(ctx, tile, size, time) {
  const px = tile.x * size;
  const py = tile.y * size;
  const p = tile.recall_probability;
  const t = time / 1000;

  ctx.save();

  // 1. Draw Base Tile
  if (p <= THRESHOLDS.VOID) {
    // Void Shimmer Effect
    const shimmer = 0.05 + 0.05 * Math.sin(t * 2 + tile.x + tile.y);
    ctx.fillStyle = COLORS.VOID;
  } else if (p <= THRESHOLDS.CRACK) {
    // Cracking / Reddening
    ctx.fillStyle = COLORS.RUBY;
  } else if (p <= THRESHOLDS.DIM) {
    // Dimming
    ctx.fillStyle = COLORS.WINE;
  } else {
    // Bright / Healthy
    const glow = 0.7 + 0.3 * p;
    ctx.fillStyle = COLORS.YELLOW;
  }
  
  ctx.fillRect(px + 2, py + 2, size - 4, size - 4);

  // 2. Draw Cracks (for decaying tiles)
  if (p > THRESHOLDS.VOID && p <= THRESHOLDS.CRACK) {
    ctx.strokeStyle = COLORS.RED;
    ctx.lineWidth = 1;
    ctx.beginPath();
    // Procedural cracks based on tile coordinates
    const seed = (tile.x * 13 + tile.y * 7) % 10;
    ctx.moveTo(px + 5 + seed, py + 5);
    ctx.lineTo(px + size - 8, py + size - 12 - seed);
    ctx.moveTo(px + size - 6, py + 8 + seed);
    ctx.lineTo(px + 10, py + size - 5 - seed);
    ctx.stroke();
  }

  // 3. Draw Grid Border
  ctx.strokeStyle = COLORS.DARK;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(px, py, size, size);

  // 4. Draw Label (only if visible enough)
  if (p > 0.3) {
    ctx.fillStyle = COLORS.BRIGHT_YELLOW;
    ctx.font = "bold 9px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    // Truncate name if too long
    const displayName = tile.name.length > 9 ? tile.name.slice(0, 7) + ".." : tile.name;
    ctx.fillText(displayName, px + size / 2, py + size - 8);
  }

  ctx.restore();
}

export function drawFog(ctx, tile, size, time) {
  // Fog depends on ML uncertainty (Gaussian Process std)
  if (!tile.std || tile.std < 0.15) return;
  
  const px = tile.x * size;
  const py = tile.y * size;
  const intensity = Math.min(1, tile.std * 2.5);
  const t = time / 1000;
  
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  
  for (let i = 0; i < 3; i++) {
    const offset = Math.sin(t * 0.8 + i + tile.x * 0.3 + tile.y * 0.2) * 5;
    ctx.fillStyle = COLORS.ORANGE;
    ctx.beginPath();
    ctx.arc(
      px + size / 2 + offset,
      py + size / 2 - offset,
      size * (0.4 + 0.1 * Math.sin(t + i)),
      0, Math.PI * 2
    );
    ctx.fill();
  }
  
  ctx.restore();
}

export function drawPlayer(ctx, player, size, time) {
  const px = player.x * size + size / 2;
  const py = player.y * size + size / 2;
  const t = time / 1000;
  
  ctx.save();
  
  // Outer Glow
  const pulse = 0.2 * Math.sin(t * 5);
  const grad = ctx.createRadialGradient(px, py, 2, px, py, size / 2 + pulse * 10);
  grad.addColorStop(0, COLORS.BRIGHT_YELLOW);
  grad.addColorStop(0.5, COLORS.ORANGE);
  grad.addColorStop(1, COLORS.RED);
  
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, size / 2 + 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Core
  ctx.fillStyle = COLORS.BRIGHT_YELLOW;
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.restore();
}
