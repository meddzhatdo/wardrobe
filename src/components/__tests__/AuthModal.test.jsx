// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import { AuthModal } from '../modals/AuthModal.jsx';

// ---------------------------------------------------------------------------
// Mock supabase — vi.mock is hoisted, so inline vi.fn() in the factory,
// then import the mocked module back to reference the mock functions.
// ---------------------------------------------------------------------------
vi.mock('../../supabase.js', () => ({
  supabase: {
    auth: {
      signInWithPassword:    vi.fn(),
      signUp:                vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser:            vi.fn(),
    },
  },
}));

import { supabase } from '../../supabase.js';

const mockSignIn = supabase.auth.signInWithPassword;
const mockSignUp = supabase.auth.signUp;
const mockUpdate = supabase.auth.updateUser;

beforeEach(() => { vi.clearAllMocks(); });
// Unmount components after each test so DOM doesn't accumulate across tests.
afterEach(cleanup);

// ---------------------------------------------------------------------------

describe('AuthModal — initial render', () => {
  it('renders the email and password fields in sign-in mode by default', () => {
    render(<AuthModal onClose={() => {}} />);
    // Actual placeholder values from the component
    expect(screen.getByPlaceholderText('you@example.com')).toBeTruthy();
    expect(screen.getByPlaceholderText('••••••••')).toBeTruthy();
  });

  it('does not show a name field in sign-in mode', () => {
    render(<AuthModal onClose={() => {}} />);
    expect(screen.queryByPlaceholderText('Your name')).toBeNull();
  });

  it('renders in recovery mode when recoveryMode=true', () => {
    render(<AuthModal onClose={() => {}} recoveryMode />);
    // Recovery mode shows "New password" + "Confirm new password" — two password fields
    const pwFields = screen.getAllByPlaceholderText('••••••••');
    expect(pwFields.length).toBe(2);
    expect(screen.getByText('Set new password')).toBeTruthy();
  });
});

describe('AuthModal — mode switching', () => {
  it('shows the name field after switching to sign-up', () => {
    render(<AuthModal onClose={() => {}} />);
    // The tab bar has exactly "Sign In" and "Sign Up" buttons
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    expect(screen.getByPlaceholderText('Your name')).toBeTruthy();
  });

  it('shows only email after switching to forgot password', () => {
    render(<AuthModal onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Forgot password?' }));
    expect(screen.getByPlaceholderText('you@example.com')).toBeTruthy();
    // Password field is hidden in forgot mode
    expect(screen.queryByPlaceholderText('••••••••')).toBeNull();
  });
});

describe('AuthModal — sign-up client-side validation', () => {
  it('shows an error and does not call signUp when passwords do not match', async () => {
    render(<AuthModal onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    fireEvent.change(screen.getByPlaceholderText('Your name'), { target: { value: 'Jane' } });
    fireEvent.change(screen.getByPlaceholderText('you@example.com'), { target: { value: 'jane@example.com' } });

    const [pwField, confirmField] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(pwField,      { target: { value: 'password123' } });
    fireEvent.change(confirmField, { target: { value: 'different456' } });

    await act(async () => {
      fireEvent.submit(pwField.closest('form'));
    });

    expect(screen.getByText('Passwords do not match.')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });
});

describe('AuthModal — recovery mode client-side validation', () => {
  it('shows an error when new password is shorter than 8 characters', async () => {
    render(<AuthModal onClose={() => {}} recoveryMode />);

    const [pwField, confirmField] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(pwField,      { target: { value: 'short' } });
    fireEvent.change(confirmField, { target: { value: 'short' } });

    await act(async () => {
      fireEvent.submit(pwField.closest('form'));
    });

    expect(screen.getByText('Password must be at least 8 characters.')).toBeTruthy();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('shows an error when recovery passwords do not match', async () => {
    render(<AuthModal onClose={() => {}} recoveryMode />);

    const [pwField, confirmField] = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(pwField,      { target: { value: 'longpassword1' } });
    fireEvent.change(confirmField, { target: { value: 'longpassword2' } });

    await act(async () => {
      fireEvent.submit(pwField.closest('form'));
    });

    expect(screen.getByText('Passwords do not match.')).toBeTruthy();
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});
