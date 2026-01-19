import { AuthService } from '@/services/auth.service';
import { ClientService } from '@/services/client.service';

// Mock AuthService
jest.mock('@/services/auth.service', () => ({
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://fc554a95db2c.ngrok-free.app/api/v1',
  AuthService: {
    getAccessToken: jest.fn(),
  },
}));

describe('ClientService', () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.clearAllMocks();
    (AuthService.getAccessToken as jest.Mock).mockResolvedValue('test-token');
  });

  describe('getClients', () => {
    it('fetches clients with query parameters', async () => {
      const mockClients = {
        items: [
          { id: '1', email: 'client1@test.com', firstName: 'John', lastName: 'Doe' },
          { id: '2', email: 'client2@test.com', firstName: 'Jane', lastName: 'Smith' },
        ],
        page: 1,
        pageSize: 10,
        totalCount: 2,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockClients),
      } as Response);

      const result = await ClientService.getClients({ page: 1, pageSize: 10 });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(result).toEqual(mockClients);
    });

    it('handles empty results', async () => {
      const emptyResponse = { items: [], page: 1, pageSize: 10, totalCount: 0 };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(emptyResponse),
      } as Response);

      const result = await ClientService.getClients();

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });

  describe('getClientById', () => {
    it('fetches a single client by ID', async () => {
      const mockClient = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(mockClient),
      } as Response);

      const result = await ClientService.getClientById('123');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients/123'),
        expect.any(Object)
      );
      expect(result).toEqual(mockClient);
    });

    it('throws error when client not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
        text: () => Promise.resolve('Client not found'),
      } as Response);

      await expect(ClientService.getClientById('nonexistent')).rejects.toThrow();
    });
  });

  describe('createClient', () => {
    it('creates a new client', async () => {
      const newClient = {
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'Client',
      };

      const createdClient = { id: '456', ...newClient };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: () => Promise.resolve(createdClient),
      } as Response);

      const result = await ClientService.createClient(newClient);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/clients'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(newClient),
        })
      );
      expect(result).toEqual(createdClient);
    });
  });
});

