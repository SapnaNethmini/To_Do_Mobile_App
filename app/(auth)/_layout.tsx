import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
  const { status } = useAuth();
  if (status === 'authenticated') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
