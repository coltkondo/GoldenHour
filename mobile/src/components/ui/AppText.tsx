// Drop-in replacements for react-native's <Text> and <TextInput> that apply
// the app fonts (see theme/fonts.ts). Import these instead of the RN versions:
//
//   import { Text, TextInput } from '../components/ui/AppText';
//
// Same props, same refs; the only difference is the fontFamily resolution.

import React, { createContext, forwardRef, useContext } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type TextInputProps,
  type TextProps,
} from 'react-native';
import { resolveFont } from '../../theme/fonts';

// True for children of an AppText, so nested spans inherit the parent's font
// unless they set their own weight/family.
const InsideTextContext = createContext(false);

export const Text = forwardRef<RNText, TextProps>(function AppText({ style, ...rest }, ref) {
  const insideText = useContext(InsideTextContext);
  const flat = StyleSheet.flatten(style);
  const font = resolveFont(flat, insideText);
  return (
    <InsideTextContext.Provider value>
      <RNText ref={ref} {...rest} style={[flat, font]} />
    </InsideTextContext.Provider>
  );
});

export const TextInput = forwardRef<RNTextInput, TextInputProps>(function AppTextInput(
  { style, ...rest },
  ref,
) {
  const flat = StyleSheet.flatten(style);
  return <RNTextInput ref={ref} {...rest} style={[flat, resolveFont(flat)]} />;
});
