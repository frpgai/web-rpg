import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

beforeAll(() => {
  globalThis.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    })
  ) as any;
});

describe('App Component', () => {
  it('renders without crashing and displays the header brand', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('BARD')).toBeInTheDocument();
    });
  });
});
