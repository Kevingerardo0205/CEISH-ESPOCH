import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { AiAssistantConfigOrmEntity } from '../../infrastructure/database/ai-assistant-config.entity.orm';

interface TextChunk {
  content: string;
  source: string;
}

@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private chunks: TextChunk[] = [];
  private readonly stopWords = new Set([
    'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'un', 'para',
    'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'más', 'pero', 'sus', 'le', 'ya',
    'o', 'este', 'sí', 'porque', 'esta', 'entre', 'cuando', 'muy', 'sin', 'sobre',
    'también', 'me', 'hasta', 'hay', 'donde', 'quien', 'desde', 'todo', 'nos', 'durante',
    'todos', 'uno', 'les', 'ni', 'contra', 'otros', 'ese', 'eso', 'ante', 'ellos', 'e',
    'esto', 'mí', 'antes', 'algunos', 'qué', 'unos', 'yo', 'otro', 'otras', 'otra', 'él',
    'cuales', 'cual', 'son', 'es', 'dime', 'dame', 'cómo', 'quién', 'quien', 'responde', 'respuesta'
  ]);

  private normalizeSpanish(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
  }

  constructor(
    @InjectRepository(AiAssistantConfigOrmEntity)
    private readonly configRepository: Repository<AiAssistantConfigOrmEntity>,
  ) {}

  async onModuleInit() {
    await this.loadAndIndexRegulations();
  }

  private async loadAndIndexRegulations() {
    try {
      // 1. Intentar cargar desde la base de datos
      let config = await this.configRepository.findOne({ where: { id: 1 } });
      
      if (!config) {
        this.logger.log('No se encontró configuración del asistente de IA en base de datos. Inicializando por defecto...');
        
        let petText = '';
        let petFileName = 'Procesos Estandarizados de Trabajo.txt';
        
        const filePath = path.join(process.cwd(), 'docs', 'Procesos Estandarizados de Trabajo.txt');
        if (fs.existsSync(filePath)) {
          petText = fs.readFileSync(filePath, 'utf8');
          this.logger.log(`Normativa PET inicial leída desde archivo local (${petText.length} caracteres).`);
        } else {
          petText = 'Normativa PET general de CEISH-ESPOCH. Los Procesos Estandarizados de Trabajo rigen la recepción, evaluación ética y resolución de protocolos.';
          petFileName = 'Corpus de Respaldo';
          this.logger.warn('Archivo local de normativa PET no encontrado en /docs. Usando texto de respaldo.');
        }
        
        config = this.configRepository.create({
          id: 1,
          petText,
          petFileName,
          allowedRoles: ['SECRETARIA', 'EVALUADOR', 'PRESIDENTE', 'ADMIN_TI'],
        });
        
        config = await this.configRepository.save(config);
      }
      
      // 2. Cargar en memoria e indexar
      this.logger.log(`Cargando normativa PET desde base de datos (${config.petFileName}, ${config.petText?.length || 0} caracteres).`);
      this.chunks = [];
      if (config.petText) {
        this.chunkText(config.petText);
      }
      this.logger.log(`Documento indexado con éxito en ${this.chunks.length} fragmentos.`);
    } catch (err) {
      this.logger.error('Error al leer o indexar el documento PET desde base de datos:', err);
      // Copia de seguridad en memoria en caso de error en base de datos al arrancar
      this.chunks = [
        {
          content: 'Normativa PET general de CEISH-ESPOCH. Los Procesos Estandarizados de Trabajo rigen la recepción, evaluación ética y resolución de protocolos.',
          source: 'Respaldo'
        }
      ];
    }
  }

  /**
   * Actualiza el PET en base de datos y recarga los chunks en memoria inmediatamente
   */
  async reloadRegulations(newText: string, fileName: string): Promise<void> {
    let config = await this.configRepository.findOne({ where: { id: 1 } });
    if (!config) {
      config = this.configRepository.create({ id: 1 });
    }
    
    config.petText = newText;
    config.petFileName = fileName;
    await this.configRepository.save(config);
    
    // Recargar memoria
    this.chunks = [];
    this.chunkText(newText);
    this.logger.log(`Normativa PET actualizada en base de datos y recargada en memoria: ${this.chunks.length} fragmentos. Archivo: ${fileName}`);
  }

  /**
   * Obtiene la configuración de roles y archivo actual
   */
  async getConfigSummary() {
    const config = await this.configRepository.findOne({ where: { id: 1 } });
    return {
      petFileName: config?.petFileName || 'No cargado',
      allowedRoles: config?.allowedRoles || ['SECRETARIA', 'EVALUADOR', 'PRESIDENTE', 'ADMIN_TI'],
      updatedAt: config?.updatedAt || new Date(),
    };
  }

  /**
   * Obtiene el listado de roles autorizados
   */
  async getAllowedRoles(): Promise<string[]> {
    const config = await this.configRepository.findOne({ where: { id: 1 } });
    return config?.allowedRoles || ['SECRETARIA', 'EVALUADOR', 'PRESIDENTE', 'ADMIN_TI'];
  }

  /**
   * Actualiza los roles permitidos en base de datos
   */
  async updateAllowedRoles(roles: string[]): Promise<void> {
    let config = await this.configRepository.findOne({ where: { id: 1 } });
    if (!config) {
      config = this.configRepository.create({ id: 1, petText: '', petFileName: '', allowedRoles: roles });
    } else {
      config.allowedRoles = roles;
    }
    await this.configRepository.save(config);
    this.logger.log(`Roles autorizados para el asistente de IA actualizados en base de datos: ${roles.join(', ')}`);
  }

  private chunkText(text: string) {
    // 1. Eliminar cabeceras/pies de página del PDF como "-- X of Y --"
    let clean = text.replace(/-- \d+ of \d+ --/gi, '');

    // 2. Eliminar números de página aislados en su propia línea
    clean = clean.replace(/\n\s*\d+\s*(?=\n)/g, '\n');

    // 3. Normalizar múltiples saltos de línea consecutivos a máximo dos
    clean = clean.replace(/\n{3,}/g, '\n\n');

    const maxChunkSize = 1200;
    const overlap = 200;
    const separators = ['\n\n', '\n', ' ', ''];

    const recursiveSplit = (textStr: string, separatorIndex: number): string[] => {
      if (textStr.length <= maxChunkSize) {
        return [textStr];
      }
      if (separatorIndex >= separators.length) {
        return [textStr];
      }

      const separator = separators[separatorIndex];
      const parts = textStr.split(separator);
      const result: string[] = [];
      let currentPart = '';

      for (const part of parts) {
        if (currentPart.length + part.length + (currentPart ? separator.length : 0) <= maxChunkSize) {
          currentPart += (currentPart ? separator : '') + part;
        } else {
          if (currentPart) {
            result.push(currentPart);
          }
          if (part.length > maxChunkSize) {
            const subParts = recursiveSplit(part, separatorIndex + 1);
            result.push(...subParts);
            currentPart = '';
          } else {
            currentPart = part;
          }
        }
      }
      if (currentPart) {
        result.push(currentPart);
      }
      return result;
    };

    const rawChunks = recursiveSplit(clean, 0);
    let currentChunk = '';

    for (let i = 0; i < rawChunks.length; i++) {
      const chunk = rawChunks[i];
      if (currentChunk.length + chunk.length + (currentChunk ? 2 : 0) <= maxChunkSize) {
        currentChunk += (currentChunk ? '\n\n' : '') + chunk;
      } else {
        if (currentChunk) {
          this.chunks.push({
            content: currentChunk.trim(),
            source: 'PET Regulations'
          });
        }
        
        // Calcular solapamiento
        if (overlap > 0 && currentChunk.length > overlap) {
          const overlapStart = currentChunk.length - overlap;
          let splitIdx = currentChunk.indexOf('\n', overlapStart);
          if (splitIdx === -1 || splitIdx >= currentChunk.length) {
            splitIdx = currentChunk.indexOf(' ', overlapStart);
          }
          if (splitIdx !== -1 && splitIdx < currentChunk.length) {
            currentChunk = currentChunk.substring(splitIdx).trim();
          } else {
            currentChunk = currentChunk.substring(overlapStart).trim();
          }
        } else {
          currentChunk = '';
        }
        
        currentChunk += (currentChunk ? '\n\n' : '') + chunk;
      }
    }
    if (currentChunk) {
      this.chunks.push({
        content: currentChunk.trim(),
        source: 'PET Regulations'
      });
    }
  }

  /**
   * Realiza una búsqueda por coincidencia de términos de la normativa PET
   * @param query Pregunta o término buscado por el usuario
   * @param limit Cantidad máxima de fragmentos a retornar
   */
  retrieve(query: string, limit = 3): string[] {
    if (this.chunks.length === 0) {
      return [];
    }

    // Tokenizar la query, normalizar y quitar stop words
    const queryTerms = query
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?\¿]/g, '')
      .split(/\s+/)
      .map(term => this.normalizeSpanish(term))
      .filter(term => term.length > 2 && !this.stopWords.has(term));

    if (queryTerms.length === 0) {
      // Si la query es vacía o sólo stop words, retornar fragmentos iniciales por defecto
      return this.chunks.slice(0, limit).map(c => c.content);
    }

    const normalizedTerms = queryTerms.map(term => {
      const roots = [term];
      if (term.endsWith('es')) {
        roots.push(term.slice(0, -2));
      } else if (term.endsWith('s')) {
        roots.push(term.slice(0, -1));
      }
      return roots;
    });

    // Puntuación de fragmentos basada en la coincidencia de términos con co-ocurrencia y penalización de longitud
    const scoredChunks = this.chunks.map(chunk => {
      const chunkNormalized = this.normalizeSpanish(chunk.content);
      let score = 0;
      let matchedDistinctTerms = 0;

      normalizedTerms.forEach(roots => {
        let termMatched = false;
        roots.forEach(root => {
          // Encontrar correspondencia de palabra completa
          const regex = new RegExp(`\\b${root}\\b`, 'gi');
          const matches = chunkNormalized.match(regex);
          if (matches) {
            score += matches.length * 2.0;
            termMatched = true;
          } else if (root.length > 3 && chunkNormalized.includes(root)) {
            // Coincidencia parcial sólo para términos largos
            score += 0.5;
          }
        });
        if (termMatched) {
          matchedDistinctTerms++;
        }
      });

      // Boost por co-ocurrencia
      if (matchedDistinctTerms > 0) {
        score = score * Math.pow(2, matchedDistinctTerms - 1);
      }

      // Normalizar por tamaño (penalización logarítmica de longitud)
      const lengthPenalty = Math.log(chunk.content.length);
      const finalScore = score / (lengthPenalty || 1);

      return { chunk, score: finalScore };
    });

    // Ordenar y seleccionar los mejores
    return scoredChunks
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.chunk.content);
  }
}
