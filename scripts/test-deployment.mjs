// Comprehensive Deployment Verification Script
import http from 'http';

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || 'GET',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          // not json
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data,
          json,
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=====================================================');
  console.log('🚀 TESTING DEPLOYMENT READINESS & ADMIN CREDENTIALS');
  console.log('=====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Test Login with exact requested credentials
    console.log('1. Testing Super Admin Authentication with Requested Credentials:');
    const loginRes = await makeRequest('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      email: 'admin.exhibition.com',
      password: 'exhibition@123',
    });

    assert(loginRes.status === 200, `Login status is 200 (received: ${loginRes.status})`);
    assert(loginRes.json?.success === true, 'Auth returned success: true');
    assert(loginRes.json?.user?.role === 'SUPER_ADMIN', `User role is SUPER_ADMIN (received: ${loginRes.json?.user?.role})`);
    assert(loginRes.json?.user?.email === 'admin.exhibition.com', `User identifier is admin.exhibition.com (received: ${loginRes.json?.user?.email})`);

    const cookieHeader = loginRes.headers['set-cookie'];
    const sessionCookie = Array.isArray(cookieHeader)
      ? cookieHeader.map((c) => c.split(';')[0]).join('; ')
      : cookieHeader ? cookieHeader.split(';')[0] : '';
    assert(sessionCookie.includes('portal_session='), 'Valid encrypted session cookie issued');

    // 2. Test Alias support (admin@exhibition.com)
    console.log('\n2. Testing Admin Alias (admin@exhibition.com):');
    const aliasRes = await makeRequest('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      email: 'admin@exhibition.com',
      password: 'exhibition@123',
    });
    assert(aliasRes.status === 200, 'Alias login status is 200');
    assert(aliasRes.json?.user?.role === 'SUPER_ADMIN', 'Alias returns SUPER_ADMIN role');

    // 3. Test Invalid Password Rejection
    console.log('\n3. Testing Security & Password Verification:');
    const badLogin = await makeRequest('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, {
      email: 'admin.exhibition.com',
      password: 'wrong_password_999',
    });
    assert(badLogin.status === 401, `Invalid password returns 401 (received: ${badLogin.status})`);

    // 4. Test Reports & Analytics API with Session
    console.log('\n4. Testing Phase 8 Executive Reports API:');
    const reportsRes = await makeRequest('/api/admin/reports', {
      headers: { Cookie: sessionCookie },
    });
    assert(reportsRes.status === 200, `Reports API status is 200 (received: ${reportsRes.status})`);
    assert(reportsRes.json?.summary?.totalTeams > 0, `Total teams reported: ${reportsRes.json?.summary?.totalTeams}`);
    assert(reportsRes.json?.summary?.evaluationCoverageRate !== undefined, `Evaluation coverage reported: ${reportsRes.json?.summary?.evaluationCoverageRate}%`);
    assert(Array.isArray(reportsRes.json?.categoriesBreakdown), 'Categories breakdown array returned');
    assert(Array.isArray(reportsRes.json?.institutionalTally), 'Institutional standings returned');

    // 5. Test CSV Export Endpoints
    console.log('\n5. Testing CSV Export Endpoints:');
    const csvResults = await makeRequest('/api/admin/reports/export?type=results', {
      headers: { Cookie: sessionCookie },
    });
    assert(csvResults.status === 200, 'Results CSV export status is 200');
    assert(csvResults.headers['content-type']?.includes('text/csv'), 'Results CSV Content-Type header present');
    assert(csvResults.data.includes('Rank,Team Code,Project Title'), 'Results CSV contains header row');

    const csvTeams = await makeRequest('/api/admin/reports/export?type=teams', {
      headers: { Cookie: sessionCookie },
    });
    assert(csvTeams.status === 200, 'Teams CSV export status is 200');
    assert(csvTeams.data.includes('Team Code,Project Title,Category'), 'Teams CSV contains header row');

    const csvEvals = await makeRequest('/api/admin/reports/export?type=evaluations', {
      headers: { Cookie: sessionCookie },
    });
    assert(csvEvals.status === 200, 'Evaluations CSV export status is 200');
    assert(csvEvals.data.includes('Evaluation ID,Team Code,Evaluator ID'), 'Evaluations CSV contains header row');

    // 6. Test Unauthenticated Access to Protected Reports
    console.log('\n6. Testing Route Protection:');
    const unauthReports = await makeRequest('/api/admin/reports');
    assert(unauthReports.status === 403 || unauthReports.status === 401, `Unauthenticated request blocked with code ${unauthReports.status}`);

    console.log('\n=====================================================');
    console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log('=====================================================');

    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('🎉 ALL DEPLOYMENT CHECKS PASSED SUCCESSFULLY!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test execution error:', err);
    process.exit(1);
  }
}

runTests();
