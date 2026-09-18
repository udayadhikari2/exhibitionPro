'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewEventRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/events/create');
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-slate-500 font-semibold">
      Redirecting to Event Creator...
    </div>
  );
}
