import { z } from 'zod';

// Authentication schemas
export const registerSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(24, 'Username must be at most 24 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*]/, 'Password must contain at least one special character (!@#$%^&*)'),
  email: z.string()
    .email('Invalid email address')
    .max(255, 'Email is too long')
    .optional()
    .or(z.literal(''))
});

export const loginSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .max(24, 'Username is too long'),
  password: z.string()
    .min(1, 'Password is required')
});

// Step 1: Request a password reset code
export const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Step 2: Verify the 6-digit reset code
export const verifyResetTokenSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string()
    .length(6, 'Reset code must be 6 digits')
    .regex(/^\d{6}$/, 'Reset code must be 6 digits'),
});

// Step 3: Set new password with valid code
export const passwordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string()
    .length(6, 'Reset code must be 6 digits')
    .regex(/^\d{6}$/, 'Reset code must be 6 digits'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password is too long'),
});

// Post schemas
export const createPostSchema = z.object({
  content: z.string()
    .min(1, 'Content cannot be empty')
    .max(10000, 'Post is too long (max 10,000 characters)'),
  mediaUrl: z.string()
    .url('Invalid media URL')
    .optional()
    .or(z.literal('')),
  pollOptions: z.array(z.string()).optional(),
  pollQuestion: z.string().optional()
});

// Comment schemas
export const createCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment is too long (max 2,000 characters)'),
  parentId: z.number().int().positive().optional()
});

// User update schema
export const updateUserSchema = z.object({
  bio: z.string().max(500, 'Bio is too long').optional(),
  profilePicture: z.string().url('Invalid profile picture URL').optional().or(z.literal('')),
  coverPhoto: z.string().url('Invalid cover photo URL').optional().or(z.literal('')),
  birthday: z.string().optional(),
  location: z.string().max(100, 'Location is too long').optional()
});

// Message schema
export const sendMessageSchema = z.object({
  receiverId: z.number().int().positive('Invalid receiver ID'),
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(5000, 'Message is too long (max 5,000 characters)')
});

// Story schema
export const createStorySchema = z.object({
  mediaUrl: z.string()
    .min(1, 'Media URL is required')
    .max(1000, 'Media URL is too long'),
  caption: z.string()
    .max(200, 'Caption is too long (max 200 characters)')
    .optional()
});

// Event schema
export const createEventSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title is too long'),
  description: z.string()
    .max(5000, 'Description is too long')
    .optional(),
  location: z.string()
    .max(200, 'Location is too long')
    .optional(),
  startTime: z.string()
    .datetime('Invalid start time format'),
  endTime: z.string()
    .datetime('Invalid end time format')
    .optional(),
  coverImage: z.string()
    .url('Invalid cover image URL')
    .optional()
    .or(z.literal(''))
});

// Group schema
export const createGroupSchema = z.object({
  name: z.string()
    .min(1, 'Group name is required')
    .max(100, 'Group name is too long'),
  description: z.string()
    .max(1000, 'Description is too long')
    .optional(),
  coverImage: z.string()
    .url('Invalid cover image URL')
    .optional()
    .or(z.literal('')),
  isPrivate: z.boolean().optional()
});
