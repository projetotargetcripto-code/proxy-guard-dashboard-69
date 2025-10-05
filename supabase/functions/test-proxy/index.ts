import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ip, port, username, password } = await req.json()

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

    // Configurar proxy
    const proxyUrl = `http://${username}:${password}@${ip}:${port}`
    
    // Criar AbortController para timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 segundos timeout

    try {
      // Fazer requisição através do proxy para verificar se está funcionando
      // Usamos um serviço que retorna o IP público
      const response = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal,
        // @ts-ignore - Deno suporta proxy mas TypeScript não reconhece
        proxy: proxyUrl,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Proxy funcionando corretamente',
            ip: data.ip 
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
            error: `Proxy retornou status ${response.status}` 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        )
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      let errorMessage = 'Erro ao conectar através do proxy'
      if (fetchError.name === 'AbortError') {
        errorMessage = 'Timeout na conexão com o proxy'
      } else if (fetchError.message) {
        errorMessage = fetchError.message
      }

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: errorMessage 
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
