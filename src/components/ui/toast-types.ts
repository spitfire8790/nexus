import * as React from 'react';

export interface ToastProps {
  id: string;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
  variant?: 'default' | 'destructive';
  duration?: number;
}

export type ToastActionElement = React.ReactElement;
