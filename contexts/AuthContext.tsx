import createContextHook from '@nkzw/create-context-hook';
import { useState } from 'react';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<null>(null);

  return {
    user,
    signIn: async () => {
      console.log('Auth not implemented');
    },
    signOut: async () => {
      console.log('Auth not implemented');
    },
  };
});
