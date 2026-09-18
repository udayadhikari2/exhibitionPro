// Automated validation test script for Phase 4 - Evaluator Management & Dynamic Criteria
const BASE_URL = 'http://localhost:3000';

let adminCookie = '';
let evaluatorCookie = '';

async function run() {
  console.log('================================================================');
  console.log('      PHASE 4 — EVALUATOR & DYNAMIC CRITERIA TEST SUITE         ');
  console.log('================================================================');

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

  try {
    // 1. Authenticate as SUPER_ADMIN
    console.log('\n[1] Authenticating as SUPER_ADMIN (admin@portal.edu)...');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@portal.edu', password: 'admin123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.ok && adminLoginData.user?.role === 'SUPER_ADMIN', 'Super Admin authenticated successfully');
    adminCookie = (adminLoginRes.headers.get('set-cookie') || '').split(';')[0];

    // 2. Create 2 Evaluators
    console.log('\n[2] Testing POST /api/evaluators (Creating Evaluator Accounts)...');
    const timestamp = Date.now().toString().slice(-4);
    const evalAEmail = `rachel.eval.${timestamp}@portal.edu`;
    const evalBEmail = `alan.eval.${timestamp}@portal.edu`;

    const createEvalARes = await fetch(`${BASE_URL}/api/evaluators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'Dr. Rachel Green',
        email: evalAEmail,
        phone: '+1 555-111-2222',
        institution: 'Robotics Department',
        password: 'evalinitial123',
      }),
    });
    const evalAData = await createEvalARes.json();
    assert(createEvalARes.status === 201 && evalAData.evaluator?._id, `Evaluator A created (${evalAEmail})`);
    const evaluatorA = evalAData.evaluator;

    const createEvalBRes = await fetch(`${BASE_URL}/api/evaluators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        name: 'Prof. Alan Turing',
        email: evalBEmail,
        phone: '+1 555-333-4444',
        institution: 'Computing & AI Institute',
        password: 'evalinitial123',
      }),
    });
    const evalBData = await createEvalBRes.json();
    assert(createEvalBRes.status === 201 && evalBData.evaluator?._id, `Evaluator B created (${evalBEmail})`);
    const evaluatorB = evalBData.evaluator;

    // 3. Edit Evaluator Profile
    console.log('\n[3] Testing PUT /api/evaluators/[id] (Editing Evaluator Details)...');
    const updateEvalRes = await fetch(`${BASE_URL}/api/evaluators/${evaluatorA._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        institution: 'Institute of Advanced Autonomous Robotics',
        phone: '+1 555-999-8888',
      }),
    });
    const updateEvalData = await updateEvalRes.json();
    assert(
      updateEvalRes.ok &&
        updateEvalData.evaluator?.institution === 'Institute of Advanced Autonomous Robotics',
      'Evaluator profile updated successfully'
    );

    // 4. Reset Evaluator Password & Verify Login
    console.log('\n[4] Testing POST /api/evaluators/[id]/reset-password...');
    const newPass = 'newsecurepass2026';
    const resetRes = await fetch(`${BASE_URL}/api/evaluators/${evaluatorA._id}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ password: newPass }),
    });
    const resetData = await resetRes.json();
    assert(resetRes.ok && resetData.success, 'Evaluator password reset successfully');

    // Test Evaluator logging in with new password
    const evalLoginRes = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: evalAEmail, password: newPass }),
    });
    const evalLoginData = await evalLoginRes.json();
    assert(
      evalLoginRes.ok && evalLoginData.user?.role === 'EVALUATOR',
      'Evaluator successfully authenticated with newly reset password'
    );
    evaluatorCookie = (evalLoginRes.headers.get('set-cookie') || '').split(';')[0];

    // 5. Toggle Evaluator Status (Deactivate and Reactivate)
    console.log('\n[5] Testing Evaluator Status Toggle (ACTIVE -> INACTIVE -> ACTIVE)...');
    const deactRes = await fetch(`${BASE_URL}/api/evaluators/${evaluatorA._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: 'INACTIVE' }),
    });
    const deactData = await deactRes.json();
    assert(deactData.evaluator?.status === 'INACTIVE', 'Evaluator status transitioned to INACTIVE');

    const reactRes = await fetch(`${BASE_URL}/api/evaluators/${evaluatorA._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });
    const reactData = await reactRes.json();
    assert(reactData.evaluator?.status === 'ACTIVE', 'Evaluator status reactivated to ACTIVE');

    // 6. Fetch Target Event & Categories
    console.log('\n[6] Querying active event and categories...');
    const eventsRes = await fetch(`${BASE_URL}/api/events`);
    const eventsData = await eventsRes.json();
    const event = eventsData.events[0];
    assert(event?._id, `Selected Event: "${event.name}" (${event._id})`);

    const catRes = await fetch(`${BASE_URL}/api/events/${event._id}/categories`);
    const catData = await catRes.json();
    const targetCategory = catData.categories?.[0];
    const targetCatId = targetCategory?._id || 'cat_test_01';
    console.log(`    Selected Category: "${targetCategory?.name || 'General'}" (${targetCatId})`);

    // 7. Create Dynamic Criteria: Event-Wide AND Category-Specific
    console.log('\n[7] Testing POST /api/criteria (Creating Event-Wide & Category-Specific Criteria)...');
    // Event-Wide Criterion
    const crit1Res = await fetch(`${BASE_URL}/api/criteria`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        eventId: event._id,
        categoryId: null, // Event-wide
        name: 'Concept Originality & Scientific Depth',
        description: 'Evaluates uniqueness of the hypothesis and experimental design.',
        maxMarks: 25,
        minMarks: 0,
        weight: 1,
        order: 1,
        required: true,
      }),
    });
    const crit1Data = await crit1Res.json();
    assert(crit1Res.status === 201 && crit1Data.criterion?._id, 'Event-Wide criterion created (25 marks)');
    const criterion1 = crit1Data.criterion;

    // Category-Specific Criterion
    const crit2Res = await fetch(`${BASE_URL}/api/criteria`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        eventId: event._id,
        categoryId: targetCatId, // Category specific
        name: 'Discipline-Specific Technical Rigor',
        description: 'Evaluates specialized code, circuitry, or artistic technique.',
        maxMarks: 25,
        minMarks: 0,
        weight: 1,
        order: 2,
        required: true,
      }),
    });
    const crit2Data = await crit2Res.json();
    assert(crit2Res.status === 201 && crit2Data.criterion?._id, 'Category-Specific criterion created (25 marks)');
    const criterion2 = crit2Data.criterion;

    // 8. Verify Criteria Query & Live Total Max Marks Calculation
    console.log('\n[8] Testing GET /api/criteria (Validating Total Max Marks Calculation)...');
    const queryCritRes = await fetch(
      `${BASE_URL}/api/criteria?eventId=${event._id}&categoryId=${targetCatId}`
    );
    const queryCritData = await queryCritRes.json();
    assert(queryCritRes.ok, 'Criteria query returned HTTP 200');
    assert(queryCritData.totalMaxMarks >= 50, `Total maximum marks calculated: ${queryCritData.totalMaxMarks}`);
    assert(queryCritData.eventWideCount >= 1, `Event-wide criteria identified: ${queryCritData.eventWideCount}`);
    assert(
      queryCritData.categorySpecificCount >= 1,
      `Category-specific criteria identified: ${queryCritData.categorySpecificCount}`
    );

    // 9. Test Reordering Criteria
    console.log('\n[9] Testing POST /api/criteria/reorder...');
    const reorderRes = await fetch(`${BASE_URL}/api/criteria/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        eventId: event._id,
        orderedIds: [criterion2._id, criterion1._id],
      }),
    });
    const reorderData = await reorderRes.json();
    assert(reorderRes.ok && reorderData.success, 'Criteria reordered successfully');

    // 10. Fetch Registered Teams for Assignments
    console.log('\n[10] Fetching registered teams for assignment testing...');
    const teamsRes = await fetch(`${BASE_URL}/api/teams?eventId=${event._id}`);
    const teamsData = await teamsRes.json();
    let testTeams = teamsData.teams || [];

    // If fewer than 2 teams exist, register placeholder teams for assignment test
    if (testTeams.length < 2) {
      console.log('    Registering supplementary test teams for assignment matrix...');
      const t1Res = await fetch(`${BASE_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          eventId: event._id,
          categoryId: targetCatId,
          teamName: `Alpha Pioneers ${timestamp}`,
          school: 'Academy of Sciences',
          members: [{ name: 'Cadet One', role: 'Leader' }],
          project: { title: 'Autonomous Soil Sensor Grid', shortDescription: 'IoT telemetry' },
          status: 'APPROVED',
        }),
      });
      const t1Data = await t1Res.json();
      testTeams.push(t1Data.team);

      const t2Res = await fetch(`${BASE_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          eventId: event._id,
          categoryId: targetCatId,
          teamName: `Beta Explorers ${timestamp}`,
          school: 'Polytechnic High',
          members: [{ name: 'Cadet Two', role: 'Leader' }],
          project: { title: 'Solar Tracking Concentrator', shortDescription: 'Clean energy' },
          status: 'APPROVED',
        }),
      });
      const t2Data = await t2Res.json();
      testTeams.push(t2Data.team);
    }

    const team1 = testTeams[0];
    const team2 = testTeams[1];
    console.log(`    Team 1: "${team1.teamName}" (${team1.teamCode || team1._id})`);
    console.log(`    Team 2: "${team2.teamName}" (${team2.teamCode || team2._id})`);

    // 11. Test Assignment: 1 Evaluator -> Many Projects
    console.log('\n[11] Testing POST /api/assignments (1 Evaluator -> Many Projects)...');
    const batchRes = await fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        eventId: event._id,
        evaluatorId: evaluatorA._id,
        teamIds: [team1._id, team2._id],
      }),
    });
    const batchData = await batchRes.json();
    assert(batchRes.status === 201, '1 Evaluator assigned to multiple projects');

    // 12. Test Assignment: 1 Project -> Multiple Evaluators
    console.log('\n[12] Testing POST /api/assignments (1 Project -> Multiple Evaluators)...');
    const multiJudgeRes = await fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        eventId: event._id,
        teamId: team1._id,
        evaluatorId: evaluatorB._id, // Assign second judge to Team 1
      }),
    });
    assert(multiJudgeRes.status === 201, 'Second judge assigned to Team 1');

    // 13. Verify Assignments List & Structure
    console.log('\n[13] Testing GET /api/assignments (Validating Matrix Integrity)...');
    const verifyAsgRes = await fetch(`${BASE_URL}/api/assignments?eventId=${event._id}&teamId=${team1._id}`);
    const verifyAsgData = await verifyAsgRes.json();
    assert(verifyAsgRes.ok, 'Assignments query returned HTTP 200');
    assert(verifyAsgData.assignments?.length >= 2, `Team 1 has ${verifyAsgData.assignments?.length} independent evaluators assigned`);

    const judge1HasBothRes = await fetch(`${BASE_URL}/api/assignments?eventId=${event._id}&evaluatorId=${evaluatorA._id}`);
    const judge1Data = await judge1HasBothRes.json();
    assert(judge1Data.assignments?.length >= 2, `Evaluator A has ${judge1Data.assignments?.length} projects assigned`);

    // 14. Test Security: Evaluator Cannot Access Admin Endpoints
    console.log('\n[14] Testing Security: Evaluator role blocked from admin endpoints...');
    const rogueEvalRes = await fetch(`${BASE_URL}/api/evaluators`, {
      headers: { Cookie: evaluatorCookie },
    });
    assert(
      rogueEvalRes.status === 403,
      `Evaluator blocked from GET /api/evaluators with HTTP 403 (Received ${rogueEvalRes.status})`
    );

    const rogueCritRes = await fetch(`${BASE_URL}/api/criteria`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: evaluatorCookie,
      },
      body: JSON.stringify({ eventId: event._id, name: 'Hacked' }),
    });
    assert(
      rogueCritRes.status === 403,
      `Evaluator blocked from POST /api/criteria with HTTP 403 (Received ${rogueCritRes.status})`
    );

    const rogueAsgRes = await fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: evaluatorCookie,
      },
      body: JSON.stringify({ eventId: event._id }),
    });
    assert(
      rogueAsgRes.status === 403,
      `Evaluator blocked from POST /api/assignments with HTTP 403 (Received ${rogueAsgRes.status})`
    );

    console.log('\n================================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Unexpected test error:', err);
    process.exit(1);
  }
}

run();
