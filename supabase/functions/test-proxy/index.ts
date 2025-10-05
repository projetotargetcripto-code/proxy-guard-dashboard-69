import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function testProxyConnection(ip: string, port: number, username: string, password: string): Promise<{ success: boolean; error?: string; ip?: string }> {
  try {
    // Criar a string de autenticação básica
    const auth = btoa(`${username}:${password}`);
    
    // Conectar ao proxy
    const conn = await Deno.connect({ 
      hostname: ip, 
      port: port,
      transport: "tcp"
    });

    // Criar a requisição HTTP através do proxy
    const request = [
      'GET http://api.ipify.org?format=json HTTP/1.1',
      'Host: api.ipify.org',
      `Proxy-Authorization: Basic ${auth}`,
      'Connection: close',
      '',
      ''
    ].join('\r\n');

    // Enviar a requisição
    const encoder = new TextEncoder();
    await conn.write(encoder.encode(request));

    // Ler a resposta com timeout
    const decoder = new TextDecoder();
    let response = '';
    const buffer = new Uint8Array(4096);
    
    // Timeout de 10 segundos
    const timeoutId = setTimeout(() => {
      conn.close();
    }, 10000);

    try {
      const bytesRead = await conn.read(buffer);
      if (bytesRead) {
        response = decoder.decode(buffer.subarray(0, bytesRead));
      }
    } finally {
      clearTimeout(timeoutId);
      conn.close();
    }

    console.log('Proxy response:', response);

    // Verificar se a resposta é válida
    if (!response || response.length === 0) {
      return { success: false, error: 'Proxy não respondeu' };
    }

    // Verificar o status HTTP
    const statusLine = response.split('\r\n')[0];
    if (!statusLine.includes('HTTP/1.1 200') && !statusLine.includes('HTTP/1.0 200')) {
      return { success: false, error: `Proxy retornou erro: ${statusLine}` };
    }

    // Extrair o corpo da resposta (depois das headers)
    const bodyStart = response.indexOf('\r\n\r\n');
    if (bodyStart === -1) {
      return { success: false, error: 'Resposta inválida do proxy' };
    }

    const body = response.substring(bodyStart + 4);
    
    // Tentar parsear o JSON com o IP
    try {
      const jsonData = JSON.parse(body);
      if (jsonData.ip) {
        return { success: true, ip: jsonData.ip };
      }
    } catch {
      // Se não conseguir parsear, ainda considerar sucesso se recebemos resposta 200
      return { success: true };
    }

    return { success: true };

  } catch (error) {
    console.error('Error testing proxy:', error);
    
    let errorMessage = 'Erro ao conectar com o proxy';
    if (error instanceof Deno.errors.ConnectionRefused) {
      errorMessage = 'Conexão recusada - proxy não está acessível';
    } else if (error instanceof Deno.errors.TimedOut) {
      errorMessage = 'Timeout na conexão com o proxy';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ip, port, username, password } = await req.json()

    console.log('Testing proxy:', { ip, port, username });

    // Validar entrada
    if (!ip || !port || !username || !password) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Dados do proxy incompletos' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Testar o proxy
    const result = await testProxyConnection(ip, port, username, password);

    if (result.success) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Proxy funcionando corretamente',
          ip: result.ip || 'N/A'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.error || 'Proxy não está funcionando' 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

  } catch (error) {
    console.error('Error in test-proxy function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Erro interno do servidor' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
