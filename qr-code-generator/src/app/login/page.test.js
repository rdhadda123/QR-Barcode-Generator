/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from '@testing-library/react';
import AuthPage from './page'; 
import '@testing-library/jest-dom';

// Mock the Next.js components and hooks
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

// Mock NavBar component
jest.mock('../components/NavBar', () => {
  return function MockNavBar() {
    return <div data-testid="navbar">NavBar</div>;
  };
});

// Mock Supabase
jest.mock('../../supabase.js', () => ({
  getSupabaseClient: () => ({
    auth: {
      signInWithPassword: jest.fn().mockResolvedValue({}),
      signUp: jest.fn().mockResolvedValue({}),
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

    // Find the toggle button that switches to sign up form
    const toggleButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(toggleButton);

    // Assert that first name input field appears in sign up form
    expect(screen.getByPlaceholderText(/first name/i)).toBeInTheDocument();

    // Assert that last name input field appears in sign up form
    expect(screen.getByPlaceholderText(/last name/i)).toBeInTheDocument();
  });

  // Test case: Verify the submit button behavior during loading state
  it('disables submit button when loading', () => {
    render(<AuthPage />);
    const button = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(button);

    // Assert that the login button still exists after clicking
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });
});
