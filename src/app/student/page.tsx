'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentPageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/dashboard');
  }, [router]);

  return (
    <div className="p-12 text-center text-xs text-slate-500 font-semibold">
      Loading Student Workspace...
    </div>
  );
}
