jest.mock('../../../styles/Saved.module.css', () => ({
    container: 'container',
    main: 'main',
    header: 'header',
    title: 'title',
    backLink: 'backLink',
    list: 'list',
    listItem: 'listItem',
    imageContainer: 'imageContainer',
    codeImage: 'codeImage',
    deleteText: 'deleteText',
    noImage: 'noImage',
    details: 'details',
    emptyMessage: 'emptyMessage',
}));
  
jest.mock('../../supabase', () => {
    const mockFrom = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
    }));
    
    return {
        supabase: {
            from: mockFrom,
            auth: {
                getUser: jest.fn().mockResolvedValue({
                    data: { user: { id: 'test-user-id' } },
                    error: null,
                }),
            },
        },
    };
});
  
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
}));
  
jest.mock('../components/NavBar', () => () => (
    <div data-testid="mock-navbar">Mock NavBar</div>
));
  
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QRcode from './page';
  
const { supabase } = require('../../supabase');
const mockFrom = supabase.from;
const mockAuth = supabase.auth;
  
// Test suite for QRcode Page component
describe('QRcode Page', () => {
    beforeEach(() => {
      // Clear all mocks before each test
      jest.clearAllMocks();
    });
    
    // Test case: Displaying saved QR codes
    it('displays saved QR codes', async () => {
      // Setup mock data
      const { supabase } = require('../../supabase');
      
      supabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: [{
            id: '1',
            text: 'Test QR',
            type: 'QR',
            data_url: 'data:image/png;base64,mock-image-data',
            created_at: new Date().toISOString(),
          }],
          error: null,
        }),
      });
  

      await act(async () => {
        render(<QRcode />);
      });
  
      screen.debug();
  
      // Assert that the QR code data is displayed
      await waitFor(() => {
        // Verify QR code text appears
        expect(screen.getByText(/Test QR/i)).toBeInTheDocument();
        // Verify details section appears
        expect(screen.getByText(/Text:/i)).toBeInTheDocument();
      });
    });

    // Test case: Handling errors when fetching codes
    it('handles errors when fetching codes', async () => {
        // Setup mock user but error in data fetch
        mockAuth.getUser.mockResolvedValueOnce({
          data: { user: { id: 'test-user-id' } },
          error: null,
        });
      
        // Mock database error
        supabase.from()
          .select()
          .eq()
          .order.mockResolvedValueOnce({
            data: null,
            error: { message: 'Database error' },
          });
      
        await act(async () => {
          render(<QRcode />);
        });
      
        // Assert empty state is shown
        await waitFor(() => {
          expect(screen.getByText(/you haven't saved any codes yet/i)).toBeInTheDocument();
        });
      });

      // Test case: Unauthenticated user flow
      it('shows login prompt for unauthenticated users', async () => {
        // Setup unauthenticated user
        mockAuth.getUser.mockResolvedValueOnce({
          data: { user: null },
          error: { message: 'Not authenticated' },
        });
      
        await act(async () => {
          render(<QRcode />);
        });
      
        // Assert login prompt appears
        await waitFor(() => {
          expect(screen.getByText(/please log in to view your saved codes/i)).toBeInTheDocument();
        });
      });
      
      // Test case: Loading state
      it('shows loading state initially', async () => {
        // Setup pending auth request
        mockAuth.getUser.mockImplementationOnce(() => new Promise(() => {}));
      
        // Render component
        await act(async () => {
          render(<QRcode />);
        });
      
        // Assert loading indicator appears
        expect(screen.getByText(/loading saved codes/i)).toBeInTheDocument();
      });
      
      // Test case: Empty state
      it('shows empty state when no codes exist', async () => {
        // Setup authenticated user with no saved codes
        mockAuth.getUser.mockResolvedValueOnce({
          data: { user: { id: 'test-user-id' } },
          error: null,
        });
      
        supabase.from()
          .select()
          .eq()
          .order.mockResolvedValueOnce({
            data: [],
            error: null,
          });
      
        await act(async () => {
          render(<QRcode />);
        });
      
        // Assert empty state message appears
        await waitFor(() => {
          expect(screen.getByText(/you haven't saved any codes yet/i)).toBeInTheDocument();
        });
      });
  
    // Test case: Deleting QR codes
    it('deletes QR codes', async () => {
        // Setup mock data with one QR code
        const { supabase } = require('../../supabase');
        
        supabase.from.mockReturnValueOnce({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({
            data: [{
              id: '1',
              text: 'To Delete',
              type: 'QR',
              data_url: 'data:image/png;base64,mock',
              created_at: new Date().toISOString(),
            }],
            error: null,
          }),
        });
      
        // Setup successful delete response
        supabase.from.mockReturnValueOnce({
          delete: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ error: null }),
        });
      
        await act(async () => {
          render(<QRcode />);
        });
      
        await waitFor(() => {
          // Assert item exists before deletion
          expect(screen.getByText('To Delete')).toBeInTheDocument();
        });
      
        const deleteButton = screen.getByRole('button', { name: /delete/i });
        
        await act(async () => {
          fireEvent.click(deleteButton);
        });
      
        // Verify deletion was successful
        await waitFor(() => {
          // Assert item no longer exists
          expect(screen.queryByText('To Delete')).not.toBeInTheDocument();
        });
      });
  });