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

export interface Service {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export type InstanceStatus = 'Repouso' | 'Aquecendo' | 'Disparando' | 'Banida';

export interface Instance {
  id: string;
  instance_number: number;
  instance_name: string;
  pid1: string;
  pid2: string;
  proxy_id: string;
  service_id?: string | null;
  status: InstanceStatus;
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
  proxy_id: string;
  service_id?: string | null;
  status: InstanceStatus;
}

export interface CreateServiceData {
  name: string;
  description?: string;
}

export interface CreateProxyData {
  name: string;
  ip: string;
  port: number;
  username: string;
  password: string;
}