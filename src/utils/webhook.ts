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
    const response = await fetch('https://webhook.targetfuturos.com/webhook/CriaInstancia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending to API:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}