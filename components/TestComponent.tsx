import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * 简单测试组件 - 用于诊断React渲染问题
 */
export default function TestComponent() {
  console.log('TestComponent rendered');

  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ React正在工作!</Text>
      <Text style={styles.subtext}>如果看到这段文字，说明渲染正常</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
  },
});
