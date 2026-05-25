import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Authentication from '../components/Authentication';

// Mock fetch globally
global.fetch = jest.fn();

describe('Authentication Component', () => {
  beforeEach(() => {
    global.fetch.mockReset();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders authentication form correctly', () => {
    render(<Authentication />);
    
    const container = screen.getByTestId('authentication-container');
    expect(container).toBeInTheDocument();
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  test('handles form submission for sign in', async () => {
    const mockResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({ token: 'test-token' })
    };
    global.fetch.mockResolvedValue(mockResponse);
    
    render(<Authentication />);
    
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.ainative.studio/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    );
  });

  test('shows loading state during authentication', async () => {
    global.fetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: jest.fn().mockResolvedValue({ token: 'test-token' })
      }), 1000))
    );
    
    render(<Authentication />);
    
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });

  test('handles authentication error gracefully', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: jest.fn().mockResolvedValue({ detail: 'Invalid credentials' })
    });
    
    render(<Authentication />);
    
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'wrong@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('passes accessibility checks', async () => {
    const { container } = render(<Authentication />);
    
    // Check that the main container has proper accessibility attributes
    const authContainer = screen.getByTestId('authentication-container');
    expect(authContainer).toHaveAttribute('role', 'region');
    expect(authContainer).toHaveAttribute('aria-label', 'Authentication form');
    
    // Verify form elements have appropriate labels
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    
    // Ensure all interactive elements are focusable
    expect(screen.getByRole('button', { name: /sign in/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeEnabled();
  });
});