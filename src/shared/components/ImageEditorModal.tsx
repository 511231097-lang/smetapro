import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Slider,
  Stack,
  Text,
} from '@mantine/core';
import { IconMinus, IconPlus, IconReload, IconX } from '@tabler/icons-react';
import {
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

const PREVIEW_SIZE = 300;
const OUTPUT_SIZE = 600;
const MIN_ZOOM = 20;
const MAX_ZOOM = 180;
const DEFAULT_ZOOM = 100;
const ZOOM_STEP = 5;

type CropShape = 'circle' | 'rounded';

type EditorSource = {
  file: File;
  url: string;
};

type ImageEditorModalProps = {
  opened: boolean;
  source: EditorSource | null;
  shape: CropShape;
  loading?: boolean;
  onClose: () => void;
  onSave: (file: File) => Promise<void> | void;
};

type Point = {
  x: number;
  y: number;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getOutputType = (file: File) => {
  const nextType = file.type.toLowerCase();
  if (
    nextType === 'image/png' ||
    nextType === 'image/jpeg' ||
    nextType === 'image/jpg' ||
    nextType === 'image/gif'
  ) {
    return nextType === 'image/jpg' ? 'image/jpeg' : nextType;
  }

  return 'image/png';
};

const toOutputFileName = (fileName: string, mimeType: string) => {
  const extMap: Record<string, string> = {
    'image/gif': 'gif',
    'image/jpeg': 'jpg',
    'image/png': 'png',
  };
  const nextExt = extMap[mimeType] ?? 'png';
  const baseName = fileName.replace(/\.[^/.]+$/, '') || 'image';
  return `${baseName}.${nextExt}`;
};

const getDisplaySize = (
  imageSize: { width: number; height: number },
  zoom: number,
) => {
  const baseScale = Math.max(
    PREVIEW_SIZE / imageSize.width,
    PREVIEW_SIZE / imageSize.height,
  );
  const scale = baseScale * (zoom / 100);

  return {
    height: imageSize.height * scale,
    width: imageSize.width * scale,
  };
};

const clampOffset = (offset: Point, width: number, height: number): Point => {
  const maxX = Math.max((width - PREVIEW_SIZE) / 2, 0);
  const maxY = Math.max((height - PREVIEW_SIZE) / 2, 0);

  return {
    x: clamp(offset.x, -maxX, maxX),
    y: clamp(offset.y, -maxY, maxY),
  };
};

const ImageEditorModal = ({
  opened,
  source,
  shape,
  loading = false,
  onClose,
  onSave,
}: ImageEditorModalProps) => {
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{
    pointerX: number;
    pointerY: number;
    startOffset: Point;
  } | null>(null);

  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!source?.url) return;

    const image = new Image();
    image.onload = () => {
      setImageSize({
        width: image.naturalWidth || 1,
        height: image.naturalHeight || 1,
      });
      setOffset({ x: 0, y: 0 });
      setZoom(DEFAULT_ZOOM);
    };
    image.src = source.url;
  }, [source?.url]);

  useEffect(() => {
    if (!opened) {
      setDragStart(null);
    }
  }, [opened]);

  const displaySize = useMemo(
    () => getDisplaySize(imageSize, zoom),
    [imageSize, zoom],
  );

  useEffect(() => {
    setOffset((current) =>
      clampOffset(current, displaySize.width, displaySize.height),
    );
  }, [displaySize.height, displaySize.width]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!source || loading) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({
      pointerX: event.clientX,
      pointerY: event.clientY,
      startOffset: offset,
    });
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragStart) return;

    const deltaX = event.clientX - dragStart.pointerX;
    const deltaY = event.clientY - dragStart.pointerY;
    const nextOffset = clampOffset(
      {
        x: dragStart.startOffset.x + deltaX,
        y: dragStart.startOffset.y + deltaY,
      },
      displaySize.width,
      displaySize.height,
    );

    setOffset(nextOffset);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragStart(null);
  };

  const applyZoom = (nextZoom: number) => {
    setZoom(clamp(nextZoom, MIN_ZOOM, MAX_ZOOM));
  };

  const resetEditor = () => {
    setZoom(DEFAULT_ZOOM);
    setOffset({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    if (!source || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(
        OUTPUT_SIZE / 2,
        OUTPUT_SIZE / 2,
        OUTPUT_SIZE / 2,
        0,
        Math.PI * 2,
      );
      ctx.closePath();
      ctx.clip();
    }

    const scaleFactor = OUTPUT_SIZE / PREVIEW_SIZE;
    const drawWidth = displaySize.width * scaleFactor;
    const drawHeight = displaySize.height * scaleFactor;
    const drawX = OUTPUT_SIZE / 2 - drawWidth / 2 + offset.x * scaleFactor;
    const drawY = OUTPUT_SIZE / 2 - drawHeight / 2 + offset.y * scaleFactor;

    ctx.drawImage(imageRef.current, drawX, drawY, drawWidth, drawHeight);

    const outputType = getOutputType(source.file);
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, outputType, 0.92);
    });

    if (!blob) return;

    const outputFile = new File(
      [blob],
      toOutputFileName(source.file.name, outputType),
      {
        type: outputType,
        lastModified: Date.now(),
      },
    );

    await onSave(outputFile);
  };

  const sliderMarks = [
    { value: 20, label: '20%' },
    { value: 100, label: '100%' },
    { value: 180, label: '180%' },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      withCloseButton={false}
      centered
      radius="sm"
      size={440}
      styles={{
        content: {
          borderRadius: 4,
          boxShadow: 'var(--mantine-shadow-sm)',
        },
        body: {
          padding: 16,
        },
      }}
    >
      <Stack gap={24}>
        <Group justify="space-between" wrap="nowrap">
          <Text size="md" lh="24px">
            Редактирование изображения
          </Text>
          <ActionIcon
            variant="transparent"
            color="gray"
            size={16}
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Закрыть"
          >
            <IconX size={16} />
          </ActionIcon>
        </Group>

        <Text size="sm" c="dimmed" lh="20px">
          Перемещайте и изменяйте масштаб изображения, чтобы выбрать нужную
          область
        </Text>

        <Stack gap={24} pb={12}>
          <div
            role="presentation"
            style={{
              width: PREVIEW_SIZE,
              height: PREVIEW_SIZE,
              margin: '0 auto',
              border: '1.5px solid var(--mantine-color-default-border)',
              borderRadius: shape === 'circle' ? 9999 : 32,
              overflow: 'hidden',
              position: 'relative',
              cursor: dragStart ? 'grabbing' : 'grab',
              touchAction: 'none',
              userSelect: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
          >
            {source?.url ? (
              <img
                ref={imageRef}
                src={source.url}
                alt="Редактируемое изображение"
                draggable={false}
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: displaySize.width,
                  height: displaySize.height,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  objectFit: 'cover',
                  pointerEvents: 'none',
                }}
              />
            ) : null}
          </div>

          <Group align="center" gap={12} wrap="nowrap">
            <ActionIcon
              variant="default"
              color="gray"
              size={32}
              onClick={() => applyZoom(zoom - ZOOM_STEP)}
              disabled={loading}
              aria-label="Уменьшить"
            >
              <IconMinus size={18} />
            </ActionIcon>

            <Slider
              value={zoom}
              onChange={applyZoom}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={1}
              marks={sliderMarks}
              disabled={loading}
              label={null}
              style={{ flex: 1 }}
            />

            <ActionIcon
              variant="default"
              color="gray"
              size={32}
              onClick={() => applyZoom(zoom + ZOOM_STEP)}
              disabled={loading}
              aria-label="Увеличить"
            >
              <IconPlus size={18} />
            </ActionIcon>

            <ActionIcon
              variant="default"
              color="gray"
              size={32}
              onClick={resetEditor}
              disabled={loading}
              aria-label="Сбросить"
            >
              <IconReload size={18} />
            </ActionIcon>
          </Group>
        </Stack>

        <Group justify="flex-end" gap={12}>
          <Button
            variant="default"
            type="button"
            onClick={onClose}
            disabled={loading}
          >
            Отменить
          </Button>
          <Button type="button" onClick={handleSave} loading={loading}>
            Сохранить
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export type { CropShape };
export type { EditorSource };
export default ImageEditorModal;
