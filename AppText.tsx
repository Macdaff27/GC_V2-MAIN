import React, { forwardRef } from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

type AppTextProps = TextProps;

const AppText = forwardRef<Text, AppTextProps>(({ style, children, ...rest }, ref) => {
  return (
    <Text ref={ref} {...rest} style={[styles.text, style]}>
      {children}
    </Text>
  );
});

AppText.displayName = 'AppText';

const styles = StyleSheet.create({
  text: {
    fontFamily: 'monospace',
  },
});

export default AppText;
