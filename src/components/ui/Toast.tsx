import ToastLib, { type ToastShowParams } from 'react-native-toast-message';

export function ToastMount() {
  return <ToastLib />;
}

export function showToast(params: ToastShowParams) {
  ToastLib.show(params);
}

export function showError(message: string) {
  ToastLib.show({ type: 'error', text1: message });
}

export function showSuccess(message: string) {
  ToastLib.show({ type: 'success', text1: message, visibilityTime: 1500 });
}
