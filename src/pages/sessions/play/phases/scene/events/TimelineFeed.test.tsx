import { render, screen } from '@testing-library/react';
import '../../../../../../i18n';
import { TimelineFeed } from './TimelineFeed';
import type { SceneDetail, SessionEvent, SessionPlayerDetail } from '../../../../../../types';

function baseScene(overrides: Partial<SceneDetail> = {}): SceneDetail {
  return {
    id: 'scene-1',
    npcs: [],
    points_of_interest: [
      { id: 'poi-statue', display_name: 'Estatueta Escondida no Arbusto' },
    ],
    ...overrides,
  } as SceneDetail;
}

const players: SessionPlayerDetail[] = [
  {
    user_id: 'user-1',
    username: 'felipe_user',
    is_owner: true,
    is_ready: true,
    hero: { id: 'hero-1', name: 'Felipe', class: 'Guerreiro', level: 1, avatar_url: null },
  },
];

function sceneInvestigationEvent(overrides: Partial<SessionEvent> = {}): SessionEvent {
  return {
    id: 'event-1',
    session_id: 'session-1',
    scene_id: 'scene-1',
    type: 'scene_investigation',
    hero_id: 'hero-1',
    skill_check: 'perception',
    roll: 6,
    modifier: 2,
    total: 8,
    success: false,
    discovered_poi_ids: [],
    payload: null,
    created_at: new Date().toISOString(),
    ...overrides,
  } as SessionEvent;
}

describe('TimelineFeed — scene_investigation', () => {
  it('cenário 1: falha (total < 10) mostra texto de busca sem sucesso', () => {
    const scene = baseScene();
    const event = sceneInvestigationEvent();

    render(<TimelineFeed scene={scene} events={[event]} loading={false} players={players} />);

    expect(
      screen.getByText(
        'Felipe vasculhou o local e rolou Percepção: 6 + 2 = 8 (Falha). Você fez uma busca rápida, mas não foi muito meticuloso e não encontrou nada.',
      ),
    ).toBeInTheDocument();
  });

  it('cenário 2: sucesso sem POIs descobertos', () => {
    const scene = baseScene();
    const event = sceneInvestigationEvent({ roll: 11, total: 13, success: true, discovered_poi_ids: [] });

    render(<TimelineFeed scene={scene} events={[event]} loading={false} players={players} />);

    expect(
      screen.getByText(
        'Felipe vasculhou o local e rolou Percepção: 11 + 2 = 13 (Sucesso). Você vasculhou a área com atenção, mas não parece haver nada escondido por aqui.',
      ),
    ).toBeInTheDocument();
  });

  it('cenário 3: sucesso com POI(s) descoberto(s)', () => {
    const scene = baseScene();
    const event = sceneInvestigationEvent({
      roll: 15,
      total: 17,
      success: true,
      discovered_poi_ids: ['poi-statue'],
    });

    render(<TimelineFeed scene={scene} events={[event]} loading={false} players={players} />);

    expect(
      screen.getByText(
        'Felipe vasculhou o local e rolou Percepção: 15 + 2 = 17 (Sucesso). Revelou: Estatueta Escondida no Arbusto.',
      ),
    ).toBeInTheDocument();
  });
});
