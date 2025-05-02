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
  
  import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
  import '@testing-library/jest-dom';
  import QRcode from './page';
  
  // Mock Next.js navigation
  jest.mock('next/navigation', () => ({
    useRouter: () => ({
      push: jest.fn(),
    }),
  }));
  
  // Mock NavBar component to avoid router issues
  jest.mock('../components/NavBar', () => () => (
    <div data-testid="navbar">NavBar Mock</div>
  ));
  
  // Mock Supabase client
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockOrder = jest.fn();
  const mockDelete = jest.fn();
  const mockGetUser = jest.fn();
  
  jest.mock('../../supabase', () => ({
    createClient: jest.fn(() => ({
      from: mockFrom,
      auth: {
        getUser: mockGetUser,
      },
    })),
  }));
  
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
  
    it('displays loading message while fetching data', async () => {
      mockGetUser.mockImplementation(() => new Promise(() => {}));
      
      await act(async () => {
        render(<QRcode />);
      });
      
      expect(screen.getByText('Loading saved codes...')).toBeInTheDocument();
    });
  
    it('displays message if user is not logged in', async () => {
      mockGetUser.mockResolvedValue({ data: null, error: null });
      
      await act(async () => {
        render(<QRcode />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Please log in to view your saved codes.'))
          .toBeInTheDocument();
      });
    });
  
    it('displays saved items when user is logged in', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });
      
      mockOrder.mockResolvedValue({
        data: [{
          id: '1',
          text: 'Test Code',
          type: 'QR',
          created_at: '2025-05-02T00:00:00Z',
          data_url: 'data:image/png;base64,...',
        }],
        error: null,
      });
      
      await act(async () => {
        render(<QRcode />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Test Code')).toBeInTheDocument();
      });
    });
  
    it('displays empty message when no saved items', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });
      
      mockOrder.mockResolvedValue({ data: [], error: null });
      
      await act(async () => {
        render(<QRcode />);
      });
      
      await waitFor(() => {
        expect(screen.getByText('You haven\'t saved any codes yet.'))
          .toBeInTheDocument();
      });
    });
  
    it('deletes an item when delete button is clicked', async () => {
      mockGetUser.mockResolvedValue({ 
        data: { user: { id: 'user-id' } }, 
        error: null 
      });
      
      const mockDeleteFn = jest.fn().mockResolvedValue({ error: null });
      mockFrom.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [{
                id: '1',
                text: 'Test Code',
                type: 'QR',
                created_at: '2025-05-02T00:00:00Z',
                data_url: 'data:image/png;base64,...',
              }],
              error: null,
            }),
          }),
        }),
        delete: jest.fn().mockReturnValue({ eq: mockDeleteFn }),
      }));
      
      await act(async () => {
        render(<QRcode />);
      });
  
      await waitFor(() => {
        expect(screen.getByText('Test Code')).toBeInTheDocument();
      });
  
      await act(async () => {
        fireEvent.click(screen.getByText('Delete'));
      });
  
      expect(mockFrom).toHaveBeenCalledWith('QRCodes');
      expect(mockDeleteFn).toHaveBeenCalledWith('id', '1');
    });
  });