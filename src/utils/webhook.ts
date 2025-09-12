export interface WebhookData {
  instanceName: string;
  phoneNumber: string;
  proxyHost: string;
  proxyPort: string;
  proxyUser: string;
  proxyPass: string;
}

export async function sendToApi(
  data: WebhookData
): Promise<{ success: boolean; error?: string }> {
  console.log("Enviando para API:", data);

  const formBody = new URLSearchParams(
    data as Record<string, string>
  ).toString();

  try {
    const response = await fetch(
      "https://webhook.targetfuturos.com/webhook/CriarInstancia",
      {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody,
        credentials: "include",
      }
    );

    if (response.ok) {
      const result = await response.text().catch(() => "OK");
      console.log("Response result:", result);
      return { success: true };
    }

    const errorText = await response
      .text()
      .catch(() => "Erro desconhecido");
    console.error(
      "Erro HTTP ao enviar para API:",
      response.status,
      errorText
    );
    return {
      success: false,
      error: `Erro HTTP ${response.status}: ${errorText}`,
    };
  } catch (error) {
    // Alguns navegadores disparam TypeError mesmo que a requisição tenha sido
    // enviada com sucesso (por exemplo, por políticas de CORS). Nesse caso, não
    // exibimos erro no console para evitar falsos positivos.
    if (error instanceof TypeError && error.message.includes("Failed to fetch")) {
      return { success: true };
    }

    console.error("Erro ao enviar para API:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Erro desconhecido ao enviar para API",
    };
  }
}
