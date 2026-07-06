import { useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import type { PointerEvent, WheelEvent } from 'react';
import { getAssetUrl } from '../../../utils/url';
import type { SceneDetail } from '../../../types';
import './MapViewer.css';

type Props = {
  scene: SceneDetail;
  justDiscoveredPoiId?: string | null;
};

// Zoom via wheel desligado temporariamente — constantes mantidas para religar.
// const MIN_SCALE = 0.6;
// const MAX_SCALE = 2.5;

const GRID_SIZE = 10; // matriz 10x10 (10% por célula)

// NOTA: `scenes.npcs`/`points_of_interest` já trazem `x_coordinate`/
// `y_coordinate` reais (0-100) definidos pelo mestre — usados como posição
// principal do pin. `hashToPercent` fica apenas como fallback determinístico
// (não aleatório, para não "pular" a cada re-render) para os casos em que a
// coordenada ainda não foi cadastrada (ex: NPCs/POIs legados sem posição).
function hashToPercent(id: string, salt: number): number {
  let hash = salt;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 12 + (hash % 76); // mantém os pins entre 12% e 88% do canvas
}

function resolvePosition(
  coordX: number | null | undefined,
  coordY: number | null | undefined,
  id: string,
  saltX: number,
  saltY: number
): { left: number; top: number } {
  return {
    left: typeof coordX === 'number' ? coordX : hashToPercent(id, saltX),
    top: typeof coordY === 'number' ? coordY : hashToPercent(id, saltY),
  };
}

type DevOverride = { x: number; y: number };

// Pins de NPC/POI são puramente marcadores visuais geográficos (spec A00153
// seção 4.1) — sem clique/interação. Falar com NPC e investigar POI são
// ações delegadas ao ActionDock/timeline, nunca ao pin no mapa.
export function MapViewer({ scene, justDiscoveredPoiId }: Props) {
  const [scale] = useState(1);
  const offset = { x: 0, y: 0 };
  const [imageError, setImageError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Modo dev: arrastar pins pra descobrir a posição x/y (%) real no mapa,
  // sem persistir nada — só pra calibrar as coordenadas manualmente no banco.
  const [devMode, setDevMode] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, DevOverride>>({});
  const draggingPinId = useRef<string | null>(null);

  function handleImageError(event: SyntheticEvent<HTMLImageElement>) {
    setImageError(event.currentTarget.src);
  }

  // Zoom via wheel desligado temporariamente.
  function handleWheel(_event: WheelEvent<HTMLDivElement>) {}

  // Pan do mapa (arrastar o canvas inteiro) desligado — só o drag de pins
  // em modo dev é permitido.
  function handlePointerDown(_event: PointerEvent<HTMLDivElement>) {}

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!draggingPinId.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
    setOverrides((current) => ({ ...current, [draggingPinId.current as string]: { x, y } }));
  }

  function handlePointerUp() {
    if (draggingPinId.current) {
      const coord = overrides[draggingPinId.current];
      if (coord) {
        console.log(`[mapviewer-dev] ${draggingPinId.current} -> x=${coord.x.toFixed(1)} y=${coord.y.toFixed(1)}`);
      }
    }
    draggingPinId.current = null;
  }

  function handlePinPointerDown(id: string, event: PointerEvent<HTMLDivElement>) {
    if (!devMode) return;
    event.stopPropagation();
    event.preventDefault();
    draggingPinId.current = id;
  }

  return (
    <div className="mapviewer-wrapper">
      <div className="mapviewer-toolbar">
        <button
          type="button"
          className={`mapviewer-dev-toggle${showGrid ? ' mapviewer-dev-toggle-active' : ''}`}
          onClick={() => setShowGrid((v) => !v)}
        >
          {showGrid ? 'Grid ON' : 'Grid OFF'}
        </button>
        <button
          type="button"
          className={`mapviewer-dev-toggle${devMode ? ' mapviewer-dev-toggle-active' : ''}`}
          onClick={() => setDevMode((v) => !v)}
        >
          {devMode ? 'Dev: arrastar ON' : 'Dev: arrastar OFF'}
        </button>
      </div>

      <div
        className="mapviewer-root"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div
          ref={canvasRef}
          className="mapviewer-canvas"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
        >
          {scene.map_image_url ? (
            <img
              className="mapviewer-image"
              src={getAssetUrl(scene.map_image_url)}
              alt={scene.map_prompt ?? 'Mapa da cena'}
              draggable={false}
              onError={handleImageError}
            />
          ) : (
            <div className="mapviewer-placeholder">
              <span className="material-symbols-outlined">map</span>
              <p>{scene.map_prompt ?? 'Mapa ainda não gerado para esta cena.'}</p>
            </div>
          )}

          {imageError && (
            <div className="mapviewer-placeholder mapviewer-image-error">
              <span className="material-symbols-outlined">broken_image</span>
              <p>Falha ao carregar imagem do mapa:</p>
              <code>{imageError}</code>
            </div>
          )}

          {showGrid && (
            <div
              className="mapviewer-grid"
              style={{
                backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`,
              }}
            />
          )}

          {scene.npcs.map((npc, index) => {
            const override = overrides[npc.id];
            const position = override
              ? { left: override.x, top: override.y }
              : resolvePosition(npc.x_coordinate, npc.y_coordinate, npc.id, index + 1, index + 17);
            return (
              <div
                key={npc.id}
                className={`mapviewer-pin mapviewer-pin-npc${devMode ? ' mapviewer-pin-dev' : ''}`}
                style={{ left: `${position.left}%`, top: `${position.top}%` }}
                onPointerDown={(event) => handlePinPointerDown(npc.id, event)}
                aria-label={npc.name}
              >
                {npc.avatar_url ? (
                  <img src={getAssetUrl(npc.avatar_url)} alt={npc.name} />
                ) : (
                  <span className="material-symbols-outlined">person</span>
                )}
                <span className="mapviewer-pin-label">
                  {npc.name}
                  {devMode && ` (${position.left.toFixed(1)}, ${position.top.toFixed(1)})`}
                </span>
              </div>
            );
          })}

          {scene.points_of_interest
            .filter((poi) => poi.enabled)
            .map((poi, index) => {
              const override = overrides[poi.id];
              const position = override
                ? { left: override.x, top: override.y }
                : resolvePosition(poi.x_coordinate, poi.y_coordinate, poi.id, index + 3, index + 23);
              const justDiscovered = poi.id === justDiscoveredPoiId;
              return (
                <div
                  key={poi.id}
                  className={`mapviewer-pin mapviewer-pin-poi${
                    justDiscovered ? ' mapviewer-pin-poi-discovered' : ''
                  }${devMode ? ' mapviewer-pin-dev' : ''}`}
                  style={{ left: `${position.left}%`, top: `${position.top}%` }}
                  onPointerDown={(event) => handlePinPointerDown(poi.id, event)}
                  aria-label={poi.name}
                >
                  <span className="material-symbols-outlined">place</span>
                  <span className="mapviewer-pin-label">
                    {poi.name}
                    {devMode && ` (${position.left.toFixed(1)}, ${position.top.toFixed(1)})`}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {devMode && Object.keys(overrides).length > 0 && (
        <div className="mapviewer-dev-panel">
          {Object.entries(overrides).map(([id, coord]) => (
            <code key={id}>
              {id}: x={coord.x.toFixed(1)} y={coord.y.toFixed(1)}
            </code>
          ))}
        </div>
      )}
    </div>
  );
}
