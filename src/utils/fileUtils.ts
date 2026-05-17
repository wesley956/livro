export interface ValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_SIZE = 100 * 1024 * 1024; // 100MB

export function validateFile(file: File): ValidationResult {
  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'Arquivo muito grande. Máximo: 100MB.' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext !== 'pdf' && ext !== 'epub') {
    return { valid: false, error: 'Formato não suportado. Use PDF ou EPUB.' };
  }

  return { valid: true };
}

export async function validateFileMagic(file: File): Promise<ValidationResult> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // PDF magic: %PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return { valid: true };
  }

  // EPUB/ZIP magic: PK
  if (bytes[0] === 0x50 && bytes[1] === 0x4B) {
    return { valid: true };
  }

  return { valid: false, error: 'Arquivo inválido ou corrompido.' };
}

export function getFileFormat(file: File): 'PDF' | 'EPUB' | null {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'PDF';
  if (ext === 'epub') return 'EPUB';
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
