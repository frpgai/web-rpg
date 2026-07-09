import { render, screen } from '@testing-library/react';
import { SessionBottomNav } from './SessionBottomNav';

describe('SessionBottomNav', () => {
  it('renderiza as 4 abas Sessão/Chat/World Map/Options com a aba Sessão ativa', () => {
    render(<SessionBottomNav />);

    const sessionTab = screen.getByRole('button', { name: /sessão/i });
    expect(sessionTab).toBeInTheDocument();
    expect(sessionTab.className).toContain('sessionbottomnav-tab-active');

    expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /world map/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /options/i })).toBeInTheDocument();
  });
});
