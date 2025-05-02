import React from "react";
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import AuthPage from './page'; 
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('next/link', () => {
  return ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('../components/NavBar', () => {
  return function MockNavBar() {
    return <div data-testid="navbar">NavBar</div>;
  };
});

const mockSignInWithPassword = jest.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null });
const mockSignUp = jest.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null });

jest.mock('../../supabase.js', () => ({
  getSupabaseClient: jest.fn().mockReturnValue({
    auth: {
      signInWithPassword: (...args) => mockSignInWithPassword(...args),
      signUp: (...args) => mockSignUp(...args),
    },
  }),
}));

// Test suite for the AuthPage component which handles user authentication
describe('AuthPage Component', () => {

  // Test case: Verify the login form is displayed by default when the component renders
  it('renders login form by default', () => {
    render(<AuthPage />);

    // Assert that login heading exists in the document
    expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();

    // Assert that email input field exists
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();

    // Assert that password input field exists
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
  });

  // Test case: Verify user can switch from login form to sign up form
  it('can switch to sign up form', () => {
    render(<AuthPage />);

    const toggleButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(toggleButton);

    // Assert that first name input field appears in sign up form
    expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();

    // Assert that last name input field appears in sign up form
    expect(screen.getByPlaceholderText(/last name/i)).toBeInTheDocument();
  });

  // Test case: Verify login form submission calls Supabase with correct data
  it('submits login form with correct data', async () => {
    render(<AuthPage />);
    
    mockSignInWithPassword.mockClear();
    
    fireEvent.change(screen.getByPlaceholderText(/email/i), {
      target: { value: 'test@example.com' }
    });
    fireEvent.change(screen.getByPlaceholderText(/password/i), {
      target: { value: 'password123' }
    });
    
    await act(async () => {
      const loginButton = screen.getByRole('button', { name: /log in/i });
      fireEvent.click(loginButton);
      
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify that signInWithPassword was called with correct arguments
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });
  
  // Test case: Verify signup form submission calls Supabase with correct data
  it('submits signup form with correct data', async () => {
    render(<AuthPage />);
    
    await act(async () => {
      const toggleButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(toggleButton);
    });
    
    mockSignUp.mockClear();
    
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
      const signupButton = screen.getByRole('button', { name: /sign up/i });
      fireEvent.click(signupButton);
      
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    // Verify that signUp was called with correct arguments
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
});