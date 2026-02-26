import React from 'react';
import { CustomerSupportDashboard } from './CustomerSupportDashboard';

export const SupportScreen: React.FC<{ onOpenChat: () => void }> = ({ onOpenChat }) => {
  return <CustomerSupportDashboard onOpenChat={onOpenChat} />;
};
