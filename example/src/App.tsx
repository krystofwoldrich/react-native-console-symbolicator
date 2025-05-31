import {
  View,
  StyleSheet,
  useColorScheme,
  FlatList,
  SafeAreaView,
  Text,
} from 'react-native';
import { installConsoleSymbolicator } from 'react-native-console-symbolicator';
import Button from './components/Button';

installConsoleSymbolicator({
  excludeReactNativeCoreFrames: true,
});

const message =
  'When reading this error in React Native Dev Tools, you should see the original source code location instead of the bundle.';

export default function App() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode && styles.containerDark]}
    >
      <View style={styles.header}>
        <Text style={[styles.headerText, isDarkMode && styles.headerTextDark]}>
          Console Examples
        </Text>
      </View>
      <FlatList
        data={[
          {
            title: 'Throw error',
            action: () => {
              throw new Error(message);
            },
          },
          {
            title: 'Rejected promise',
            action: () => {
              Promise.reject(new Error(message));
            },
          },
          {
            title: 'console.error',
            action: () => console.error(new Error(message)),
          },
          {
            title: 'console.warn',
            action: () => console.warn(new Error(message)),
          },
          {
            title: 'console.log',
            action: () => console.log(new Error(message)),
          },
          {
            title: 'console.info',
            action: () => console.info(new Error(message)),
          },
          {
            title: 'console.debug',
            action: () => console.debug(new Error(message)),
          },
          {
            title: 'console.assert',
            action: () =>
              console.assert(
                false,
                'For the example purpose this is always `false`.'
              ),
          },
        ]}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <Button title={item.title} onPress={item.action} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ width: '100%', padding: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  containerDark: {
    backgroundColor: 'black',
  },
  header: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  headerTextDark: {
    color: '#f0f0f0',
  },
});
