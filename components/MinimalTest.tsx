import { View, Text, StyleSheet } from 'react-native';

export default function MinimalTest() {
  console.log('MinimalTest rendered!');

  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎉 最小测试组件</Text>
      <Text style={styles.subtext}>如果你看到这个，React可以渲染</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 20,
  },
  text: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
});
