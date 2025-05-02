import React from "react";
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AuthPage from './page'; 
import '@testing-library/jest-dom';

// Mock Next.js navigation components
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock NavBar component
jest.mock('../components/NavBar', () => {
  return function MockNavBar() {
    return <div data-testid="navbar">NavBar</div>;
  };
});

// Mock Supabase auth methods
const mockSignInWithPassword = jest.fn();
const mockSignUp = jest.fn();

// Mock Supabase client
jest.mock('../../supabase.js', () => ({
  getSupabaseClient: jest.fn().mockReturnValue({
    auth: {
      signInWithPassword: (...args) => mockSignInWithPassword(...args),
      signUp: (...args) => mockSignUp(...args),
    },
  }),
}));

// Test suite for the AuthPage component
describe('AuthPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockSignInWithPassword.mockResolvedValue({ 
      data: { user: { id: '123' } }, 
      error: null 
    });
    mockSignUp.mockResolvedValue({ 
      data: { user: { id: '123' } }, 
      error: null 
    });
  });

  // Test case: Verify default login form rendering
  it('renders login form by default', () => {
    render(<AuthPage />);

    // Assert login form elements are present
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  // Test case: Verify form switching functionality
  it('can switch to sign up form', () => {
    render(<AuthPage />);

    // Action: Switch to sign up form
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    // Assert sign up form elements are present
    expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/last name/i)).toBeInTheDocument();
  });

  // Test case: Verify login form submission
  it('submits login form with correct data', async () => {
    render(<AuthPage />);
    
    // Action: Fill out and submit login form
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' }
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    });
    
    // Assert: Supabase auth was called with correct credentials
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
  
  // Test case: Verify signup form submission
  it('submits signup form with correct data', async () => {
    render(<AuthPage />);
    
    // Action: Switch to sign up form
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
    });
    
    // Action: Fill out and submit sign up form
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
    
    // Assert: Supabase signup was called with correct user data
    expect(mockSignUp).toHaveBeenCalledWith({
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

  // Test case: Verify error handling for failed login
  it('handles login errors', async () => {
    // Setup: Mock failed login
    mockSignInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' }
    });

    render(<AuthPage />);
    
    // Action: Submit invalid credentials
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'wrong@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'wrongpass' }
    });
    
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    });
    
    // Assert: Error message should be displayed
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});