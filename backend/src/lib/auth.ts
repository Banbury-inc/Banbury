import jwt from 'jsonwebtoken';

interface User {
  userId: string;
  email: string;
  username: string;
  workspaceId?: string;
}

/**
 * Verify JWT token and return user information
 */
export async function verifyAuthToken(token: string): Promise<User | null> {
  try {
    // For now, we'll use a simple approach
    // In a production environment, you'd want to verify against your actual auth service
    
    // Check if token exists and has basic structure
    if (!token || token.length < 10) {
      return null;
    }

    // For development/testing, we can accept any token that looks like a JWT
    // In production, you'd verify the signature and expiration
    const decoded = jwt.decode(token) as any;
    
    if (!decoded) {
      return null;
    }

    // Extract user information from token
    const user: User = {
      userId: decoded.sub || decoded.userId || 'unknown',
      email: decoded.email || 'unknown@example.com',
      username: decoded.username || decoded.name || 'unknown',
      workspaceId: decoded.workspaceId || 'default'
    };

    return user;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

/**
 * Create a mock user for development/testing
 */
export function createMockUser(): User {
  return {
    userId: 'test-user-123',
    email: 'test@example.com',
    username: 'testuser',
    workspaceId: 'test-workspace'
  };
}
