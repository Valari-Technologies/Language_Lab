import { API_BASE_URL } from './config';

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    return false;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(`${API_BASE_URL}/api/auth/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          return false;
        }
        const data = await response.json();
        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
        return true;
      })
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function logoutSession() {
  const refreshToken = localStorage.getItem('refresh_token');
  const accessToken = localStorage.getItem('access_token');

  if (refreshToken && accessToken) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });
    } catch {
      // Clear local session even if server logout fails.
    }
  }

  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  if (token && token.startsWith('mock-')) {
    let data = [];
    if (endpoint.includes('dashboard') || endpoint.includes('stats')) {
      data = {
        school_name: "Mock School",
        total_teachers: 0,
        total_students: 0,
        active_classes: 0,
        recent_activities: [],
        announcements: [],
        assigned_classes: [],
        active_scenarios: 0,
        grading_queue_count: 0,
        upcoming_lessons: [],
        student_rankings: []
      };
    } else if (endpoint.includes('profile')) {
      const storedUser = localStorage.getItem('user');
      data = storedUser ? JSON.parse(storedUser) : {};
    } else if (options.method && options.method !== 'GET') {
      data = { message: "Success (Mock Mode)", id: 999 };
    }
    return {
      ok: true,
      status: 200,
      json: async () => data,
    };
  }

  const executeRequest = async () => {
    const headers = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    return fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  };

  let response = await executeRequest();

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await executeRequest();
    } else {
      await logoutSession();
      window.location.reload();
      throw new Error('Session expired');
    }
  }

  return response;
}
