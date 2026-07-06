import { useRef, useState } from 'react';
import type { PointerEvent, WheelEvent } from 'react';
import { getAssetUrl } from '../../../utils/url';
import type { SceneDetail, SceneNPC, ScenePointOfInterest } from '../../../types';
import './MapViewer.css';

type Props = {
  scene: SceneDetail;
  onSelectNpc: (npc: SceneNPC) => void;
  onSelectPoi: (poi: ScenePointOfInterest) => void;
  // id do POI recém-descoberto via "Investigar" (sucesso) — recebe o pulso
  // luminoso dourado de descoberta por alguns segundos.
  discoveredPoiId?: string | null;
};

const MIN_SCALE = 0.6;
const MAX_SCALE = 2.5;

// NOTA (limitação conhecida): `scene_points_of_interest` já tem colunas reais
// de coordenada (x_coordinate/y_coordinate, 0-100, be-rpg commit 7d69de2),
// usadas abaixo. `scenes.npcs` ainda NÃO tem coluna de posição no backend —
// os pins de NPC continuam com posição determinística (hash do id) até que
// o schema seja estendido para NPCs também.
function hashToPercent(id: string, salt: number): number {
  let hash = salt;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return 12 + (hash % 76); // mantém os pins entre 12% e 88% do canvas
}

export function MapViewer({ scene, onSelectNpc, onSelectPoi, discoveredPoiId }: Props) {
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

        {scene.npcs.map((npc, index) => (
          <button
            key={npc.id}
            type="button"
            className="mapviewer-pin mapviewer-pin-npc"
            style={{
              left: `${hashToPercent(npc.id, index + 1)}%`,
              top: `${hashToPercent(npc.id, index + 17)}%`,
            }}
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
        ))}

        {scene.points_of_interest
          .filter((poi) => poi.enabled)
          .map((poi, index) => (
            <button
              key={poi.id}
              type="button"
              className={`mapviewer-pin mapviewer-pin-poi${
                poi.id === discoveredPoiId ? ' mapviewer-pin-discovered' : ''
              }`}
              style={{
                left: `${poi.x_coordinate ?? hashToPercent(poi.id, index + 3)}%`,
                top: `${poi.y_coordinate ?? hashToPercent(poi.id, index + 23)}%`,
              }}
              onClick={() => onSelectPoi(poi)}
              aria-label={poi.name}
            >
              <span className="material-symbols-outlined">place</span>
              <span className="mapviewer-pin-label">{poi.name}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
