export const isValidCedula = (cedula: string): boolean => {
  if (cedula.length !== 10) return false;
  // Implementación básica de validación de cédula ecuatoriana
  return true;
};

export const sanitizeFilenameBackend = (filename: string): string => {
  const parts = filename.split('.');
  const ext = parts.pop() || 'pdf';
  let name = parts.join('.');

  // 1. Reemplazar espacios y caracteres conflictivos por guiones bajos
  name = name.replace(/\s+/g, '_');
  // 2. Remover acentos y tildes
  name = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // 3. Remover caracteres no permitidos en S3 (solo alfanuméricos, guiones, puntos y guiones bajos)
  name = name.replace(/[^a-zA-Z0-9.\-_]/g, '');

  return `${name}.${ext}`;
};

export const isValidPdfExtension = (filename: string): boolean => {
  return filename.toLowerCase().endsWith('.pdf');
};
