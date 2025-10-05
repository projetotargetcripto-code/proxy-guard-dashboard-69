export interface Proxy {
  id: string;
  name: string;
  ip: string;
  port: number;
  username: string;
  password: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  description?: string;
  account_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  client_id?: string;
  created_at: string;
  updated_at: string;
  clients?: {
    id: string;
    name: string;
  };
}

export type InstanceStatus = 'Repouso' | 'Aquecendo' | 'Disparando' | 'Banida';

export interface Instance {
  id: string;
  instance_number: number;
  instance_name: string;
  pid1: string;
  pid2: string;
  phone_number?: string | null;
  proxy_id: string;
  service_id?: string | null;
  status: InstanceStatus;
  sent_to_api?: boolean;
  api_sent_at?: string | null;
  inbox_id?: string | null;
  managed_by_zapguard: boolean;
  borrowed_by_user_id?: string | null;
  borrowed_until?: string | null;
  created_at: string;
  updated_at: string;
  proxies?: Proxy;
  services?: Service;
}

export interface CreateInstanceData {
  instance_name: string;
  instance_number: number;
  pid1: string;
  pid2: string;
  phone_number?: string | null;
  proxy_id: string;
  service_id?: string | null;
  status: InstanceStatus;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  description?: string;
  account_id?: number;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  client_id?: string;
}

export interface CreateProxyData {
  name: string;
  ip: string;
  port: number;
  username: string;
  password: string;
}