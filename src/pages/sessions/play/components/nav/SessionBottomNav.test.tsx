import { render, screen } from '@testing-library/react';
import { SessionBottomNav } from './SessionBottomNav';

describe('SessionBottomNav', () => {
  it('renderiza as 4 abas Missões/Eventos/Equipe/Grimório com a aba Eventos ativa', () => {
    render(
      <SessionBottomNav sessionId="test-session" sceneId="test-scene" hasUnread={false} refresh={() => {}} />
    );

    const eventsTab = screen.getByRole('button', { name: /eventos/i });
    expect(eventsTab).toBeInTheDocument();
    expect(eventsTab.className).toContain('sessionbottomnav-tab-active');

    expect(screen.getByRole('button', { name: /missões/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /equipe/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /grimório/i })).toBeInTheDocument();
  });
});
