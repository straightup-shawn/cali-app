import { useRef, useState, useEffect, useCallback } from 'react';

// =============================================================================
// Props
// =============================================================================

interface ImageCropperProps {
  imageFile: File;
  onCrop: (croppedFile: File) => void;
  onCancel: () => void;
}

// =============================================================================
// ImageCropper — full-screen modal with center-square crop via Canvas
// =============================================================================

export default function ImageCropper({ imageFile, onCrop, onCancel }: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);
  const [processing, setProcessing] = useState(false);

  // Offset for drag-to-reposition
  const [offsetY, setOffsetY] = useState(0);
  const [maxOffset, setMaxOffset] = useState(0);
  const dragRef = useRef<{ startY: number; startOffset: number } | null>(null);

  // Create object URL for the selected file
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  // Load image element to get natural dimensions
  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      setImgEl(img);
      // Calculate max vertical offset for dragging
      // Image is displayed at full width, so rendered height = (naturalHeight / naturalWidth) * viewWidth
      // The crop square is min(viewWidth, viewHeight) sized — we allow vertical pan
      const aspect = img.naturalHeight / img.naturalWidth;
      // If aspect > 1, image is taller than wide — user can pan vertically
      if (aspect > 1) {
        // In our layout the image fills width. Extra height = (aspect - 1) * width
        // But we only need the relative offset in natural pixels
        const cropSize = img.naturalWidth; // square crop = width of image
        const extraHeight = img.naturalHeight - cropSize;
        setMaxOffset(extraHeight);
        setOffsetY(Math.round(extraHeight / 2)); // start centered
      } else {
        setMaxOffset(0);
        setOffsetY(0);
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Touch/pointer handlers for vertical drag
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragRef.current = { startY: e.clientY, startOffset: offsetY };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [offsetY],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current || !imgEl) return;
      const deltaScreen = e.clientY - dragRef.current.startY;
      // Convert screen delta to image-space delta
      // Displayed width = container width (let's approximate with window.innerWidth)
      const displayedWidth = window.innerWidth;
      const scale = imgEl.naturalWidth / displayedWidth;
      const deltaImage = -deltaScreen * scale;
      const newOffset = Math.max(0, Math.min(maxOffset, dragRef.current.startOffset + deltaImage));
      setOffsetY(newOffset);
    },
    [imgEl, maxOffset],
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Process crop with Canvas
  const handleCrop = useCallback(async () => {
    if (!imgEl) return;
    setProcessing(true);

    const canvas = canvasRef.current!;
    const OUTPUT_SIZE = 1080;
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext('2d')!;

    // Determine source rectangle (square crop from natural image)
    const cropSize = Math.min(imgEl.naturalWidth, imgEl.naturalHeight);
    const sx = Math.round((imgEl.naturalWidth - cropSize) / 2);
    const sy = imgEl.naturalWidth <= imgEl.naturalHeight ? Math.round(offsetY) : 0;

    ctx.drawImage(imgEl, sx, sy, cropSize, cropSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Export as blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setProcessing(false);
          return;
        }
        const croppedFile = new File([blob], imageFile.name.replace(/\.\w+$/, '.jpg'), {
          type: 'image/jpeg',
        });
        onCrop(croppedFile);
      },
      'image/jpeg',
      0.9,
    );
  }, [imgEl, offsetY, imageFile.name, onCrop]);

  // Calculate preview transform to show the crop area
  const previewTranslateY = (() => {
    if (!imgEl || maxOffset === 0) return 0;
    // Map offsetY (0..maxOffset) to CSS translateY
    const fraction = offsetY / maxOffset;
    const displayedWidth = window.innerWidth;
    const displayedHeight = (imgEl.naturalHeight / imgEl.naturalWidth) * displayedWidth;
    const excessHeight = displayedHeight - displayedWidth; // crop frame = displayedWidth square
    return -(fraction * excessHeight);
  })();

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-medium text-gray-300 hover:text-white"
        >
          Cancel
        </button>
        <span className="text-sm font-semibold text-white">Crop Photo</span>
        <button
          type="button"
          onClick={handleCrop}
          disabled={processing || !imgEl}
          className="text-sm font-semibold text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
        >
          {processing ? 'Processing…' : 'Crop & Upload'}
        </button>
      </div>

      {/* Image preview with crop overlay */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        {imageUrl && (
          <div
            className="relative w-full touch-none select-none"
            style={{ height: '100vw', overflow: 'hidden' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full pointer-events-none"
              draggable={false}
              style={{
                transform: `translateY(${previewTranslateY}px)`,
                transition: dragRef.current ? 'none' : 'transform 0.1s ease-out',
              }}
            />
            {/* Crop overlay — darkened edges */}
            <div className="pointer-events-none absolute inset-0">
              {/* Square frame border */}
              <div className="absolute inset-0 border-2 border-white/60" />
            </div>
          </div>
        )}

        {/* Darkened areas above and below the crop frame */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-[calc((100%-100vw)/2)] bg-black/60" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[calc((100%-100vw)/2)] bg-black/60" />
      </div>

      {/* Hint text */}
      {maxOffset > 0 && (
        <p className="pb-2 text-center text-xs text-gray-500">
          Drag to reposition
        </p>
      )}

      {/* Bottom buttons (alternative for accessibility) */}
      <div className="flex gap-3 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-gray-600 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCrop}
          disabled={processing || !imgEl}
          className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
        >
          {processing ? 'Processing…' : 'Crop & Upload'}
        </button>
      </div>
    </div>
  );
}
