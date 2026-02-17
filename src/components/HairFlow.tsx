"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * HairFlow — Canvas-based mesh deformation for flowing hair.
 * Renders the base image with sine-wave displacement in hair regions.
 * Uses a grayscale mask to control where/how much flow applies.
 * GPU-friendly: only redraws the canvas, no DOM thrashing.
 */
interface HairFlowProps {
  imageSrc: string;
  maskSrc: string;
  width: number;
  height: number;
  className?: string;
}

// Mesh grid resolution (lower = faster, higher = smoother)
const GRID_COLS = 24;
const GRID_ROWS = 24;

// Animation parameters
const FLOW_SPEED = 0.8;      // How fast the wave moves
const FLOW_AMOUNT_X = 2.5;   // Max horizontal displacement in pixels
const FLOW_AMOUNT_Y = 1.5;   // Max vertical displacement in pixels
const WAVE_FREQ_X = 3.0;     // Horizontal wave frequency
const WAVE_FREQ_Y = 2.0;     // Vertical wave frequency

export default function HairFlow({ imageSrc, maskSrc, width, height, className }: HairFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const dataRef = useRef<{
    img: HTMLImageElement;
    mask: Float32Array; // Normalized 0-1 influence per grid cell
    ready: boolean;
  }>({ img: new Image(), mask: new Float32Array(0), ready: false });

  // Load image and mask, build influence grid
  useEffect(() => {
    const data = dataRef.current;
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    const maskImg = new Image();
    maskImg.crossOrigin = "anonymous";

    let loaded = 0;
    const onLoad = () => {
      loaded++;
      if (loaded < 2) return;

      // Sample the mask into a grid of influence values
      const offscreen = document.createElement("canvas");
      offscreen.width = img.width;
      offscreen.height = img.height;
      const octx = offscreen.getContext("2d")!;
      
      // Draw mask
      octx.drawImage(maskImg, 0, 0, img.width, img.height);
      const maskData = octx.getImageData(0, 0, img.width, img.height).data;

      // Sample influence per grid cell
      const influence = new Float32Array((GRID_COLS + 1) * (GRID_ROWS + 1));
      for (let gy = 0; gy <= GRID_ROWS; gy++) {
        for (let gx = 0; gx <= GRID_COLS; gx++) {
          const px = Math.floor((gx / GRID_COLS) * (img.width - 1));
          const py = Math.floor((gy / GRID_ROWS) * (img.height - 1));
          const idx = (py * img.width + px) * 4;
          // Use red channel (grayscale mask)
          influence[gy * (GRID_COLS + 1) + gx] = maskData[idx] / 255;
        }
      }

      data.img = img;
      data.mask = influence;
      data.ready = true;
    };

    img.onload = onLoad;
    maskImg.onload = onLoad;
    img.src = imageSrc;
    maskImg.src = maskSrc;

    return () => {
      data.ready = false;
    };
  }, [imageSrc, maskSrc]);

  // Animation loop
  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    const data = dataRef.current;
    if (!canvas || !data.ready) {
      frameRef.current = requestAnimationFrame(animate);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { img, mask } = data;
    const t = time * 0.001 * FLOW_SPEED;

    ctx.clearRect(0, 0, width, height);

    const cellW = width / GRID_COLS;
    const cellH = height / GRID_ROWS;
    const srcCellW = img.width / GRID_COLS;
    const srcCellH = img.height / GRID_ROWS;

    // Draw mesh: each grid cell is a deformed quad drawn as two triangles
    // For performance, we use drawImage with clipping per cell
    for (let gy = 0; gy < GRID_ROWS; gy++) {
      for (let gx = 0; gx < GRID_COLS; gx++) {
        // Source rectangle (from original image)
        const sx = gx * srcCellW;
        const sy = gy * srcCellH;

        // Get influence at the four corners
        const i00 = mask[gy * (GRID_COLS + 1) + gx];
        const i10 = mask[gy * (GRID_COLS + 1) + gx + 1];
        const i01 = mask[(gy + 1) * (GRID_COLS + 1) + gx];
        const i11 = mask[(gy + 1) * (GRID_COLS + 1) + gx + 1];
        const avgInfluence = (i00 + i10 + i01 + i11) * 0.25;

        if (avgInfluence < 0.01) {
          // No deformation — fast path
          ctx.drawImage(img, sx, sy, srcCellW, srcCellH,
            gx * cellW, gy * cellH, cellW, cellH);
          continue;
        }

        // Calculate displacement for this cell
        const centerX = (gx + 0.5) / GRID_COLS;
        const centerY = (gy + 0.5) / GRID_ROWS;
        
        const dx = Math.sin(t + centerY * WAVE_FREQ_Y * Math.PI * 2 + centerX * 1.5) 
                 * FLOW_AMOUNT_X * avgInfluence;
        const dy = Math.cos(t * 0.7 + centerX * WAVE_FREQ_X * Math.PI * 2 + centerY * 1.2) 
                 * FLOW_AMOUNT_Y * avgInfluence;

        // Draw displaced cell
        ctx.drawImage(img, sx, sy, srcCellW, srcCellH,
          gx * cellW + dx, gy * cellH + dy, cellW, cellH);
      }
    }

    frameRef.current = requestAnimationFrame(animate);
  }, [width, height]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [animate]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
    />
  );
}
