import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ActiveStateContextValue {
  activeConversationId: string | null;
  activeQuerySessionId: string | null;
  setActiveConversationId: (id: string | null) => void;
  setActiveQuerySessionId: (id: string | null) => void;
  startNewChat: () => void;
}

const ActiveStateContext = createContext<ActiveStateContextValue | null>(null);

export function ActiveStateProvider({ children }: { children: ReactNode }) {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeQuerySessionId, setActiveQuerySessionId] = useState<string | null>(null);

  const startNewChat = () => {
    setActiveConversationId(null);
    setActiveQuerySessionId(null);
  };

  return (
    <ActiveStateContext.Provider
      value={{
        activeConversationId,
        activeQuerySessionId,
        setActiveConversationId,
        setActiveQuerySessionId,
        startNewChat,
      }}
    >
      {children}
    </ActiveStateContext.Provider>
  );
}

export function useActiveState() {
  const context = useContext(ActiveStateContext);
  if (!context) {
    throw new Error('useActiveState must be used within an ActiveStateProvider');
  }
  return context;
}
