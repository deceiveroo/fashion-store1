// Этот файл используется для проверки целостности админ-панели
// Он просто перенаправляет на главную страницу админки

import { redirect } from 'next/navigation';

export default function CheckPage() {
  redirect('/admin');
}