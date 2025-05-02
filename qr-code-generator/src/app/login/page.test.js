
jest.mock('../../supabase', () => {
  const mockSignInWithPassword = jest.fn();
  const mockSignUp = jest.fn();
  
  return {
    supabase: {
      auth: {
        signInWithPassword: mockSignInWithPassword,
        signUp: mockSignUp,
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    },
    __mockSignInWithPassword: mockSignInWithPassword,
    __mockSignUp: mockSignUp,
  };
});

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next/link', () => ({ children }) => children);

jest.mock('../components/NavBar', () => () => (
  <div data-testid="mock-navbar">Mock NavBar</div>
));

import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthPage from './page';

const { supabase, __mockSignInWithPassword, __mockSignUp } = require('../../supabase');
const mockAuth = supabase.auth;

// Test suite for AuthPage component
describe('AuthPage Component', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementations for auth methods
    __mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null,
    });
    __mockSignUp.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null,
    });
  });

  // Test case: Default login form rendering
  it('renders login form by default', () => {
    render(<AuthPage />);
    
    // Assert login form elements are present
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  // Test case: Successful login submission
  it('submits login form with correct data', async () => {
    render(<AuthPage />);
    
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' }
    });
    
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' }
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    });
    
    // Verify Supabase was called with correct credentials
    await waitFor(() => {
      expect(__mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  // Test case: Successful signup submission
  it('submits signup form with correct data', async () => {
    render(<AuthPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });
    
    fireEvent.change(screen.getByPlaceholderText(/first name/i), {
      target: { value: 'John' }
    });
    
    fireEvent.change(screen.getByPlaceholderText(/last name/i), {
      target: { value: 'Doe' }
    });
    
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'john.doe@example.com' }
    });
    
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'securepassword' }
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });
    
    // Verify Supabase was called with correct signup data
    await waitFor(() => {
      expect(__mockSignUp).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        password: 'securepassword',
        options: {
          data: {
            first_name: 'John',
            last_name: 'Doe'
          }
        }
      });
    });
  });
});