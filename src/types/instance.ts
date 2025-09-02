export interface Instance {
  id: string;
  instanceNumber: number;
  instanceName: string;
  pid1: string;
  pid2: string;
  proxyName: string;
  proxyIp: string;
  proxyPort: number;
  proxyLogin: string;
  proxyPassword: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInstanceData {
  instanceName: string;
  pid1: string;
  pid2: string;
  proxyName: string;
  proxyIp: string;
  proxyPort: number;
  proxyLogin: string;
  proxyPassword: string;
}