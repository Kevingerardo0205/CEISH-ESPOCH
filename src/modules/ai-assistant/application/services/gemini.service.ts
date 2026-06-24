import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly modelName: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || '';
    let model = this.configService.get<string>('GEMINI_MODEL') || process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    if (model === 'gemini-2.5-flash-lite') {
      model = 'gemini-2.5-flash';
    }
    this.modelName = model;

    if (!this.apiKey || this.apiKey === 'CLAVEAPI') {
      this.logger.warn('La clave GEMINI_API_KEY no está configurada o es la de ejemplo. El asistente de IA fallará al realizar llamadas reales.');
    }
  }

  /**
   * Envía la conversación consolidada con contexto RAG y de protocolo a la API de Gemini
   * @param message Mensaje actual del usuario
   * @param ragContext Fragmentos relevantes del PET
   * @param protocolContext Metadata del protocolo en pantalla
   * @param history Historial previo del chat
   */
  async generateResponse(
    message: string,
    ragContext: string,
    protocolContext: string,
    history: ChatMessage[] = [],
  ): Promise<string> {
    if (!this.apiKey || this.apiKey === 'CLAVEAPI') {
      throw new HttpException(
        'El servicio de Asistente de IA no está configurado (Falta GEMINI_API_KEY en el servidor).',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    try {
      // 1. Preparar las instrucciones del sistema (System Prompt)
      const systemInstruction = 
        `Eres el Asistente de IA de CEISH-ESPOCH (Comité de Ética de Investigación en Seres Humanos de la Escuela Superior Politécnica de Chimborazo).\n` +
        `Tu rol es asistir a Evaluadores del Comité, Secretaría, Presidente y usuarios autorizados respondiendo consultas en base a la normativa activa y el contexto provisto.\n\n` +
        `=== INSTRUCCIONES CLAVE ===\n` +
        `- Debes responder en formato Markdown limpio, estructurado y profesional.\n` +
        `- Tu fuente principal de información es la sección 'DOCUMENTACIÓN DE NORMATIVA ACTIVA' descrita abajo.\n` +
        `- Debes adaptarte al tema y contenido de la normativa activa provista en el contexto (por ejemplo, si la normativa activa es sobre procesos operativos del comité, simulación, reglamentos académicos u otro tema, tu deber es responder basándote en dicha información).\n` +
        `- Si la información de la respuesta se fundamenta en la normativa provista, cita la sección o parte correspondiente si es visible.\n` +
        `- Sé claro, conciso y directo.\n` +
        `- No inventes datos del protocolo. Si no hay un protocolo cargado en el contexto o si la pregunta es ajena a la información disponible, respóndelo de manera profesional.\n\n` +
        `=== DOCUMENTACIÓN DE NORMATIVA ACTIVA ===\n` +
        `${ragContext || 'No hay fragmentos relevantes de normativa activa disponibles para esta consulta.'}\n\n` +
        `=== CONTEXTO DEL PROTOCOLO DE INVESTIGACIÓN ACTUAL ===\n` +
        `${protocolContext || 'El usuario no está visualizando ningún protocolo específico en este momento.'}`;

      // 2. Mapear el historial al formato oficial de la API de Gemini
      const contents = history.map(item => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }],
      }));

      // Añadir el mensaje actual del usuario al final de los contenidos
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      // 3. Configurar la petición HTTP con lista de modelos de respaldo (fallback)
      const fallbackModels = [
        this.modelName,
        'gemini-2.5-flash',
        'gemini-flash-latest',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-2.5-pro',
        'gemini-pro-latest',
      ];

      // Eliminar duplicados manteniendo el orden
      const modelsToTry = Array.from(new Set(fallbackModels));
      let lastError: any = null;

      for (const model of modelsToTry) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
          const payload = {
            contents,
            systemInstruction: {
              parts: [{ text: systemInstruction }],
            },
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
            },
          };

          this.logger.log(`Iniciando llamada a la API de Gemini con modelo: ${model}...`);

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            const errorText = await response.text();
            this.logger.warn(`Error de la API de Gemini con modelo ${model} (${response.status}): ${errorText}`);
            
            let parsedError: any;
            try {
              parsedError = JSON.parse(errorText);
            } catch {
              parsedError = null;
            }

            const status = response.status;
            const errorMsg = parsedError?.error?.message || response.statusText || 'Error desconocido';

            if (status === 429) {
              lastError = new HttpException(
                `Límite de cuota superado (429) para el modelo ${model}: ${errorMsg}. Probando siguiente modelo de respaldo...`,
                HttpStatus.TOO_MANY_REQUESTS,
              );
              continue;
            }

            lastError = new HttpException(
              `Error en modelo ${model} (${status}): ${errorMsg}`,
              HttpStatus.BAD_GATEWAY,
            );
            continue;
          }

          const json: any = await response.json();
          
          // Extraer texto retornado por el modelo
          const candidate = json.candidates?.[0];
          const responseText = candidate?.content?.parts?.[0]?.text;

          if (!responseText) {
            this.logger.warn(`La respuesta de Gemini para ${model} no contiene partes de texto estructuradas.`, json);
            lastError = new Error(`Respuesta vacía o inválida del modelo ${model}`);
            continue;
          }

          if (model !== this.modelName) {
            this.logger.log(`Llamada exitosa usando el modelo de respaldo alternativo: ${model} (el original ${this.modelName} falló/excedió cuota)`);
          }

          return responseText;
        } catch (err) {
          this.logger.error(`Error no controlado al invocar ${model}:`, err);
          lastError = err;
          // Seguir con el siguiente modelo de respaldo
        }
      }

      // Si todos los modelos fallaron
      if (lastError instanceof HttpException) {
        throw lastError;
      }
      throw new HttpException(
        `Todos los modelos de Gemini fallaron o tienen su cuota agotada. Último error: ${lastError?.message || lastError}`,
        HttpStatus.BAD_GATEWAY,
      );
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.error('Error no controlado al invocar la API de Gemini:', err);
      throw new HttpException(
        'Ocurrió un error en el servidor de IA al procesar su solicitud.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
