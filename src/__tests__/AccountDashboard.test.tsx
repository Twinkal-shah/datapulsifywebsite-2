import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import AccountDashboard from '../pages/AccountDashboard';
import { supabase } from '@/lib/supabaseClient';
import { vi } from 'vitest';

// Mock the supabase client
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: '123',
              user_id: 'user123',
              email: 'test@example.com',
              install_date: '2024-03-20T00:00:00Z',
              business_type: 'Agency',
              business_size: 'Small',
              subscription_type: 'Pro Plan',
              usage_count: 500,
              last_active_date: '2024-03-20T12:00:00Z'
            },
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

// Mock the auth context
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const mockAuth = {
  user: {
    id: 'user123',
    email: 'test@example.com',
    name: 'Test User',
    member_since: '2024-03-20T00:00:00Z',
    current_plan: 'Pro Plan'
  },
  loading: false,
  logout: vi.fn(),
};

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => mockAuth
}));

describe('AccountDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user profile data correctly', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
      expect(screen.getByText('Agency')).toBeInTheDocument();
      expect(screen.getByText('Small')).toBeInTheDocument();
    });
  });

  it('handles loading state correctly', () => {
    mockAuth.loading = true;
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('redirects to home when no user is present', () => {
    const noUserAuth = { ...mockAuth, user: null };
    vi.mock('../contexts/AuthContext', () => ({
      useAuth: () => noUserAuth
    }));

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('handles error state correctly', async () => {
    // Mock an error response
    vi.mocked(supabase.from).mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: new Error('Failed to fetch profile')
          }))
        }))
      }))
    }));

    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch profile')).toBeInTheDocument();
    });
  });

  it('updates business type correctly', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const businessTypeSelect = screen.getByLabelText('Business Type');
      fireEvent.change(businessTypeSelect, { target: { value: 'Enterprise' } });
    });

    expect(supabase.from).toHaveBeenCalledWith('user_installations');
    expect(vi.mocked(supabase.from).mock.results[0].value.update).toHaveBeenCalledWith({
      business_type: 'Enterprise'
    });
  });

  it('updates business size correctly', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AccountDashboard />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const businessSizeSelect = screen.getByLabelText('Business Size');
      fireEvent.change(businessSizeSelect, { target: { value: 'Large' } });
    });

    expect(supabase.from).toHaveBeenCalledWith('user_installations');
    expect(vi.mocked(supabase.from).mock.results[0].value.update).toHaveBeenCalledWith({
      business_size: 'Large'
    });
  });
}); 