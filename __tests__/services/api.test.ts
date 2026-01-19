import { AuthService } from '@/services/auth.service';
import { apiCall } from '@/services/shared/api';

// Mock AuthService
jest.mock('@/services/auth.service', () => ({
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fc554a95db2c.ngrok-free.app/api/v1',
  AuthService: {
    getAccessToken: jest.fn(),
  },
}));

describe('apiCall', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue('test-token');
  });

  it('makes a GET request with correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ data: 'test' }),
    } as Response);

    const result = await apiCall('/users');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-token',
        }),
      })
    );
    expect(result).toEqual({ data: 'test' });
  });

  it('adds authorization header when token is available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
    } as Response);

    await apiCall('/endpoint');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      })
    );
  });

  it('does not add authorization header when no token', async () => {
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue(null);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
    } as Response);

    await apiCall('/endpoint');

    const calledOptions = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = calledOptions.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('throws error on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
      text: () => Promise.resolve('Resource not found'),
    } as Response);

    await expect(apiCall('/nonexistent')).rejects.toThrow('HTTP 404');
  });

  it('returns undefined for 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
    } as Response);

    const result = await apiCall('/delete-resource');

    expect(result).toBeUndefined();
  });

  it('handles text response when content-type is not JSON', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'text/plain' }),
      text: () => Promise.resolve('Plain text response'),
    } as Response);

    const result = await apiCall<string>('/text-endpoint');

    expect(result).toBe('Plain text response');
  });

  it('allows base URL override', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
    } as Response);

    await apiCall('/endpoint', {}, 0, 'https://other-api.com');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://other-api.com/endpoint',
      expect.any(Object)
    );
  });

  it('includes custom headers in request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
    } as Response);

    await apiCall('/endpoint', {
      headers: { 'X-Custom-Header': 'custom-value' },
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'X-Custom-Header': 'custom-value',
        }),
      })
    );
  });

  it('makes POST request with body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ id: 1 }),
    } as Response);

    const result = await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test User' }),
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Test User' }),
      })
    );
    expect(result).toEqual({ id: 1 });
  });
});
