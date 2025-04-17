import { COLORS } from '@/constants/theme';
import { FirebaseAuthTypes, getAuth } from '@react-native-firebase/auth';
import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Text,
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import {
  doc,
  getFirestore,
  onSnapshot,
  updateDoc,
} from '@react-native-firebase/firestore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import analytics from '@react-native-firebase/analytics';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  cost: number;
}

export default function Shop() {
  // Set an initializing state whilst Firebase connects
  const [initializing, setInitializing] = useState<boolean>(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [userTokens, setUserTokens] = useState<number>(0);
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);

  const shopItems: ShopItem[] = [
    {
      id: 'pillow',
      name: 'Premium Pillow',
      description: 'A comfortable pillow to improve your sleep quality',
      cost: 20000,
    },
    {
      id: 'blanket',
      name: 'Cozy Blanket',
      description: 'Stay warm at night with this soft blanket',
      cost: 15000,
    },
    {
      id: 'sleep-mask',
      name: 'Sleep Mask',
      description: 'Block out light for improved sleep quality',
      cost: 5000,
    },
  ];

  function onAuthStateChanged(user: FirebaseAuthTypes.User | null) {
    setUser(user);
    if (initializing) setInitializing(false);
  }

  useEffect(() => {
    const subscriber = getAuth().onAuthStateChanged(onAuthStateChanged);
    return subscriber; // unsubscribe on unmount
  }, []);

  useEffect(() => {
    const getUserData = (user: FirebaseAuthTypes.User) => {
      const db = getFirestore();
      const userDocRef = doc(db, 'users', user.uid);
      onSnapshot(userDocRef, (docSnap) => {
        if (docSnap?.exists) {
          setUserTokens(docSnap?.data()?.tokens || 0);
        }
      });
    };

    if (user) {
      getUserData(user);
    }
  }, [user]);

  const handleBuyMoreTokens = () => {
    Alert.alert(
      'Buy More Tokens',
      'You will be able to buy more tokens with real money soon! For now, you can earn tokens by maintaining your sleep streak.',
      [{ text: 'OK', onPress: () => console.log('OK Pressed') }],
    );
  };

  const handleItemPress = (item: ShopItem) => {
    setSelectedItem(item);
    setShowPurchaseModal(true);
  };

  const handlePurchase = async () => {
    if (!selectedItem || !user) return;

    if (userTokens < selectedItem.cost) {
      Alert.alert(
        'Insufficient Tokens',
        `You don't have enough tokens to purchase this item. Continue tracking your sleep to earn more tokens or tap the + button to buy more!`,
        [{ text: 'OK', onPress: () => setShowPurchaseModal(false) }],
      );
      return;
    }

    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', user.uid);

      await updateDoc(userRef, {
        tokens: userTokens - selectedItem.cost,
      });

      await analytics().logEvent('item_purchase', {
        userId: user.uid,
        itemId: selectedItem.id,
        itemName: selectedItem.name,
        itemCost: selectedItem.cost,
      });

      Alert.alert(
        'Purchase Successful',
        `You have successfully purchased ${selectedItem.name}!`,
        [{ text: 'Great!', onPress: () => setShowPurchaseModal(false) }],
      );
    } catch (error) {
      console.error('Error during purchase:', error);
      Alert.alert('Error', 'There was a problem completing your purchase.');
      setShowPurchaseModal(false);
    }
  };

  const renderShopItem = ({ item }: { item: ShopItem }) => (
    <TouchableOpacity
      style={styles.itemCard}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDescription}>{item.description}</Text>
        </View>
      </View>
      <View style={styles.costContainer}>
        <MaterialCommunityIcons
          name="poker-chip"
          size={20}
          color={COLORS.accent}
        />
        <Text style={styles.costText}>{item.cost}</Text>
      </View>
    </TouchableOpacity>
  );

  if (initializing) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View style={styles.container}>
        <Text style={styles.title}>Shop</Text>

        <View style={styles.tokenContainer}>
          <MaterialCommunityIcons
            name="poker-chip"
            size={36}
            color={COLORS.accent}
          />
          <Text style={styles.tokensText}>{userTokens}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleBuyMoreTokens}
          >
            <MaterialIcons name="add" size={28} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Available Items</Text>

        <FlatList
          data={shopItems}
          renderItem={renderShopItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.itemList}
          showsVerticalScrollIndicator={false}
          style={{ width: '100%' }}
        />
      </View>

      <Modal
        visible={showPurchaseModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Purchase</Text>

            {selectedItem && (
              <>
                <View style={styles.modalItemInfo}>
                  <Text style={styles.modalItemName}>{selectedItem.name}</Text>
                  <Text style={styles.modalItemDescription}>
                    {selectedItem.description}
                  </Text>
                </View>

                <View style={styles.modalCost}>
                  <Text style={styles.modalCostLabel}>Cost: </Text>
                  <MaterialCommunityIcons
                    name="poker-chip"
                    size={20}
                    color={COLORS.accent}
                  />
                  <Text style={styles.modalCostValue}>{selectedItem.cost}</Text>
                </View>

                <Text style={styles.modalBalance}>
                  Your balance: {userTokens} tokens
                </Text>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowPurchaseModal(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.confirmButton,
                      userTokens < selectedItem.cost && styles.disabledButton,
                    ]}
                    onPress={handlePurchase}
                    disabled={userTokens < selectedItem.cost}
                  >
                    <Text style={styles.buttonText}>
                      {userTokens < selectedItem.cost
                        ? 'Not Enough Tokens'
                        : 'Purchase'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 16,
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    alignSelf: 'center',
  },
  tokenContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
    gap: 10,
    marginBottom: 30,
  },
  tokensText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginRight: 10,
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  itemList: {
    width: '100%',
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: '100%',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemInfo: {
    marginLeft: 16,
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: COLORS.icon,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background + '80',
    padding: 8,
    borderRadius: 16,
    marginLeft: 8,
  },
  costText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
  },
  modalItemInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalItemName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginVertical: 10,
  },
  modalItemDescription: {
    fontSize: 16,
    color: COLORS.icon,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalCost: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCostLabel: {
    fontSize: 18,
    color: COLORS.text,
  },
  modalCostValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginLeft: 4,
  },
  modalBalance: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.lightBackground,
    marginRight: 10,
  },
  confirmButton: {
    backgroundColor: COLORS.accent,
  },
  disabledButton: {
    backgroundColor: COLORS.lightBackground,
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
