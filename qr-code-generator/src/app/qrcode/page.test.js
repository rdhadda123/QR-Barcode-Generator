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
    }
));

import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import QRcode from './page';

const mockGetUser = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockDelete = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../supabase', () => ({
    getSupabaseClient: jest.fn(() => ({
        auth: {
            getUser: mockGetUser,
        },
        from: mockFrom,
    })),
}));

// Test suite for the QRcode page which displays and manages QR codes
describe('QRcode Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        
        mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
            order: mockOrder,
            }),
        }),
        delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
        }),
        }));
    });

    // Test case: Verify loading state is shown while fetching data
    it('displays loading message while fetching data', async () => {
        mockGetUser.mockImplementation(() => new Promise(() => {}));

        await act(async () => {
            render(<QRcode />);
        });

        // Assert that loading message appears immediately
        expect(screen.getByText('Loading saved codes...')).toBeInTheDocument();
        });

    // Test case: Verify unauthenticated users see login prompt
    it('displays message if user is not logged in', async () => {
        mockGetUser.mockResolvedValue({ data: null, error: null });
        
        await act(async () => {
        render(<QRcode />);
        });

        // Assert that login prompt appears after auth check
        await waitFor(() => {
        expect(screen.getByText('Please log in to view your saved codes.')).toBeInTheDocument();
        });
    });

    // Test case: Verify authenticated users see their saved QR codes
    it('displays saved items when user is logged in', async () => {
        mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
        });
        
        mockOrder.mockResolvedValue({
        data: [
            {
            id: '1',
            text: 'Test Code',
            type: 'QR',
            created_at: '2025-05-02T00:00:00Z',
            data_url: 'data:image/png;base64,...',
            },
        ],
        error: null,
        });
        
        await act(async () => {
        render(<QRcode />);
        });
        
        // Assert that saved QR code appears in the list
        await waitFor(() => {
        expect(screen.getByText('Test Code')).toBeInTheDocument();
        });
    });

    // Test case: Verify empty state is shown when no codes exist
    it('displays empty message when no saved items', async () => {
        mockGetUser.mockResolvedValue({
          data: { user: { id: 'user-id' } },
          error: null,
        });
        
        mockOrder.mockResolvedValue({ data: [], error: null });
        
        await act(async () => {
          render(<QRcode />);
        });
        
        // Assert that empty state message appears
        await waitFor(() => {
          expect(screen.getByText('You haven\'t saved any codes yet.')).toBeInTheDocument();
        });
    });

    // Test case: Verify successful deletion of a saved QR code
    it('deletes an item when delete button is clicked', async () => {
        mockGetUser.mockResolvedValue({ 
            data: { user: { id: 'user-id' } }, 
            error: null 
        });

        mockOrder.mockResolvedValue({
            data: [{
                id: '1',
                text: 'Test Code',
            }],
            error: null,
        });

        const mockDeleteFn = jest.fn().mockResolvedValue({ error: null });
        mockFrom.mockImplementation(() => ({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({ order: mockOrder }),
            }),
            delete: jest.fn().mockReturnValue({ eq: mockDeleteFn }),
        }));

        await act(async () => {
            render(<QRcode />);
        });

        await act(async () => {
            fireEvent.click(screen.getByText('Delete'));
        });

        // Assert: Verify Supabase was called with correct table name
        expect(mockFrom).toHaveBeenCalledWith('QRCodes');

        // Assert: Verify delete operation was called with correct ID
        expect(mockDeleteFn).toHaveBeenCalledWith('id', '1');
    });
});