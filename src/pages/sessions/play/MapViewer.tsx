import { useRef, useState } from 'react';
import type { PointerEvent, WheelEvent } from 'react';
import { getAssetUrl } from '../../../utils/url';
import type { SceneDetail, SceneNPC, ScenePointOfInterest } from '../../../types';
import './MapViewer.css';

type Props = {
  scene: SceneDetail;
  onSelectNpc: (npc: SceneNPC) => void;
  onSelectPoi: (poi: ScenePointOfInterest) => void;
  justDiscoveredPoiId?: string | null;
};

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.5;

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

export function MapViewer({ scene, onSelectNpc, onSelectPoi, justDiscoveredPoiId }: Props) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragOrigin = useRef<{ x: number; y: number } | null>(null);

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setScale((current) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, current - event.deltaY * 0.001)));
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    dragOrigin.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!dragOrigin.current) return;
    setOffset({ x: event.clientX - dragOrigin.current.x, y: event.clientY - dragOrigin.current.y });
  }

  function handlePointerUp() {
    dragOrigin.current = null;
  }

  return (
    <div
      className="mapviewer-root"
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className="mapviewer-canvas"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
      >
        {scene.map_image_url ? (
          <img
            className="mapviewer-image"
            src={getAssetUrl(scene.map_image_url)}
            alt={scene.map_prompt ?? 'Mapa da cena'}
            draggable={false}
          />
        ) : (
          <div className="mapviewer-placeholder">
            <span className="material-symbols-outlined">map</span>
            <p>{scene.map_prompt ?? 'Mapa ainda não gerado para esta cena.'}</p>
          </div>
        )}

        {scene.npcs.map((npc, index) => {
          const position = resolvePosition(npc.x_coordinate, npc.y_coordinate, npc.id, index + 1, index + 17);
          return (
            <button
              key={npc.id}
              type="button"
              className="mapviewer-pin mapviewer-pin-npc"
              style={{ left: `${position.left}%`, top: `${position.top}%` }}
              onClick={() => onSelectNpc(npc)}
              aria-label={`Falar com ${npc.name}`}
            >
              {npc.avatar_url ? (
                <img src={getAssetUrl(npc.avatar_url)} alt={npc.name} />
              ) : (
                <span className="material-symbols-outlined">person</span>
              )}
              <span className="mapviewer-pin-label">{npc.name}</span>
            </button>
          );
        })}

        {scene.points_of_interest
          .filter((poi) => poi.enabled)
          .map((poi, index) => {
            const position = resolvePosition(poi.x_coordinate, poi.y_coordinate, poi.id, index + 3, index + 23);
            const justDiscovered = poi.id === justDiscoveredPoiId;
            return (
              <button
                key={poi.id}
                type="button"
                className={`mapviewer-pin mapviewer-pin-poi${
                  justDiscovered ? ' mapviewer-pin-poi-discovered' : ''
                }`}
                style={{ left: `${position.left}%`, top: `${position.top}%` }}
                onClick={() => onSelectPoi(poi)}
                aria-label={poi.name}
              >
                <span className="material-symbols-outlined">place</span>
                <span className="mapviewer-pin-label">{poi.name}</span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
