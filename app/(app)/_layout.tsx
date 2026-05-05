import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AppLayout() {
  const { status } = useAuth();
  if (status === 'loading') return null; // splash stays visible
  if (status === 'unauthenticated') return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: true }} />;
}
