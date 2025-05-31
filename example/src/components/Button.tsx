import { Pressable, Text, StyleSheet, useColorScheme } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
}

const Button = ({ title, onPress }: ButtonProps) => {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        isDarkMode && styles.buttonDark,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.text, isDarkMode && styles.textDark]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderColor: 'black',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDark: {
    borderColor: 'white',
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  text: {
    color: 'black',
    fontSize: 16,
    fontWeight: '500',
  },
  textDark: {
    color: 'white',
  },
});

export default Button;
