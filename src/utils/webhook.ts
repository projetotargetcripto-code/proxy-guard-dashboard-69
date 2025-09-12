export interface WebhookData {
  instanceName: string;
  phoneNumber: string;
  proxyHost: string;
  proxyPort: string;
  proxyUser: string;
  proxyPass: string;
}

export async function sendToApi(data: WebhookData): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('Enviando para API:', data);

    const formBody = new URLSearchParams(data as Record<string, string>).toString();
    const response = await fetch('https://webhook.targetfuturos.com/webhook/CriaInstancia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
      // O endpoint não fornece cabeçalhos CORS, por isso usamos `no-cors`
      // para permitir que a requisição seja enviada sem que o navegador a bloqueie.
      mode: 'no-cors',
    });

    // Em requisições `no-cors` a resposta é opaca, portanto não é possível
    // acessar o status ou o corpo. Se chegamos até aqui consideramos como sucesso.
    if (response.type === 'opaque') {
      return { success: true };
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Erro desconhecido');
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.text().catch(() => 'OK');
    console.log('Response result:', result);

    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar para API:', error);
    
    // Tratamento específico para diferentes tipos de erro
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return { 
        success: false, 
        error: 'Erro de conexão: Verifique se o webhook está disponível ou se há problemas de CORS' 
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro desconhecido ao enviar para API' 
    };
  }
}