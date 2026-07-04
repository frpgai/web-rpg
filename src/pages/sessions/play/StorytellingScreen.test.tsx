import { render, screen } from '@testing-library/react';
import { StorytellingScreen } from './StorytellingScreen';
import type { Adventure } from '../../../types';

const adventure: Adventure = {
  id: 'adv-1',
  title: 'Capítulo 1: As Noites que Devoram',
  media_url: null,
  media_type: null,
  intro_narration: 'Primeiro parágrafo.\n\nSegundo parágrafo.',
};

describe('StorytellingScreen', () => {
  it('renders the eyebrow, title, divider and narration paragraphs', () => {
    const { container } = render(<StorytellingScreen adventure={adventure} onEnter={vi.fn()} />);

    expect(screen.getByText('A Jornada Começa')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: adventure.title })).toBeInTheDocument();
    expect(container.querySelector('.storytelling-divider')).toBeInTheDocument();
    expect(container.querySelectorAll('.storytelling-paragraph')).toHaveLength(2);
  });

  it('shows the voice wave visualizer while narration is playing', () => {
    const { container } = render(<StorytellingScreen adventure={adventure} onEnter={vi.fn()} />);

    expect(container.querySelector('.storytelling-voice-wave')).toBeInTheDocument();
    expect(container.querySelectorAll('.storytelling-voice-wave-bar')).toHaveLength(8);
  });

  it('renders a disabled CTA with icon and label until narration ends', () => {
    render(<StorytellingScreen adventure={adventure} onEnter={vi.fn()} />);

    const cta = screen.getByRole('button', { name: /Iniciar Capítulo/i });
    expect(cta).toBeDisabled();
    expect(cta.className).not.toContain('storytelling-cta-visible');
  });

  it('renders the fallback background when no media is provided', () => {
    const { container } = render(<StorytellingScreen adventure={adventure} onEnter={vi.fn()} />);

    expect(container.querySelector('.storytelling-media-fallback')).toBeInTheDocument();
  });
});
