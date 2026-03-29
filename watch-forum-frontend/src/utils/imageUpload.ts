import { api } from '@/lib/api';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateImageFile = (file: File): ValidationResult => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: `Invalid file type: ${file.type}. Only JPG, PNG, GIF, WEBP are allowed.` };
  }
  const lower = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some(ext => lower.endsWith(ext))) {
    return { valid: false, error: 'Invalid file extension. Only .jpg, .jpeg, .png, .gif, and .webp files are allowed.' };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 5MB.` };
  }
  return { valid: true };
};

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const uploadImage = async (file: File): Promise<UploadResult> => {
  const validation = validateImageFile(file);
  if (!validation.valid) return { success: false, error: validation.error };
  try {
    const formData = new FormData();
    formData.append('image', file);
    const data = await api.post('/uploads/image', formData);
    return { success: true, url: data.url };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to upload image' };
  }
};

export const uploadThreadImage = async (file: File): Promise<UploadResult> => {
  const validation = validateImageFile(file);
  if (!validation.valid) return { success: false, error: validation.error };
  try {
    const formData = new FormData();
    formData.append('image', file);
    const data = await api.post('/uploads/image', formData);
    return { success: true, url: data.url };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to upload image' };
  }
};

export const uploadMultipleImages = async (files: FileList): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  for (let i = 0; i < files.length; i += 1) {
    results.push(await uploadThreadImage(files[i]));
  }
  return results;
};
