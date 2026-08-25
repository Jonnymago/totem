import React from 'react';
import { Alert, Text as NativeText, TextInput as NativeTextInput, TextProps, TextInputProps } from 'react-native';
import { translateSourceText, useI18n } from '@/src/utils/i18n';

function translateChild(child: React.ReactNode): React.ReactNode {
  if (typeof child === 'string') return translateSourceText(child);
  if (typeof child === 'number' || child == null) return child;
  if (Array.isArray(child)) return child.map(translateChild);
  return child;
}

/** A drop-in Text component that rerenders on language changes and translates literal UI labels. */
export function Text({ children, ...props }: TextProps) {
  useI18n();
  return <NativeText {...props}>{translateChild(children)}</NativeText>;
}

/** A drop-in TextInput component that localizes literal placeholders without changing user-entered values. */
export function TextInput({ placeholder, ...props }: TextInputProps) {
  useI18n();
  return <NativeTextInput {...props} placeholder={placeholder ? translateSourceText(placeholder) : placeholder} />;
}

let localizedAlertInstalled = false;

/** Localizes native alert captions and messages, including strings with runtime values. */
export function installLocalizedAlert(): void {
  if (localizedAlertInstalled) return;
  localizedAlertInstalled = true;
  const originalAlert = Alert.alert.bind(Alert);
  Alert.alert = ((title?: string, message?: string, buttons?: any[], options?: any) => {
    const localizedButtons = buttons?.map((button) => ({
      ...button,
      text: button?.text ? translateSourceText(button.text) : button?.text,
    }));
    return originalAlert(
      title ? translateSourceText(title) : '',
      message ? translateSourceText(message) : message,
      localizedButtons,
      options,
    );
  }) as typeof Alert.alert;
}
