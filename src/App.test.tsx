import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders without crashing and displays the title', () => {
    render(<App />);
    expect(screen.getByText('RPG Imersivo')).toBeInTheDocument();
  });
});
