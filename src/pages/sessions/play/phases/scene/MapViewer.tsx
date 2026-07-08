import { useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import type { PointerEvent, WheelEvent } from 'react';
import { getAssetUrl } from '../../../../../utils/url';
import type { SceneDetail } from '../../../../../types';
import './MapViewer.css';

type Props = {
  scene: SceneDetail;
  justDiscoveredPoiId?: string | null;
  onPoiClick?: (poiId: string) => void;
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

// Pins de NPC são marcadores visuais geográficos (spec A00153 seção 4.1) —
// sem clique/interação; falar com NPC é ação delegada ao ActionDock/timeline.
// Pins de POI, fora do modo dev, abrem a bottom sheet de detalhes
// (POIDetailSheet) ao clique — spec 00153-mesa-jogo/scene.md seção 3.1.
export function MapViewer({ scene, justDiscoveredPoiId, onPoiClick }: Props) {
  const [scale] = useState(1);
  const offset = { x: 0, y: 0 };
  const [imageError, setImageError] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showNames, setShowNames] = useState(true);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Modo dev ("Modo Edição (Pins)"): arrastar um pin não persiste nada via
  // API — atualiza apenas o estado local em memória e loga a query SQL
  // UPDATE sugerida no console, para o desenvolvedor copiar manualmente
  // (spec A00153/scene.md seção 2).
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
      const id = draggingPinId.current;
      const coord = overrides[id];
      if (coord) {
        const isNpc = scene.npcs.some((npc) => npc.id === id);
        // Coordenadas reais moram em scene_npc_dialogues (por NPC) e
        // scene_points_of_interest (por POI) — não nas tabelas de descoberta
        // por sessão (sessions_scenes_npcs/sessions_scenes_poi), que só
        // guardam name_discovered/enabled por sessão (be-rpg PR #70).
        const table = isNpc ? 'scene_npc_dialogues' : 'scene_points_of_interest';
        console.log(
          `[mapviewer-dev] Reposicionado ${id} -> x=${coord.x.toFixed(1)} y=${coord.y.toFixed(1)}\n` +
            `UPDATE ${table} SET x_coordinate = ${coord.x.toFixed(1)}, y_coordinate = ${coord.y.toFixed(1)} WHERE id = '${id}';`
        );
      }
    }
    draggingPinId.current = null;
  }

  function handlePinPointerDown(id: string, event: PointerEvent<HTMLDivElement>) {
    if (!devMode) return;
    event.stopPropagation();
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
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
          className={`mapviewer-dev-toggle${showNames ? ' mapviewer-dev-toggle-active' : ''}`}
          onClick={() => setShowNames((v) => !v)}
        >
          {showNames ? 'Nomes ON' : 'Nomes OFF'}
        </button>
        <button
          type="button"
          className={`mapviewer-dev-toggle${devMode ? ' mapviewer-dev-toggle-active' : ''}`}
          onClick={() => setDevMode((v) => !v)}
        >
          Modo Edição (Pins) {devMode ? 'ON' : 'OFF'}
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
          {scene.map_url ? (
            <img
              className="mapviewer-image"
              src={getAssetUrl(scene.map_url)}
              alt="Mapa da cena"
              draggable={false}
              onError={handleImageError}
            />
          ) : (
            <div className="mapviewer-placeholder">
              <span className="material-symbols-outlined">map</span>
              <p>Mapa ainda não gerado para esta cena.</p>
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
                  <img src={getAssetUrl(npc.avatar_url)} alt={npc.name} draggable={false} />
                ) : (
                  <span className="material-symbols-outlined">person</span>
                )}
                <span
                  className={`mapviewer-pin-label${!showNames && !devMode ? ' mapviewer-pin-label-hover-only' : ''}`}
                >
                  {npc.name}
                  {devMode && ` — X: ${position.left.toFixed(1)} | Y: ${position.top.toFixed(1)}`}
                </span>
              </div>
            );
          })}

          {scene.points_of_interest
            // `enabled` não vem mais neste payload (be-rpg PR #70) — o
            // backend já filtra apenas POIs habilitados na query.
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
                  onClick={() => !devMode && onPoiClick?.(poi.id)}
                  aria-label={poi.display_name}
                >
                  <span className="material-symbols-outlined">place</span>
                  <span
                    className={`mapviewer-pin-label${!showNames && !devMode ? ' mapviewer-pin-label-hover-only' : ''}`}
                  >
                    {poi.display_name}
                    {devMode && ` — X: ${position.left.toFixed(1)} | Y: ${position.top.toFixed(1)}`}
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
