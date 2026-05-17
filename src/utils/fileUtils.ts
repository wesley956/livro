export interface ValidationResult {
  valid: boolean;
  error?: string;
  warning?: string;
}

export type SupportedFormat = 'PDF' | 'EPUB';

const MAX_SIZE = 200 * 1024 * 1024;

function extensionOf(file: File): string {
  return file.name.split('.').pop()?.toLowerCase() ?? '';
}

function includesAscii(bytes: Uint8Array, text: string): boolean {
  const pattern = Array.from(text).map(char => char.charCodeAt(0));

  for (let i = 0; i <= bytes.length - pattern.length; i += 1) {
    let ok = true;

    for (let j = 0; j < pattern.length; j += 1) {
      if (bytes[i + j] !== pattern[j]) {
        ok = false;
        break;
      }
    }

    if (ok) return true;
  }

  return false;
}

export function getFileFormat(file: File): SupportedFormat | null {
  const ext = extensionOf(file);
  const mime = (file.type || '').toLowerCase();

  if (ext === 'pdf' || mime.includes('pdf')) return 'PDF';
  if (ext === 'epub' || mime.includes('epub')) return 'EPUB';

  return null;
}

export function validateFile(file: File): ValidationResult {
  if (!file || file.size <= 0) {
    return { valid: false, error: 'Arquivo vazio. Escolha outro PDF ou EPUB.' };
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Arquivo muito grande. Máximo: 200MB.' };
  }

  if (!getFileFormat(file)) {
    return { valid: false, error: 'Formato não suportado. Use PDF ou EPUB.' };
  }

  return { valid: true };
}

export async function validateFileMagic(file: File): Promise<ValidationResult> {
  const basic = validateFile(file);
  if (!basic.valid) return basic;

  const format = getFileFormat(file);
  const buffer = await file.slice(0, 4096).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const hasPdfHeader = includesAscii(bytes, '%PDF-');
  const isZipLike = bytes[0] === 0x50 && bytes[1] === 0x4b;

  if (format === 'PDF' && hasPdfHeader) return { valid: true };
  if (format === 'EPUB' && isZipLike) return { valid: true };

  if (format === 'PDF') {
    return {
      valid: true,
      warning:
        'Não encontrei o cabeçalho %PDF- no início do arquivo. Vou importar mesmo assim e tentar abrir em modo compatibilidade.',
    };
  }

  if (format === 'EPUB') {
    return {
      valid: true,
      warning:
        'Não encontrei assinatura ZIP padrão do EPUB. Vou importar mesmo assim, mas talvez precise reimportar se o arquivo estiver corrompido.',
    };
  }

  return { valid: false, error: 'Arquivo inválido ou corrompido.' };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function cloneArrayBuffer(buffer: ArrayBuffer): ArrayBuffer {
  return buffer.slice(0);
}

export async function normalizeToArrayBuffer(data: ArrayBuffer | Uint8Array | Blob): Promise<ArrayBuffer> {
  if (data instanceof Blob) return data.arrayBuffer();

  if (data instanceof Uint8Array) {
    const copy = new Uint8Array(data.byteLength);
    copy.set(data);
    return copy.buffer as ArrayBuffer;
  }

  return data.slice(0);
}
