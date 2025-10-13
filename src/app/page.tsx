// src/app/page.tsx
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Sistema de Abastecimiento',
};

export default function Root() {
  // Mantén la raíz limpia: manda al home del panel web
  redirect('/home');
}
