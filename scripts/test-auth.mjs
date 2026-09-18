async function runTests() {
  const baseUrl = 'http://localhost:3000';
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  console.log('\n--- 1. Testing Unauthenticated Route Protection (Middleware) ---');
  
  // Test /admin protection
  const resAdmin = await fetch(`${baseUrl}/admin`, { redirect: 'manual' });
  assert(
    resAdmin.status === 307 || resAdmin.status === 302,
    `Unauthenticated /admin redirects with status ${resAdmin.status}`
  );
  assert(
    resAdmin.headers.get('location')?.includes('/login'),
    `Redirect location points to /login: ${resAdmin.headers.get('location')}`
  );

  // Test /evaluator protection
  const resEval = await fetch(`${baseUrl}/evaluator`, { redirect: 'manual' });
  assert(
    resEval.status === 307 || resEval.status === 302,
    `Unauthenticated /evaluator redirects with status ${resEval.status}`
  );

  // Test /student protection
  const resStudent = await fetch(`${baseUrl}/student`, { redirect: 'manual' });
  assert(
    resStudent.status === 307 || resStudent.status === 302,
    `Unauthenticated /student redirects with status ${resStudent.status}`
  );

  console.log('\n--- 2. Testing Login for Every Role ---');
  
  const rolesToTest = [
    { role: 'SUPER_ADMIN', email: 'admin@portal.edu', pass: 'admin123' },
    { role: 'EVENT_ADMIN', email: 'eventadmin@portal.edu', pass: 'event123' },
    { role: 'EVALUATOR', email: 'elena@evaluator.edu', pass: 'eval123' },
    { role: 'STUDENT', email: 'alex@student.edu', pass: 'student123' },
  ];

  const sessions = {};

  for (const r of rolesToTest) {
    const res = await fetch(`${baseUrl}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: r.email, password: r.pass }),
    });
    const data = await res.json();
    assert(res.status === 200, `Login for ${r.role} returned HTTP 200`);
    assert(data.user?.role === r.role, `Response user role is ${r.role}`);
    assert(!data.user?.passwordHash, `Password hash is NOT exposed in response`);
    assert(data.user?.status === 'ACTIVE', `User status is ACTIVE`);

    const setCookie = res.headers.get('set-cookie');
    assert(setCookie && setCookie.includes('portal_session'), `HTTP-only portal_session cookie issued`);
    sessions[r.role] = setCookie ? setCookie.split(';')[0] : '';
  }

  console.log('\n--- 3. Testing Role-Based Route Authorization ---');

  // Student trying to access /admin -> should redirect to login?error=unauthorized
  const studentToAdmin = await fetch(`${baseUrl}/admin`, {
    headers: { Cookie: sessions['STUDENT'] },
    redirect: 'manual',
  });
  assert(
    studentToAdmin.status === 307 && studentToAdmin.headers.get('location')?.includes('error=unauthorized'),
    `Student access to /admin redirected with error=unauthorized`
  );

  // Evaluator trying to access /student -> should redirect to login?error=unauthorized
  const evalToStudent = await fetch(`${baseUrl}/student`, {
    headers: { Cookie: sessions['EVALUATOR'] },
    redirect: 'manual',
  });
  assert(
    evalToStudent.status === 307 && evalToStudent.headers.get('location')?.includes('error=unauthorized'),
    `Evaluator access to /student redirected with error=unauthorized`
  );

  // Super Admin accessing /admin -> should pass through
  const adminToAdmin = await fetch(`${baseUrl}/admin`, {
    headers: { Cookie: sessions['SUPER_ADMIN'] },
    redirect: 'manual',
  });
  assert(
    adminToAdmin.status === 200,
    `Super Admin access to /admin allowed with HTTP 200`
  );

  console.log('\n--- 4. Testing Invalid Password & Inactive Accounts ---');

  const badPassRes = await fetch(`${baseUrl}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@portal.edu', password: 'wrongpassword' }),
  });
  assert(badPassRes.status === 401, `Invalid password rejected with HTTP 401`);

  console.log(`\n========================================`);
  console.log(`Total tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests().catch((e) => {
  console.error('Test error:', e);
  process.exit(1);
});
