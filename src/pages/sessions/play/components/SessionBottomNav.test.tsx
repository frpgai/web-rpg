import { render, screen } from '@testing-library/react';
import { SessionBottomNav } from './SessionBottomNav';

describe('SessionBottomNav', () => {
  it('renderiza as 4 abas Missões/Log/Equipe/Grimório com a aba Log ativa', () => {
    render(<SessionBottomNav sessionId="test-session" sceneId="test-scene" />);

    const logTab = screen.getByRole('button', { name: /log/i });
    expect(logTab).toBeInTheDocument();
    expect(logTab.className).toContain('sessionbottomnav-tab-active');

    expect(screen.getByRole('button', { name: /missões/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /equipe/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /grimório/i })).toBeInTheDocument();
  });
});
