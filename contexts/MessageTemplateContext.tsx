import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';

export interface MessageTemplate {
  id: string;
  name: string;
  message: string;
  type: 'reminder' | 'alert' | 'whatsapp' | 'custom';
}

export interface MessageTemplates {
  templates: MessageTemplate[];
  activeReminder: string;
  activeAlert: string;
  activeWhatsApp: string;
}

const MESSAGE_TEMPLATES_KEY = '@messageTemplates';

const defaultTemplates: MessageTemplates = {
  templates: [
    {
      id: 'default_reminder',
      name: 'Payment Reminder',
      message: 'Dear {customerName}, this is a reminder that your payment of {amount} {currency} is due on {dueDate}. Please make the payment on time. Thank you!',
      type: 'reminder',
    },
    {
      id: 'default_alert',
      name: 'Payment Alert',
      message: 'Payment Alert: {customerName} has a payment of {amount} {currency} due on {dueDate}.',
      type: 'alert',
    },
    {
      id: 'default_whatsapp',
      name: 'WhatsApp Message',
      message: 'Hello {customerName},\n\nThis is a friendly reminder about your upcoming payment.\n\nAmount: {amount} {currency}\nDue Date: {dueDate}\nLoan ID: {loanId}\n\nPlease contact us if you have any questions.\n\nThank you!',
      type: 'whatsapp',
    },
  ],
  activeReminder: 'default_reminder',
  activeAlert: 'default_alert',
  activeWhatsApp: 'default_whatsapp',
};

export const [MessageTemplateProvider, useMessageTemplates] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [templates, setTemplates] = useState<MessageTemplates>(defaultTemplates);

  const templatesQuery = useQuery({
    queryKey: ['messageTemplates'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(MESSAGE_TEMPLATES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...defaultTemplates,
          ...parsed,
          templates: [...defaultTemplates.templates, ...(parsed.templates || [])].filter(
            (template, index, self) =>
              index === self.findIndex((t) => t.id === template.id)
          ),
        };
      }
      return defaultTemplates;
    },
  });

  useEffect(() => {
    if (templatesQuery.data) {
      setTemplates(templatesQuery.data);
    }
  }, [templatesQuery.data]);

  const saveTemplatesMutation = useMutation({
    mutationFn: async (newTemplates: MessageTemplates) => {
      await AsyncStorage.setItem(MESSAGE_TEMPLATES_KEY, JSON.stringify(newTemplates));
      return newTemplates;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
    },
  });

  const { mutate: saveTemplates } = saveTemplatesMutation;

  const addTemplate = useCallback(
    (template: Omit<MessageTemplate, 'id'>) => {
      const newTemplate: MessageTemplate = {
        ...template,
        id: `custom_${Date.now()}`,
      };
      const newTemplates = {
        ...templates,
        templates: [...templates.templates, newTemplate],
      };
      setTemplates(newTemplates);
      saveTemplates(newTemplates);
      return newTemplate;
    },
    [templates, saveTemplates]
  );

  const updateTemplate = useCallback(
    (id: string, updates: Partial<Omit<MessageTemplate, 'id'>>) => {
      const newTemplates = {
        ...templates,
        templates: templates.templates.map((t) =>
          t.id === id ? { ...t, ...updates } : t
        ),
      };
      setTemplates(newTemplates);
      saveTemplates(newTemplates);
    },
    [templates, saveTemplates]
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      if (id.startsWith('default_')) {
        return;
      }
      const newTemplates = {
        ...templates,
        templates: templates.templates.filter((t) => t.id !== id),
      };
      setTemplates(newTemplates);
      saveTemplates(newTemplates);
    },
    [templates, saveTemplates]
  );

  const setActiveTemplate = useCallback(
    (type: 'reminder' | 'alert' | 'whatsapp', templateId: string) => {
      const newTemplates = {
        ...templates,
        ...(type === 'reminder' && { activeReminder: templateId }),
        ...(type === 'alert' && { activeAlert: templateId }),
        ...(type === 'whatsapp' && { activeWhatsApp: templateId }),
      };
      setTemplates(newTemplates);
      saveTemplates(newTemplates);
    },
    [templates, saveTemplates]
  );

  const formatMessage = useCallback(
    (templateId: string, data: Record<string, string | number>) => {
      const template = templates.templates.find((t) => t.id === templateId);
      if (!template) {
        return '';
      }

      let message = template.message;
      Object.keys(data).forEach((key) => {
        message = message.replace(new RegExp(`{${key}}`, 'g'), String(data[key]));
      });
      return message;
    },
    [templates]
  );

  const getActiveTemplate = useCallback(
    (type: 'reminder' | 'alert' | 'whatsapp') => {
      const activeId =
        type === 'reminder'
          ? templates.activeReminder
          : type === 'alert'
          ? templates.activeAlert
          : templates.activeWhatsApp;
      return templates.templates.find((t) => t.id === activeId);
    },
    [templates]
  );

  return {
    templates: templates.templates,
    activeReminder: templates.activeReminder,
    activeAlert: templates.activeAlert,
    activeWhatsApp: templates.activeWhatsApp,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    setActiveTemplate,
    formatMessage,
    getActiveTemplate,
    isLoading: templatesQuery.isLoading,
  };
});
