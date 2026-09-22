import React, { createContext, useContext, useState, ReactNode } from 'react';
import ConfirmModal from '../components/ui/ConfirmModal';
import AlertModal from '../components/ui/AlertModal';

interface AlertContextType {
  showAlert: (message: string, isError?: boolean, title?: string) => void;
  showConfirm: (message: string, onConfirm: () => void, title?: string, isDestructive?: boolean) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    message: string;
    isError: boolean;
    title?: string;
  }>({
    isOpen: false,
    message: "",
    isError: false,
  });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
    isDestructive: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: "",
    isDestructive: true,
    onConfirm: () => {},
  });

  const showAlert = (message: string, isError = false, title?: string) => {
    setAlertState({ isOpen: true, message, isError, title });
  };

  const showConfirm = (message: string, onConfirm: () => void, title?: string, isDestructive = true) => {
    setConfirmState({ isOpen: true, message, onConfirm, title, isDestructive });
  };

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      <AlertModal
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        isError={alertState.isError}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        isDestructive={confirmState.isDestructive}
        onConfirm={() => {
          confirmState.onConfirm();
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
}
