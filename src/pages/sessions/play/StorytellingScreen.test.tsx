import { render, screen } from '@testing-library/react';
import { StorytellingScreen } from './StorytellingScreen';
import type { Adventure } from '../../../types';

const adventure: Adventure = {
  id: 'adv-1',
  title: 'Capítulo 1: As Noites que Devoram',
  media_url: null,
  media_type: null,
  audio_transition_file: null,
  transition_sfx: null,
  intro_narration: 'Thornwick nunca foi uma vila de sons vibrantes.\n\nNas sombras, algo espreita.',
  intro_narration_audio_file: null,
  narration_style: null,
  ambient_soundtrack_file: null,
  ambient_soundtrack: null,
};

describe('StorytellingScreen', () => {
  it('renderiza o título, o eyebrow e o divisor cinematográfico', () => {
    render(<StorytellingScreen adventure={adventure} sessionName="Mesa de Sexta" onEnter={vi.fn()} />);

    expect(screen.getByText('Capítulo 1: As Noites que Devoram')).toBeInTheDocument();
    expect(screen.getByText('A Jornada Começa')).toBeInTheDocument();
    expect(document.querySelector('.storytelling-divider')).not.toBeNull();
  });

  it('renderiza os parágrafos de narração e o visualizador de voz com 8 barras', () => {
    render(<StorytellingScreen adventure={adventure} sessionName="Mesa de Sexta" onEnter={vi.fn()} />);

    const paragraphs = document.querySelectorAll('.storytelling-paragraph');
    expect(paragraphs).toHaveLength(2);

    const waveBars = document.querySelectorAll('.storytelling-wave-bar');
    expect(waveBars).toHaveLength(8);
  });

  it('renderiza o CTA desabilitado até a narração terminar', () => {
    render(<StorytellingScreen adventure={adventure} sessionName="Mesa de Sexta" onEnter={vi.fn()} />);

    const cta = screen.getByRole('button', { name: /entrar no capítulo/i });
    expect(cta).toBeDisabled();
    expect(cta.className).not.toContain('storytelling-cta-visible');
  });

  it('renderiza fallback de mídia quando a aventura não tem media_url', () => {
    render(<StorytellingScreen adventure={adventure} sessionName="Mesa de Sexta" onEnter={vi.fn()} />);
    expect(document.querySelector('.storytelling-media-fallback')).not.toBeNull();
  });

  it('renderiza o SessionHeader com o nome da sessão', () => {
    render(<StorytellingScreen adventure={adventure} sessionName="Mesa de Sexta" onEnter={vi.fn()} />);
    expect(screen.getByRole('heading', { name: 'Mesa de Sexta' })).toBeInTheDocument();
  });
});
