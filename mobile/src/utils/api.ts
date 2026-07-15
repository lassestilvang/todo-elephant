import { Task, List, Label, User, AuthResponse } from '../types';

const API_BASE_URL = process.env.EXPO_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private setToken(token: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  private removeToken(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('accessToken');
    }
  }

  async request<T>(endpoint: string, method: string = 'GET', data?: any): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', 'POST', { email, password });
    this.setToken(response.accessToken);
    return response;
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', 'POST', { name, email, password });
    this.setToken(response.accessToken);
    return response;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', 'POST');
    this.removeToken();
  }

  // Task endpoints
  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>('/tasks');
  }

  async getTask(id: number): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`);
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    return this.request<Task>('/tasks', 'POST', task);
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, 'PUT', updates);
  }

  async deleteTask(id: number): Promise<void> {
    await this.request(`/tasks/${id}`, 'DELETE');
  }

  // List endpoints
  async getLists(): Promise<List[]> {
    return this.request<List[]>('/lists');
  }

  async createList(list: Partial<List>): Promise<List> {
    return this.request<List>('/lists', 'POST', list);
  }

  // Label endpoints
  async getLabels(): Promise<Label[]> {
    return this.request<Label[]>('/labels');
  }

  async createLabel(label: Partial<Label>): Promise<Label> {
    return this.request<Label>('/labels', 'POST', label);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const api = new ApiClient();