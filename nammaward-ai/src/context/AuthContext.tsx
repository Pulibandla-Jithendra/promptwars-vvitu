import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { User, UserRole } from '../types';

// Demo accounts - clearly labelled as demo credentials
const DEMO_ACCOUNTS: Record<string, { password: string; user: User }> = {
  'citizen@demo.com': {
    password: 'citizen123',
    user: { id: 'citizen-1', name: 'Ravi Kumar', role: 'citizen', email: 'citizen@demo.com', ward: 'Ward 12' },
  },
  'staff@demo.com': {
    password: 'staff123',
    user: { id: 'staff-1', name: 'Officer Priya S.', role: 'staff', email: 'staff@demo.com', ward: 'All Wards' },
  },
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem('nammaward_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, password: string) => {
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 800));
    const account = DEMO_ACCOUNTS[email.toLowerCase()];
    if (!account) return { success: false, error: 'Account not found. Use demo credentials shown below.' };
    if (account.password !== password) return { success: false, error: 'Incorrect password. Check the demo credentials.' };
    setUser(account.user);
    sessionStorage.setItem('nammaward_user', JSON.stringify(account.user));
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem('nammaward_user');
  }, []);

  const isRole = useCallback((role: UserRole) => user?.role === role, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { DEMO_ACCOUNTS };
