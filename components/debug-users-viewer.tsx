import { BorderRadius, Colors, Spacing } from '@/constants/design-system';
import { AuthService, PublicUser } from '@/services/auth.service';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface DebugUsersViewerProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Composant de débogage pour visualiser tous les utilisateurs
 * (ceux de users.json + ceux créés dans AsyncStorage)
 */
export function DebugUsersViewer({ visible, onClose }: DebugUsersViewerProps) {
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await AuthService.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Réinitialiser',
      'Voulez-vous supprimer tous les utilisateurs créés (conserve ceux de users.json) ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.resetUsers();
              await loadUsers();
              Alert.alert('Succès', 'Utilisateurs réinitialisés');
            } catch (error) {
              Alert.alert('Erreur', 'Échec de la réinitialisation');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>👤 Utilisateurs ({users.length})</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={Colors.text.dark} />
          </TouchableOpacity>
        </View>

        {/* Légende */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.badge, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>users.json</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.badge, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>AsyncStorage</Text>
          </View>
        </View>

        {/* Liste des utilisateurs */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <Text style={styles.loadingText}>Chargement...</Text>
          ) : users.length === 0 ? (
            <Text style={styles.emptyText}>Aucun utilisateur</Text>
          ) : (
            users.map((user, index) => {
              // Déterminer si l'utilisateur vient de users.json ou AsyncStorage
              // (basé sur l'ID: les IDs de users.json sont courts, ceux créés sont des timestamps)
              const isFromJson = user.id.length < 5;
              
              return (
                <View key={user.id} style={styles.userCard}>
                  <View style={styles.userHeader}>
                    <View style={styles.userInfo}>
                      <View style={styles.userNameRow}>
                        <Text style={styles.userName}>{user.name}</Text>
                        <View
                          style={[
                            styles.badge,
                            {
                              backgroundColor: isFromJson ? '#3B82F6' : '#10B981',
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <Text style={styles.userMeta}>
                        ID: {user.id} • Créé: {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.refreshButton} onPress={loadUsers}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.refreshButtonText}>Rafraîchir</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="trash" size={20} color="white" />
            <Text style={styles.resetButtonText}>Réinitialiser</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

type DebugStyles = {
  container: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  closeButton: ViewStyle;
  legend: ViewStyle;
  legendItem: ViewStyle;
  legendText: TextStyle;
  badge: ViewStyle;
  scrollView: ViewStyle;
  scrollContent: ViewStyle;
  loadingText: TextStyle;
  emptyText: TextStyle;
  userCard: ViewStyle;
  userHeader: ViewStyle;
  userInfo: ViewStyle;
  userNameRow: ViewStyle;
  userName: TextStyle;
  userEmail: TextStyle;
  userMeta: TextStyle;
  actions: ViewStyle;
  refreshButton: ViewStyle;
  refreshButtonText: TextStyle;
  resetButton: ViewStyle;
  resetButtonText: TextStyle;
};

const styles = StyleSheet.create<DebugStyles>({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.lg,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.dark,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingVertical: Spacing.md,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280',
  },
  badge: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#9CA3AF',
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.dark,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  userMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: Spacing.lg,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  refreshButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resetButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

