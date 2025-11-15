import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Plus, Edit2, Trash2, Check } from 'lucide-react-native';
import { useMessageTemplates, MessageTemplate } from '@/contexts/MessageTemplateContext';
import Colors from '@/constants/colors';
import { useResponsive } from '@/utils/responsive';

export default function MessageTemplatesScreen() {
  const router = useRouter();
  const { templates, activeReminder, activeAlert, activeWhatsApp, addTemplate, updateTemplate, deleteTemplate, setActiveTemplate } = useMessageTemplates();
  const { contentMaxWidth, horizontalPadding } = useResponsive();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateMessage, setNewTemplateMessage] = useState('');
  const [newTemplateType, setNewTemplateType] = useState<'reminder' | 'alert' | 'whatsapp' | 'custom'>('custom');

  const handleAddTemplate = () => {
    if (!newTemplateName.trim() || !newTemplateMessage.trim()) {
      Alert.alert('Error', 'Please enter both name and message');
      return;
    }

    addTemplate({
      name: newTemplateName,
      message: newTemplateMessage,
      type: newTemplateType,
    });

    setNewTemplateName('');
    setNewTemplateMessage('');
    setNewTemplateType('custom');
    setShowAddModal(false);
    Alert.alert('Success', 'Template added successfully');
  };

  const handleEditTemplate = () => {
    if (!editingTemplate || !newTemplateName.trim() || !newTemplateMessage.trim()) {
      Alert.alert('Error', 'Please enter both name and message');
      return;
    }

    updateTemplate(editingTemplate.id, {
      name: newTemplateName,
      message: newTemplateMessage,
    });

    setEditingTemplate(null);
    setNewTemplateName('');
    setNewTemplateMessage('');
    setShowEditModal(false);
    Alert.alert('Success', 'Template updated successfully');
  };

  const handleDeleteTemplate = (template: MessageTemplate) => {
    if (template.id.startsWith('default_')) {
      Alert.alert('Error', 'Default templates cannot be deleted');
      return;
    }

    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTemplate(template.id);
            Alert.alert('Success', 'Template deleted successfully');
          },
        },
      ]
    );
  };

  const openEditModal = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setNewTemplateName(template.name);
    setNewTemplateMessage(template.message);
    setShowEditModal(true);
  };

  const renderTemplate = (template: MessageTemplate) => {
    const isActiveReminder = template.id === activeReminder;
    const isActiveAlert = template.id === activeAlert;
    const isActiveWhatsApp = template.id === activeWhatsApp;
    const isActive = isActiveReminder || isActiveAlert || isActiveWhatsApp;

    return (
      <View key={template.id} style={[styles.templateCard, isActive && styles.templateCardActive]}>
        <View style={styles.templateHeader}>
          <View style={styles.templateHeaderLeft}>
            <Text style={styles.templateName}>{template.name}</Text>
            <Text style={styles.templateType}>
              {template.type.charAt(0).toUpperCase() + template.type.slice(1)}
            </Text>
          </View>
          <View style={styles.templateActions}>
            {!template.id.startsWith('default_') && (
              <>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openEditModal(template)}
                >
                  <Edit2 color={Colors.info} size={18} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteTemplate(template)}
                >
                  <Trash2 color={Colors.error} size={18} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
        <Text style={styles.templateMessage}>{template.message}</Text>
        <View style={styles.templateFooter}>
          <Text style={styles.templateHelp}>
            Available variables: {'{customerName}'}, {'{amount}'}, {'{currency}'}, {'{dueDate}'}, {'{loanId}'}
          </Text>
          {!isActive && (
            <View style={styles.setActiveButtons}>
              <TouchableOpacity
                style={[styles.setActiveButton, styles.reminderButton]}
                onPress={() => {
                  setActiveTemplate('reminder', template.id);
                  Alert.alert('Success', 'Set as active reminder template');
                }}
              >
                <Text style={styles.setActiveButtonText}>Set Reminder</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.setActiveButton, styles.alertButton]}
                onPress={() => {
                  setActiveTemplate('alert', template.id);
                  Alert.alert('Success', 'Set as active alert template');
                }}
              >
                <Text style={styles.setActiveButtonText}>Set Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.setActiveButton, styles.whatsappButton]}
                onPress={() => {
                  setActiveTemplate('whatsapp', template.id);
                  Alert.alert('Success', 'Set as active WhatsApp template');
                }}
              >
                <Text style={styles.setActiveButtonText}>Set WhatsApp</Text>
              </TouchableOpacity>
            </View>
          )}
          {isActive && (
            <View style={styles.activeIndicator}>
              <Check color={Colors.success} size={16} />
              <Text style={styles.activeText}>
                Active as {isActiveReminder ? 'Reminder' : isActiveAlert ? 'Alert' : 'WhatsApp'}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Message Templates',
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: '#FFFFFF',
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding, alignSelf: 'center', width: '100%', maxWidth: contentMaxWidth },
        ]}
      >
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Customize Your Messages</Text>
          <Text style={styles.infoText}>
            Create and customize messages for payment reminders, alerts, and WhatsApp notifications. Use variables like {'{customerName}'}, {'{amount}'}, and {'{dueDate}'} to personalize messages.
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Templates</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus color="#FFFFFF" size={20} />
              <Text style={styles.addButtonText}>Add Template</Text>
            </TouchableOpacity>
          </View>

          {templates.map(renderTemplate)}
        </View>
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Template</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Template Name</Text>
              <TextInput
                style={styles.input}
                value={newTemplateName}
                onChangeText={setNewTemplateName}
                placeholder="Enter template name"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newTemplateMessage}
                onChangeText={setNewTemplateMessage}
                placeholder="Enter your message with variables like {customerName}, {amount}, {dueDate}"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={6}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Type</Text>
              <View style={styles.typeButtons}>
                {(['reminder', 'alert', 'whatsapp', 'custom'] as const).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeButton,
                      newTemplateType === type && styles.typeButtonActive,
                    ]}
                    onPress={() => setNewTemplateType(type)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        newTemplateType === type && styles.typeButtonTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleAddTemplate}>
              <Text style={styles.saveButtonText}>Add Template</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Template</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Template Name</Text>
              <TextInput
                style={styles.input}
                value={newTemplateName}
                onChangeText={setNewTemplateName}
                placeholder="Enter template name"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newTemplateMessage}
                onChangeText={setNewTemplateMessage}
                placeholder="Enter your message"
                placeholderTextColor={Colors.textSecondary}
                multiline
                numberOfLines={6}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleEditTemplate}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 32,
  },
  infoCard: {
    backgroundColor: Colors.info + '15',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.info,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  templateCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  templateCardActive: {
    borderWidth: 2,
    borderColor: Colors.success,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateHeaderLeft: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  templateType: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  templateMessage: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  templateFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
  },
  templateHelp: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  setActiveButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setActiveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  reminderButton: {
    backgroundColor: Colors.info,
  },
  alertButton: {
    backgroundColor: Colors.warning,
  },
  whatsappButton: {
    backgroundColor: Colors.success,
  },
  setActiveButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalClose: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
