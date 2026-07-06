import { render, screen, fireEvent } from '@testing-library/react';
import { SessionHeader } from './SessionHeader';

describe('SessionHeader', () => {
  it('renderiza o título centralizado e os ícones de menu/configurações', () => {
    render(<SessionHeader title="Mesa de Sexta" />);

    expect(screen.getByRole('heading', { name: 'Mesa de Sexta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abrir menu' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Configurações' })).toBeInTheDocument();
  });

  it('dispara onMenuPress e onSettingsPress ao clicar', () => {
    const onMenuPress = vi.fn();
    const onSettingsPress = vi.fn();
    render(
      <SessionHeader title="Mesa de Sexta" onMenuPress={onMenuPress} onSettingsPress={onSettingsPress} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Configurações' }));

    expect(onMenuPress).toHaveBeenCalledTimes(1);
    expect(onSettingsPress).toHaveBeenCalledTimes(1);
  });
});
