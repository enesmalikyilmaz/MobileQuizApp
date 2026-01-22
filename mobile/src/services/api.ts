import { API_BASE } from "../config";

export async function getJson<T>(path: string, token?: string): Promise<T> {
    const resp = await fetch(`${API_BASE}${path}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const text = await resp.text();
    if (!resp.ok) throw new Error(text || `HTTP ${resp.status}`);
    return text ? JSON.parse(text) : ({} as T);
}

export async function postJson<T>(path: string, body: any, token?: string): Promise<T> {
    const resp = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });

    const text = await resp.text();
    if (!resp.ok) throw new Error(text || `HTTP ${resp.status}`);
    return text ? JSON.parse(text) : ({} as T);
}

export async function putJson<T>(path: string, body: any, token?: string): Promise<T> {
    const resp = await fetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
    });

    const text = await resp.text();
    if (!resp.ok) throw new Error(text || `HTTP ${resp.status}`);
    return text ? JSON.parse(text) : ({} as T);
}

export async function deleteJson<T>(path: string, token?: string): Promise<T> {
    const resp = await fetch(`${API_BASE}${path}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    const text = await resp.text();
    if (!resp.ok) throw new Error(text || `HTTP ${resp.status}`);
    return text ? JSON.parse(text) : ({} as T);
}
