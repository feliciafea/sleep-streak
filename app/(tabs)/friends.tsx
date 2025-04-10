import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import { getAuth, FirebaseAuthTypes } from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from '@react-native-firebase/firestore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import analytics from '@react-native-firebase/analytics';

interface Friend {
  id: string;
  email: string;
  streak: number;
}

interface FriendRequest {
  id: string;
  senderEmail: string;
  senderId: string;
}

export default function FriendsScreen() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [email, setEmail] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Fetch friends list and pending requests when user changes
  useEffect(() => {
    if (!user) return;
    const db = getFirestore();

    const friendsUnsubscribe = onSnapshot(
      query(
        collection(db, 'friends'),
        where('users', 'array-contains', user.uid),
      ),
      async (querySnapshot) => {
        if (querySnapshot.empty) {
          setFriends([]);
          return;
        }

        const friendsList: Friend[] = [];
        const friendPromises = querySnapshot.docs.map(async (document) => {
          const friendData = document.data();
          const friendId = friendData.users.find(
            (id: string) => id !== user.uid,
          );

          // Get user details
          const userDoc = await getDoc(doc(db, 'users', friendId));
          const userData = userDoc.data();

          friendsList.push({
            id: friendId,
            email: userData?.email || 'Unknown Email',
            streak: userData?.streak || 0,
          });
        });

        await Promise.all(friendPromises);

        friendsList.sort((a, b) => b.streak - a.streak);
        setFriends(friendsList);
      },
    );

    const requestsUnsubscribe = onSnapshot(
      query(
        collection(db, 'friendRequests'),
        where('receiverId', '==', user.uid),
      ),
      (querySnapshot) => {
        if (querySnapshot.empty) {
          setPendingRequests([]);
          return;
        }

        const requests: FriendRequest[] = [];
        querySnapshot.forEach((doc) => {
          requests.push({
            id: doc.id,
            senderEmail: doc.data().senderEmail,
            senderId: doc.data().senderId,
          });
        });
        setPendingRequests(requests);
      },
    );

    return () => {
      friendsUnsubscribe();
      requestsUnsubscribe();
    };
  }, [user]);

  const sendFriendRequest = async () => {
    if (!email.trim() || !user) return;

    try {
      setLoading(true);
      const db = getFirestore();

      // Check if user exists
      const usersQuery = await getDocs(
        query(collection(db, 'users'), where('email', '==', email.trim())),
      );
      let userExists = null;
      if (!usersQuery.empty) {
        const userDoc = usersQuery.docs[0];
        userExists = {
          uid: userDoc.id,
          ...userDoc.data(),
        };
      }
      if (!userExists) {
        Alert.alert('Error', 'User with this email does not exist');
        setLoading(false);
        return;
      }

      const receiverId = userExists.uid;

      // Check if it's the current user
      if (receiverId === user.uid) {
        Alert.alert('Error', 'You cannot add yourself as a friend');
        setLoading(false);
        return;
      }

      // Check if already friends
      const friendCheck = await getDocs(
        query(
          collection(db, 'friends'),
          where('users', 'array-contains', user.uid),
        ),
      );
      let alreadyFriends = false;
      friendCheck.forEach((doc) => {
        const data = doc.data();
        if (data.users.includes(receiverId)) {
          alreadyFriends = true;
        }
      });
      if (alreadyFriends) {
        Alert.alert('Info', 'You are already friends with this user');
        setLoading(false);
        return;
      }

      // Check if request already sent
      const requestCheck = await getDocs(
        query(
          collection(db, 'friendRequests'),
          where('senderId', '==', user.uid),
          where('receiverId', '==', receiverId),
        ),
      );
      if (!requestCheck.empty) {
        Alert.alert('Info', 'Friend request already sent');
        setLoading(false);
        return;
      }

      // Check if there's a pending request from them
      const pendingCheck = await getDocs(
        query(
          collection(db, 'friendRequests'),
          where('senderId', '==', receiverId),
          where('receiverId', '==', user.uid),
        ),
      );
      if (!pendingCheck.empty) {
        Alert.alert(
          'Info',
          'This user has already sent you a friend request. Check your pending requests.',
        );
        setLoading(false);
        return;
      }

      await setDoc(doc(collection(db, 'friendRequests')), {
        senderId: user.uid,
        senderEmail: user.email,
        receiverId: receiverId,
        receiverEmail: email.trim(),
        createdAt: new Date(),
      });

      await analytics().logEvent('send_friend_request', {
        senderId: user.uid,
        senderEmail: user.email,
        receiverId: receiverId,
        receiverEmail: email.trim(),
      });

      Alert.alert('Success', 'Friend request sent');
      setEmail('');
    } catch (error) {
      console.error('Error sending friend request:', error);
      Alert.alert('Error', 'Failed to send friend request');
    } finally {
      setLoading(false);
    }
  };

  const acceptFriendRequest = async (request: FriendRequest) => {
    if (!user) return;

    try {
      setLoading(true);
      const db = getFirestore();

      await setDoc(doc(collection(db, 'friends')), {
        users: [user.uid, request.senderId],
        createdAt: new Date(),
      });
      await deleteDoc(doc(db, 'friendRequests', request.id));

      await analytics().logEvent('accept_friend_request', {
        senderId: request.senderId,
        senderEmail: request.senderEmail,
        accepterId: user.uid,
        accepterEmail: user.email,
      });

      Alert.alert('Success', 'Friend request accepted');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      Alert.alert('Error', 'Failed to accept friend request');
    } finally {
      setLoading(false);
    }
  };

  const rejectFriendRequest = async (request: FriendRequest) => {
    try {
      setLoading(true);
      const db = getFirestore();

      // Delete the request
      await deleteDoc(doc(db, 'friendRequests', request.id));

      await analytics().logEvent('reject_friend_request', {
        senderId: request.senderId,
        senderEmail: request.senderEmail,
        rejectorId: user?.uid,
        rejectorEmail: user?.email,
      });

      Alert.alert('Success', 'Friend request rejected');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      Alert.alert('Error', 'Failed to reject friend request');
    } finally {
      setLoading(false);
    }
  };

  const removeFriend = async (friend: Friend) => {
    if (!user) return;

    try {
      setLoading(true);
      const db = getFirestore();

      // Find the friendship document
      const friendshipQuery = await getDocs(
        query(
          collection(db, 'friends'),
          where('users', 'array-contains', user.uid),
        ),
      );

      let friendshipDocId = null;
      friendshipQuery.forEach((doc) => {
        const data = doc.data();
        if (data.users.includes(friend.id)) {
          friendshipDocId = doc.id;
        }
      });

      if (friendshipDocId) {
        await deleteDoc(doc(db, 'friends', friendshipDocId));
        Alert.alert('Success', 'Friend removed');

        await analytics().logEvent('remove_friend', {
          userId: user.uid,
          removedUserId: friend.id,
          removedUserEmail: friend.email,
        });
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      Alert.alert('Error', 'Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Friends</Text>

      {/* Add friend section */}
      <View style={styles.addFriendContainer}>
        <Text style={styles.sectionTitle}>Add Friend</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter friend's email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={sendFriendRequest}
          disabled={loading}
        >
          <Text style={styles.buttonText}>Send Request</Text>
        </TouchableOpacity>
      </View>

      {/* Pending friend requests section */}
      {pendingRequests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Requests</Text>
          <FlatList
            data={pendingRequests}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.requestItem}>
                <Text style={styles.friendEmail}>{item.senderEmail}</Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => acceptFriendRequest(item)}
                  >
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => rejectFriendRequest(item)}
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={20}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* Friends list section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Friends</Text>
        {friends.length === 0 ? (
          <Text style={styles.emptyText}>
            No friends yet. Add some friends!
          </Text>
        ) : (
          <FlatList
            data={friends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.friendItem}>
                <View style={styles.friendInfo}>
                  <Text style={styles.friendEmail}>{item.email}</Text>
                  <View style={styles.streakContainer}>
                    <MaterialCommunityIcons
                      name="fire"
                      size={20}
                      color={COLORS.accent}
                    />
                    <Text style={styles.streakText}>{item.streak}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    Alert.alert(
                      'Remove Friend',
                      `Are you sure you want to remove ${item.email}?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Remove',
                          onPress: () => removeFriend(item),
                        },
                      ],
                    );
                  }}
                >
                  <MaterialCommunityIcons
                    name="account-remove"
                    size={24}
                    color={COLORS.error}
                  />
                </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  addFriendContainer: {
    backgroundColor: COLORS.lightBackground,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#ffffff20',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
    color: COLORS.text,
  },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.background,
    fontWeight: 'bold',
  },
  friendItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  friendInfo: {
    flex: 1,
  },
  friendEmail: {
    color: COLORS.text,
    fontSize: 16,
    marginBottom: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    color: COLORS.accent,
    fontSize: 16,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 6,
  },
  requestItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#27ae60',
  },
  rejectButton: {
    backgroundColor: COLORS.error,
  },
  emptyText: {
    color: COLORS.text,
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  text: {
    padding: 5,
    color: COLORS.text,
  },
});
