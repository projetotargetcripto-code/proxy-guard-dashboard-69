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

export interface Instance {
  id: string;
  instance_number: number;
  instance_name: string;
  pid1: string;
  pid2: string;
  proxy_id: string;
  created_at: string;
  updated_at: string;
  proxies?: Proxy;
}

export interface CreateInstanceData {
  instance_name: string;
  instance_number: number;
  pid1: string;
  pid2: string;
  proxy_id: string;
}

export interface CreateProxyData {
  name: string;
  ip: string;
  port: number;
  username: string;
  password: string;
}