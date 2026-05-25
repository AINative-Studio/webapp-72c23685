import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPanel from '../components/AdminPanel';

// Mock fetch globally
global.fetch = jest.fn();

describe('AdminPanel', () => {
  beforeEach(() => {
    global.fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders admin panel container with correct testid', () => {
    render(<AdminPanel />);
    
    const container = screen.getByTestId('admin_panel-container');
    expect(container).toBeInTheDocument();
  });

  test('displays loading state while fetching data', async () => {
    global.fetch.mockImplementationOnce(() =>
      new Promise((resolve) => {
        setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ users: [], tasks: [] })
        }), 1000);
      })
    );

    render(<AdminPanel />);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    global.fetch.mockRejectedValueOnce(new Error('API Error'));
    
    render(<AdminPanel />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading admin data')).toBeInTheDocument();
    });
  });

  test('displays user management section', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        users: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ],
        tasks: []
      })
    });

    render(<AdminPanel />);
    
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  test('handles user deletion interaction', async () => {
    const user = userEvent.setup();
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        users: [{ id: 1, name: 'John Doe', email: 'john@example.com' }],
        tasks: []
      })
    });

    render(<AdminPanel />);
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ message: 'User deleted successfully' })
    });

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.ainative.studio/api/v1/admin/users/1',
      expect.objectContaining({
        method: 'DELETE',
        headers: expect.objectContaining({
          'X-API-Key': expect.any(String)
        })
      })
    );
  });

  test('is accessible with proper ARIA attributes', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        users: [],
        tasks: []
      })
    });

    render(<AdminPanel />);
    
    const container = screen.getByTestId('admin_panel-container');
    expect(container).toHaveAttribute('role', 'main');
    
    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    });
  });
});