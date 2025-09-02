import { supabase } from "@/integrations/supabase/client";

// Template PPX - NÃO ALTERAR, apenas injetar listas
const PPX_TEMPLATE = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ProxifierProfile version="102" platform="Windows" product_id="0" product_minver="400">
	<Options>
		<Resolve>
			<AutoModeDetection enabled="true" />
			<ViaProxy enabled="false" />
			<BlockNonATypes enabled="false" />
			<ExclusionList OnlyFromListMode="false">%ComputerName%; localhost; *.local</ExclusionList>
			<DnsUdpMode>0</DnsUdpMode>
		</Resolve>
		<Encryption mode="disabled" />
		<ConnectionLoopDetection enabled="true" resolve="true" />
		<Udp mode="mode_bypass" />
		<LeakPreventionMode enabled="false" />
		<ProcessOtherUsers enabled="false" />
		<ProcessServices enabled="false" />
		<HandleDirectConnections enabled="true" />
		<HttpProxiesSupport enabled="false" />
	</Options>
	<ProxyList>
{{PROXY_LIST}}
	</ProxyList>
	<ChainList />
	<RuleList>
{{RULE_LIST}}
{{STATIC_RULES}}
	</RuleList>
</ProxifierProfile>`;

// Regras estáticas (opcional)
const STATIC_RULES = `		<Rule enabled="true">
			<Action type="Direct" />
			<Applications>adb.exe</Applications>
			<Name>adb</Name>
		</Rule>
		<Rule enabled="true">
			<Action type="Direct" />
			<Applications>javaw.exe;smartscreen.exe</Applications>
			<Name>unimessenger</Name>
		</Rule>`;

interface InstanceRow {
  id: string;
  instance_number: number;
  instance_name: string;
  pid1: string;
  pid2: string;
  proxy_name: string | null;
  proxy_ip: string | null;
  proxy_port: number | null;
  proxy_login: string | null;
  proxy_password: string | null;
  ppx_proxy_id: number | null;
  ppx_rule_order: number | null;
}

function xmlEscape(value: string): string {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function fetchInstancesOrdered(): Promise<InstanceRow[]> {
  const { data, error } = await supabase
    .from('instances')
    .select('*')
    .order('ppx_rule_order', { ascending: true, nullsFirst: false })
    .order('instance_number', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao buscar instâncias:', error);
    throw error;
  }

  return data || [];
}

async function allocateMissingIds(rows: InstanceRow[]): Promise<void> {
  // Obter IDs já utilizados
  const usedIds = rows
    .map(r => r.ppx_proxy_id)
    .filter((id): id is number => id !== null);
  
  // Próximo ID (começar em 100 se não houver nenhum)
  let nextId = usedIds.length ? Math.max(...usedIds) + 1 : 100;

  // Alocar IDs para rows sem ppx_proxy_id
  for (const row of rows) {
    if (row.ppx_proxy_id === null) {
      row.ppx_proxy_id = nextId++;
      
      // Persistir no banco
      const { error } = await supabase
        .from('instances')
        .update({ ppx_proxy_id: row.ppx_proxy_id })
        .eq('id', row.id);
      
      if (error) {
        console.error('Erro ao atualizar ppx_proxy_id:', error);
        throw error;
      }
      
      console.log(`Alocado ppx_proxy_id ${row.ppx_proxy_id} para instância ${row.instance_number}`);
    }
  }
}

function renderProxy(row: InstanceRow): string {
  // Validar campos obrigatórios
  if (!row.proxy_ip || !row.proxy_port || !row.proxy_login || !row.proxy_password || !row.proxy_name) {
    console.warn(`Proxy incompleto para instância ${row.instance_number}, pulando...`);
    return '';
  }

  return [
    `		<Proxy id="${row.ppx_proxy_id}" type="SOCKS5">`,
    `			<Authentication enabled="true">`,
    `				<Password>${xmlEscape(row.proxy_password)}</Password>`,
    `				<Username>${xmlEscape(row.proxy_login)}</Username>`,
    `			</Authentication>`,
    `			<Options>48</Options>`,
    `			<Port>${row.proxy_port}</Port>`,
    `			<Address>${xmlEscape(row.proxy_ip)}</Address>`,
    `			<Label>${xmlEscape(row.proxy_name)}</Label>`,
    `		</Proxy>`
  ].join('\n');
}

function renderRule(row: InstanceRow): string {
  // Validar campos obrigatórios
  if (!row.pid1 || !row.pid2 || !row.ppx_proxy_id) {
    console.warn(`Regra incompleta para instância ${row.instance_number}, pulando...`);
    return '';
  }

  const ruleName = row.proxy_name || row.instance_name;
  
  return [
    `		<Rule enabled="true">`,
    `			<Action type="Proxy">${row.ppx_proxy_id}</Action>`,
    `			<Applications>pid=${row.pid1};pid=${row.pid2}</Applications>`,
    `			<Name>${xmlEscape(ruleName)}</Name>`,
    `		</Rule>`
  ].join('\n');
}

export async function generatePpxXml(): Promise<string> {
  console.log('Iniciando geração do PPX...');
  
  // Buscar instâncias ordenadas
  const rows = await fetchInstancesOrdered();
  console.log(`Encontradas ${rows.length} instâncias`);
  
  // Alocar IDs faltantes
  await allocateMissingIds(rows);
  
  // Gerar listas de proxies e regras
  const proxyList = rows
    .map(renderProxy)
    .filter(proxy => proxy.length > 0) // Remover proxies inválidos
    .join('\n');
  
  const ruleList = rows
    .map(renderRule) 
    .filter(rule => rule.length > 0) // Remover regras inválidas
    .join('\n');

  // Gerar XML final
  const xml = PPX_TEMPLATE
    .replace('{{PROXY_LIST}}', proxyList)
    .replace('{{RULE_LIST}}', ruleList)
    .replace('{{STATIC_RULES}}', STATIC_RULES);

  console.log('PPX gerado com sucesso');
  
  // Debug: log primeira e última proxy/regra
  const proxyLines = proxyList.split('\n').filter(line => line.trim());
  const ruleLines = ruleList.split('\n').filter(line => line.trim());
  
  if (proxyLines.length > 0) {
    console.log('Primeira proxy:', proxyLines[0]);
    console.log('Última proxy:', proxyLines[proxyLines.length - 1]);
  }
  
  if (ruleLines.length > 0) {
    console.log('Primeira regra:', ruleLines[0]);
    console.log('Última regra:', ruleLines[ruleLines.length - 1]);
  }

  return xml;
}

export async function downloadPpx(): Promise<Blob> {
  const xml = await generatePpxXml();
  return new Blob([xml], { type: 'application/xml' });
}