import { redirect } from 'next/navigation';

export default function RegisterRedirectPage() {
  redirect('/student/teams/create');
}
