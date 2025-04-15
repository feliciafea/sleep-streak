import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { router, useLocalSearchParams } from 'expo-router';

export default function SettingsScreen() {
  const params = useLocalSearchParams();
  const userId = params.userId as string;

  const handleBack = () => {
    router.push({
      pathname: '/(tabs)',
    });
  };

  const settingsOptions = [
    {
      title: 'Tracking Options',
      icon: 'sensors',
      onPress: () => router.push({
        pathname: '/trackingOpt',
        params: { userId }
      })
    },
    {
      title: 'Notifications',
      icon: 'notifications',
      onPress: () => router.push({
        pathname: '/notifications',
        params: { userId }
      })
    },
  ];

  interface SettingsItemProps {
    title: string;
    icon: string;
    onPress: () => void;
  }

  const renderSettingsItem = ({ title, icon, onPress }: SettingsItemProps) => (
    <TouchableOpacity 
      key={title}
      style={styles.settingItem} 
      onPress={onPress}
    >
      <View style={styles.settingContent}>
        <MaterialIcons name={icon} size={24} color={COLORS.icon} />
        <Text style={styles.settingText}>{title}</Text>
      </View>
      <MaterialIcons name="chevron-right" size={24} color={COLORS.icon} />
    </TouchableOpacity>
  );
   
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={handleBack}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.icon} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <View style={styles.settingsList}>
        {settingsOptions.map(renderSettingsItem)}
      </View>
      

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: COLORS.background,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  switchText: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '500',
    paddingRight: 8,
  },
  switchTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.accent,
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: 'bold',
    color: COLORS.text,
    marginLeft: 20,
  },
  backButton: {
    padding: 8,
  },
  settingsList: {
    width: '100%',
    marginTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.tabBar,
    width: '100%',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 16,
  },
});
