import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getPendingRequests } from '../services/readApi';

const FriendRequestContext = createContext({ pendingCount: 0, refreshPending: () => {} });

export function FriendRequestProvider({ children }) {
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPending = useCallback(async () => {
    try {
      const data = await getPendingRequests();
      setPendingCount(Array.isArray(data) ? data.length : 0);
    } catch {
      // silent fail — badge just stays as-is
    }
  }, []);

  useEffect(() => {
    refreshPending();
  }, [refreshPending]);

  return (
    <FriendRequestContext.Provider value={{ pendingCount, refreshPending }}>
      {children}
    </FriendRequestContext.Provider>
  );
}

export function useFriendRequests() {
  return useContext(FriendRequestContext);
}
