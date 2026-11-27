import { BadRequestException, ParseUUIDPipe } from '@nestjs/common';

/** Mensaje en español para un identificador de ruta que no es UUID (TSK-015-N25). */
export const MENSAJE_IDENTIFICADOR_INVALIDO = 'Identificador inválido.';

/**
 * TSK-015-N25: `ParseUUIDPipe` que responde 400 con «Identificador inválido.» en lugar del mensaje
 * por defecto de Nest. Mismo código de respuesta; úsese en parámetros `@Param` de tipo UUID.
 */
export const UUID_PARAM_PIPE = new ParseUUIDPipe({
  exceptionFactory: () =>
    new BadRequestException(MENSAJE_IDENTIFICADOR_INVALIDO),
});
