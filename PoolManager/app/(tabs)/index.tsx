import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchClients } from '../apiClients';

type Client = {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  serviceDay?: string;
  servicePerson?: string;
  gateCode?: string;
  accessNotes?: string;
  createdAt: string;
};

type ServiceTask = {
  id: string;
  name: string;
  description: string;
  tools: string[];
  chemicals: string[];
};

export default function HomeScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName] = useState('Oscar'); // This would come from user settings/auth
  const [currentTime] = useState(new Date());
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [checkedInClients, setCheckedInClients] = useState<Set<string>>(new Set());

  // Sample service tasks for different clients
  const serviceTasks: ServiceTask[] = [
    {
      id: '1',
      name: 'Chlorine Treatment',
      description: 'Add chlorine tablets to maintain proper levels',
      tools: ['Chlorine tablets', 'Test kit', 'Pool brush'],
      chemicals: ['Chlorine tablets', 'pH adjuster']
    },
    {
      id: '2',
      name: 'Filter Cleaning',
      description: 'Clean and backwash pool filter system',
      tools: ['Filter cleaner', 'Backwash hose', 'Screwdriver'],
      chemicals: ['Filter cleaner solution']
    },
    {
      id: '3',
      name: 'Shock Treatment',
      description: 'Apply shock treatment for algae control',
      tools: ['Pool shock', 'Protective gloves', 'Safety goggles'],
      chemicals: ['Pool shock', 'Chlorine stabilizer']
    },
    {
      id: '4',
      name: 'pH Balance',
      description: 'Adjust pH levels to optimal range',
      tools: ['pH test kit', 'Measuring cup'],
      chemicals: ['pH increaser', 'pH decreaser']
    }
  ];

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
    // Load weekly hours from storage (this would be implemented with AsyncStorage)
    setWeeklyHours(32.5); // Sample data
  }, []);

  const getTodayClients = () => {
    const today = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
    return clients.filter(client => 
      (client as any).serviceDay === today && 
      (client as any).servicePerson === userName
    );
  };

  const handleCheckIn = (clientId: string) => {
    setCheckedInClients(prev => new Set([...prev, clientId]));
    Alert.alert('Checked In', 'You have checked in to this client.');
  };

  const handleCheckOut = (clientId: string) => {
    setCheckedInClients(prev => {
      const newSet = new Set(prev);
      newSet.delete(clientId);
      return newSet;
    });
    Alert.alert('Checked Out', 'You have checked out from this client.');
  };

  const getClientTasks = (client: Client) => {
    // This would be based on client history or preferences
    // For now, return a random task
    const randomTask = serviceTasks[Math.floor(Math.random() * serviceTasks.length)];
    return randomTask;
  };

  const todayClients = getTodayClients();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with greeting */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning, {userName}!</Text>
            <Text style={styles.date}>
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>
          <MaterialIcons name="notifications" size={24} color="#007AFF" />
        </View>

        {/* Weekly Hours Widget */}
        <View style={styles.hoursWidget}>
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetTitle}>This Week's Hours</Text>
            <MaterialIcons name="schedule" size={20} color="#007AFF" />
          </View>
          <View style={styles.hoursContent}>
            <Text style={styles.hoursText}>{weeklyHours}</Text>
            <Text style={styles.hoursLabel}>hours worked</Text>
          </View>
          <View style={styles.hoursProgress}>
            <View style={[styles.progressBar, { width: `${(weeklyHours / 40) * 100}%` }]} />
          </View>
          <Text style={styles.hoursSubtext}>
            {40 - weeklyHours > 0 ? `${(40 - weeklyHours).toFixed(1)} hours to go` : 'Weekly goal reached!'}
          </Text>
        </View>

        {/* Schedule Widget */}
        <View style={styles.scheduleWidget}>
          <View style={styles.widgetHeader}>
            <Text style={styles.widgetTitle}>Today's Schedule</Text>
            <Text style={styles.clientCount}>{todayClients.length} clients</Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading schedule...</Text>
            </View>
          ) : todayClients.length === 0 ? (
            <View style={styles.emptySchedule}>
              <MaterialIcons name="event-available" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No clients scheduled for today</Text>
              <Text style={styles.emptySubtext}>Enjoy your day off!</Text>
            </View>
          ) : (
            <View style={styles.clientList}>
              {todayClients.map((client, index) => {
                const isCheckedIn = checkedInClients.has(client.id);
                const clientTask = getClientTasks(client);
                
                return (
                                       <View key={client.id} style={styles.clientCard}>
                       <View style={styles.clientHeader}>
                         <View style={styles.clientInfo}>
                           <Text style={styles.clientName}>{client.name}</Text>
                           <Text style={styles.clientAddress}>{client.address}</Text>
                         </View>
                         <View style={styles.headerActions}>
                           <TouchableOpacity
                             style={styles.callButton}
                             onPress={() => {
                               // This would open the phone app with the client's number
                               Alert.alert('Call Client', `Call ${client.name} at ${client.phone}?`);
                             }}
                           >
                             <MaterialIcons name="phone" size={20} color="#007AFF" />
                           </TouchableOpacity>
                           <TouchableOpacity
                             style={[
                               styles.checkButton,
                               isCheckedIn ? styles.checkedInButton : styles.checkInButton
                             ]}
                             onPress={() => isCheckedIn ? handleCheckOut(client.id) : handleCheckIn(client.id)}
                           >
                             <MaterialIcons 
                               name={isCheckedIn ? "check-circle" : "radio-button-unchecked"} 
                               size={20} 
                               color={isCheckedIn ? "#fff" : "#007AFF"} 
                             />
                             <Text style={[
                               styles.checkButtonText,
                               isCheckedIn ? styles.checkedInText : styles.checkInText
                             ]}>
                               {isCheckedIn ? 'Checked In' : 'Check In'}
                             </Text>
                           </TouchableOpacity>
                         </View>
                       </View>
                       
                       {/* Access Information */}
                       <View style={styles.accessSection}>
                         <Text style={styles.accessTitle}>Access Information</Text>
                         <View style={styles.accessDetails}>
                           {(client as any).gateCode && (
                             <View style={styles.accessItem}>
                               <MaterialIcons name="lock" size={16} color="#FF9500" />
                               <Text style={styles.accessLabel}>Gate Code:</Text>
                               <Text style={styles.accessValue}>{(client as any).gateCode}</Text>
                             </View>
                           )}
                           {(client as any).accessNotes && (
                             <View style={styles.accessItem}>
                               <MaterialIcons name="info" size={16} color="#007AFF" />
                               <Text style={styles.accessLabel}>Notes:</Text>
                               <Text style={styles.accessValue}>{(client as any).accessNotes}</Text>
                             </View>
                           )}
                           {!((client as any).gateCode || (client as any).accessNotes) && (
                             <View style={styles.accessItem}>
                               <MaterialIcons name="phone" size={16} color="#007AFF" />
                               <Text style={styles.accessValue}>Call client for access</Text>
                             </View>
                           )}
                         </View>
                       </View>
                    
                    <View style={styles.taskSection}>
                      <Text style={styles.taskTitle}>{clientTask.name}</Text>
                      <Text style={styles.taskDescription}>{clientTask.description}</Text>
                      
                      <View style={styles.toolsSection}>
                        <Text style={styles.toolsTitle}>Tools Needed:</Text>
                        <View style={styles.toolsList}>
                          {clientTask.tools.map((tool, toolIndex) => (
                            <View key={toolIndex} style={styles.toolItem}>
                              <MaterialIcons name="build" size={16} color="#007AFF" />
                              <Text style={styles.toolText}>{tool}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      
                      <View style={styles.chemicalsSection}>
                        <Text style={styles.chemicalsTitle}>Chemicals Needed:</Text>
                        <View style={styles.chemicalsList}>
                          {clientTask.chemicals.map((chemical, chemIndex) => (
                            <View key={chemIndex} style={styles.chemicalItem}>
                              <MaterialIcons name="science" size={16} color="#FF9500" />
                              <Text style={styles.chemicalText}>{chemical}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                    
                    {index < todayClients.length - 1 && <View style={styles.cardDivider} />}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'SF Pro Display',
    color: '#1c1c1e',
  },
  date: {
    fontSize: 16,
    color: '#8e8e93',
    fontFamily: 'SF Pro Display',
    marginTop: 4,
  },
  hoursWidget: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  widgetTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    color: '#1c1c1e',
  },
  hoursContent: {
    alignItems: 'center',
    marginBottom: 16,
  },
  hoursText: {
    fontSize: 48,
    fontWeight: '700',
    fontFamily: 'SF Pro Display',
    color: '#007AFF',
  },
  hoursLabel: {
    fontSize: 16,
    color: '#8e8e93',
    fontFamily: 'SF Pro Display',
    marginTop: 4,
  },
  hoursProgress: {
    height: 8,
    backgroundColor: '#e5e5ea',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  hoursSubtext: {
    fontSize: 14,
    color: '#8e8e93',
    fontFamily: 'SF Pro Display',
    textAlign: 'center',
  },
  clientCount: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'SF Pro Display',
    fontWeight: '500',
  },
  scheduleWidget: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8e8e93',
    fontFamily: 'SF Pro Display',
  },
  emptySchedule: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    color: '#8e8e93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8e8e93',
    fontFamily: 'SF Pro Display',
    marginTop: 4,
  },
  clientList: {
    gap: 16,
  },
  clientCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    color: '#1c1c1e',
    marginBottom: 4,
  },
  clientAddress: {
    fontSize: 14,
    color: '#8e8e93',
    fontFamily: 'SF Pro Display',
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  checkInButton: {
    borderColor: '#007AFF',
    backgroundColor: 'transparent',
  },
  checkedInButton: {
    borderColor: '#34C759',
    backgroundColor: '#34C759',
  },
  checkButtonText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'SF Pro Display',
    marginLeft: 4,
  },
  checkInText: {
    color: '#007AFF',
  },
  checkedInText: {
    color: '#fff',
  },
  taskSection: {
    gap: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    color: '#1c1c1e',
  },
  taskDescription: {
    fontSize: 14,
    color: '#8e8e93',
    fontFamily: 'SF Pro Display',
  },
  toolsSection: {
    gap: 8,
  },
  toolsTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    color: '#1c1c1e',
  },
  toolsList: {
    gap: 6,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toolText: {
    fontSize: 14,
    color: '#1c1c1e',
    fontFamily: 'SF Pro Display',
  },
  chemicalsSection: {
    gap: 8,
  },
  chemicalsTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    color: '#1c1c1e',
  },
  chemicalsList: {
    gap: 6,
  },
  chemicalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chemicalText: {
    fontSize: 14,
    color: '#1c1c1e',
    fontFamily: 'SF Pro Display',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e5e5ea',
    marginTop: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  callButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
  },
  accessSection: {
    marginBottom: 16,
    gap: 8,
  },
  accessTitle: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'SF Pro Display',
    color: '#1c1c1e',
  },
  accessDetails: {
    gap: 6,
  },
  accessItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accessLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'SF Pro Display',
    color: '#8e8e93',
  },
  accessValue: {
    fontSize: 14,
    fontFamily: 'SF Pro Display',
    color: '#1c1c1e',
    fontWeight: '500',
  },
});
