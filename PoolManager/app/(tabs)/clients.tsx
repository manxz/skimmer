import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, SafeAreaView, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  interpolate, 
  Extrapolate,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchClients, addClient, updateClient, deleteClient, ClientInput } from '../apiClients';

type Client = ClientInput & { id: string; createdAt: string };

export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newClient, setNewClient] = useState<ClientInput>({ 
    name: '', 
    address: '', 
    phone: '', 
    email: '', 
    serviceDay: '',
    servicePerson: ''
  });
  const [saving, setSaving] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const loadClients = async () => {
    setLoading(true);
    try {
      const data = await fetchClients();
      setClients(data);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch clients from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const validateServiceDay = (serviceDay: string, servicePerson: string, excludeClientId?: string) => {
    if (!serviceDay || !servicePerson) return true;
    
    const clientsOnSameDay = clients.filter(client => 
      client.serviceDay === serviceDay && 
      client.servicePerson === servicePerson &&
      client.id !== excludeClientId
    );
    
    return clientsOnSameDay.length < 10;
  };

  const handleAddClient = async () => {
    if (!newClient.name.trim()) {
      Alert.alert('Missing Info', 'Please fill in client name.');
      return;
    }

    // Only validate if both fields are provided
    if (newClient.serviceDay?.trim() && newClient.servicePerson?.trim()) {
      if (!validateServiceDay(newClient.serviceDay, newClient.servicePerson)) {
        Alert.alert('Too Many Clients', `${newClient.servicePerson} already has 10 clients scheduled for ${newClient.serviceDay}. Please choose a different day or service person.`);
        return;
      }
    }

    setSaving(true);
    try {
      // Only send required fields until backend schema is updated
      const clientData = {
        name: newClient.name,
        address: 'Address to be added', // Placeholder
        phone: 'Phone to be added', // Placeholder
        email: 'email@example.com', // Placeholder
        // Note: serviceDay and servicePerson will be saved once backend schema is updated
      };
      
      await addClient(clientData);
      setNewClient({ name: '', address: '', phone: '', email: '', serviceDay: '', servicePerson: '' });
      setModalVisible(false);
      loadClients();
      Alert.alert('Success', 'Client added successfully! Note: Service day and person will be saved once backend is updated.');
    } catch (err: any) {
      console.error('Add client error:', err);
      Alert.alert('Error', err.message || 'Failed to add client. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClientPress = (client: Client) => {
    setSelectedClient(client);
    setDetailModalVisible(true);
    setHasChanges(false);
  };

  const handleUpdateServiceDay = (client: Client, newServiceDay: string) => {
    if (!validateServiceDay(newServiceDay, client.servicePerson || '', client.id)) {
      Alert.alert('Too Many Clients', `${client.servicePerson} already has 10 clients scheduled for ${newServiceDay}. Please choose a different day.`);
      return;
    }

    // Update the selected client state immediately for UI feedback
    setSelectedClient({ ...client, serviceDay: newServiceDay });
    setHasChanges(true);
  };

  const handleUpdateServicePerson = (client: Client, newServicePerson: string) => {
    if (!validateServiceDay(client.serviceDay || '', newServicePerson, client.id)) {
      Alert.alert('Too Many Clients', `${newServicePerson} already has 10 clients scheduled for ${client.serviceDay}. Please choose a different service person.`);
      return;
    }

    // Update the selected client state immediately for UI feedback
    setSelectedClient({ ...client, servicePerson: newServicePerson });
    setHasChanges(true);
  };

  const handleSaveClientChanges = async (client: Client) => {
    setEditSaving(true);
    try {
      await updateClient(client.id, client);
      setDetailModalVisible(false);
      setSelectedClient(null);
      loadClients();
      Alert.alert('Success', 'Client updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update client.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteClient = (client: Client) => {
    Alert.alert('Delete Client', `Are you sure you want to delete ${client.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteClient(client.id);
            setDetailModalVisible(false);
            setSelectedClient(null);
            loadClients();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete client.');
          }
        }
      }
    ]);
  };

  const handleSwipeDelete = (client: Client) => {
    console.log('Swipe delete triggered for:', client.name);
    Alert.alert('Delete Client', `Are you sure you want to delete ${client.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteClient(client.id);
            loadClients();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete client.');
          }
        }
      }
    ]);
  };

  const renderClientItem = ({ item, index }: { item: Client; index: number }) => {
    const renderRightActions = (progress: any, dragX: any) => {
      return (
        <View style={styles.swipeDeleteButton}>
          <TouchableOpacity
            onPress={() => {
              handleSwipeDelete(item);
            }}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            <View>
              <MaterialIcons name="delete" size={24} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      );
    };

    return (
      <Swipeable
        renderRightActions={renderRightActions}
        rightThreshold={40}
        friction={1.5}
        overshootRight={false}
        enableTrackpadTwoFingerGesture={true}
      >
        <View>
          <TouchableOpacity onPress={() => handleClientPress(item)} activeOpacity={0.7}>
            <View style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.clientName}>{item.name}</Text>
                {(item as any).servicePerson && (
                  <Text style={styles.servicePerson}>
                    {(item as any).servicePerson}
                  </Text>
                )}
              </View>
              <View style={styles.cardRight}>
                {(item as any).serviceDay && (
                  <View style={styles.dayLabel}>
                    <Text style={styles.dayLabelText}>{(item as any).serviceDay.slice(0, 3)}</Text>
                  </View>
                )}
                <MaterialIcons name="chevron-right" size={24} color="#8E8E93" />
              </View>
            </View>
          </TouchableOpacity>
          {index < clients.length - 1 && <View style={styles.divider} />}
        </View>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Client</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={item => item.id}
          renderItem={renderClientItem}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialIcons name="people" size={64} color="#ccc" />
              <Text style={styles.emptyStateTitle}>No Clients Yet</Text>
              <Text style={styles.emptyStateText}>Tap "Add Client" to get started</Text>
            </View>
          }
        />
      )}

      {/* Add Client Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.detailModalContainer}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.detailModalTitle}>Add New Client</Text>
            <TouchableOpacity 
              onPress={handleAddClient}
              style={styles.saveButton}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.detailContent}>
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Client Name</Text>
              <TextInput
                style={styles.detailInput}
                placeholder="Enter client name"
                value={newClient.name}
                onChangeText={text => setNewClient({ ...newClient, name: text })}
                autoFocus
                returnKeyType="next"
              />
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Service Person</Text>
              <View style={styles.personPicker}>
                {['John', 'Sarah', 'Mike', 'Lisa', 'David'].map((person) => (
                  <TouchableOpacity
                    key={person}
                    style={[
                      styles.personButton,
                      newClient.servicePerson === person && styles.personButtonActive
                    ]}
                    onPress={() => setNewClient({ ...newClient, servicePerson: person })}
                    disabled={saving}
                  >
                    <Text style={[
                      styles.personButtonText,
                      newClient.servicePerson === person && styles.personButtonTextActive
                    ]}>
                      {person}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Service Day</Text>
              <View style={styles.dayPicker}>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.dayButton,
                      newClient.serviceDay === day && styles.dayButtonActive
                    ]}
                    onPress={() => setNewClient({ ...newClient, serviceDay: day })}
                    disabled={saving}
                  >
                    <Text style={[
                      styles.dayButtonText,
                      newClient.serviceDay === day && styles.dayButtonTextActive
                    ]}>
                      {day.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Client Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <SafeAreaView style={styles.detailModalContainer}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
            <Text style={styles.detailModalTitle}>Client Details</Text>
            {hasChanges && (
              <TouchableOpacity 
                onPress={() => {
                  if (selectedClient) {
                    handleSaveClientChanges(selectedClient);
                  }
                }}
                style={styles.saveButton}
                disabled={editSaving}
              >
                <Text style={styles.saveButtonText}>
                  {editSaving ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {selectedClient && (
            <View style={{ flex: 1 }}>
              <ScrollView style={styles.detailContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{selectedClient.name}</Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={styles.detailValue}>{selectedClient.address}</Text>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Billing Status</Text>
                  <View style={styles.billingStatus}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Up to date</Text>
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Service Person</Text>
                  <Text style={styles.detailValue}>
                    {(selectedClient as any).servicePerson || 'Not assigned'}
                  </Text>
                  
                  <View style={styles.personPicker}>
                    {['John', 'Sarah', 'Mike', 'Lisa', 'David'].map((person) => (
                      <TouchableOpacity
                        key={person}
                        style={[
                          styles.personButton,
                          (selectedClient as any).servicePerson === person && styles.personButtonActive
                        ]}
                        onPress={() => handleUpdateServicePerson(selectedClient, person)}
                        disabled={editSaving}
                      >
                        <Text style={[
                          styles.personButtonText,
                          (selectedClient as any).servicePerson === person && styles.personButtonTextActive
                        ]}>
                          {person}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Service Day</Text>
                  <Text style={styles.detailValue}>
                    {(selectedClient as any).serviceDay || 'Not set'}
                  </Text>
                  
                  <View style={styles.dayPicker}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                      <TouchableOpacity
                        key={day}
                        style={[
                          styles.dayButton,
                          (selectedClient as any).serviceDay === day && styles.dayButtonActive
                        ]}
                        onPress={() => handleUpdateServiceDay(selectedClient, day)}
                        disabled={editSaving}
                      >
                        <Text style={[
                          styles.dayButtonText,
                          (selectedClient as any).serviceDay === day && styles.dayButtonTextActive
                        ]}>
                          {day.slice(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>
              
              <View style={styles.deleteSection}>
                <TouchableOpacity 
                  onPress={() => {
                    if (selectedClient) handleDeleteClient(selectedClient);
                  }}
                  style={styles.deleteButton}
                >
                  <MaterialIcons name="delete" size={20} color="#ff3b30" />
                  <Text style={styles.deleteButtonText}>Delete Client</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'SF Pro Display',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    marginBottom: 4,
  },
  serviceDay: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    fontFamily: 'SF Pro Display',
    marginTop: 4,
  },
  servicePerson: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '400',
    fontFamily: 'SF Pro Display',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'SF Pro Display',
    marginBottom: 16,
    alignSelf: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'SF Pro Display',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelBtn: {
    padding: 10,
    marginRight: 12,
  },
  saveBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'SF Pro Display',
    textAlign: 'center',
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  detailModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '400',
    fontFamily: 'SF Pro Display',
  },
  detailModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    color: '#000',
  },
  menuButton: {
    padding: 8,
  },
  deleteMenu: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  deleteMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  deleteMenuText: {
    fontSize: 16,
    color: '#ff3b30',
    fontFamily: 'SF Pro Display',
    marginLeft: 8,
  },
  detailContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
    fontFamily: 'SF Pro Display',
  },
  detailValue: {
    fontSize: 17,
    color: '#000',
    fontWeight: '400',
    fontFamily: 'SF Pro Display',
  },
  billingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginRight: 8,
  },
  statusText: {
    fontSize: 17,
    color: '#34C759',
    fontWeight: '500',
    fontFamily: 'SF Pro Display',
  },
  personPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  personButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    minWidth: 60,
    alignItems: 'center',
  },
  personButtonActive: {
    backgroundColor: '#007AFF',
  },
  personButtonText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: 'SF Pro Display',
  },
  personButtonTextActive: {
    color: '#fff',
    fontFamily: 'SF Pro Display',
  },
  dayPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    minWidth: 60,
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#007AFF',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    fontFamily: 'SF Pro Display',
  },
  dayButtonTextActive: {
    color: '#fff',
    fontFamily: 'SF Pro Display',
  },
  cardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dayLabel: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dayLabelText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
  },
  deleteSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    marginLeft: 8,
  },
  detailInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontFamily: 'SF Pro Display',
    marginTop: 8,
  },
  swipeDeleteButton: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  swipeDeleteText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    marginTop: 4,
  },
}); 