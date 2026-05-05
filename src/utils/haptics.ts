import * as Haptics from 'expo-haptics';

export function hapticSuccess() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function hapticError() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
