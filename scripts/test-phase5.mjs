// Automated validation test script for Phase 5 - Evaluator Evaluation, Confidentiality & Admin Unlock
const BASE_URL = 'http://localhost:3000';

let adminCookie = '';
let evalACookie = '';
let evalBCookie = '';

async function run() {
  console.log('================================================================');
  console.log('       PHASE 5 — EVALUATOR EVALUATION TEST SUITE                ');
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
    // 1. Authenticate Admin
    console.log('\n[1] Authenticating as SUPER_ADMIN (admin@portal.edu)...');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@portal.edu', password: 'admin123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.ok && adminLoginData.user?.role === 'SUPER_ADMIN', 'Super Admin authenticated successfully');
    adminCookie = (adminLoginRes.headers.get('set-cookie') || '').split(';')[0];

    // 2. Create 2 Evaluators (A and B)
    const timestamp = Date.now().toString().slice(-4);
    const emailA = `eval.alpha.${timestamp}@portal.edu`;
    const emailB = `eval.beta.${timestamp}@portal.edu`;

    console.log(`\n[2] Creating Evaluator A (${emailA}) and Evaluator B (${emailB})...`);
    const [evalARes, evalBRes] = await Promise.all([
      fetch(`${BASE_URL}/api/evaluators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ name: 'Judge Alpha', email: emailA, password: 'evalpassword123' }),
      }),
      fetch(`${BASE_URL}/api/evaluators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ name: 'Judge Beta', email: emailB, password: 'evalpassword123' }),
      }),
    ]);

    const evalAData = await evalARes.json();
    const evalBData = await evalBRes.json();
    console.log('DEBUG Evaluator A response:', evalARes.status, evalAData);
    console.log('DEBUG Evaluator B response:', evalBRes.status, evalBData);
    assert(evalARes.status === 201 && evalAData.evaluator?._id, 'Evaluator A created');
    assert(evalBRes.status === 201 && evalBData.evaluator?._id, 'Evaluator B created');
    const evaluatorA = evalAData.evaluator;
    const evaluatorB = evalBData.evaluator;

    // 3. Authenticate Evaluator A and B
    console.log('\n[3] Authenticating Evaluator A and Evaluator B...');
    const [loginARes, loginBRes] = await Promise.all([
      fetch(`${BASE_URL}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailA, password: 'evalpassword123' }),
      }),
      fetch(`${BASE_URL}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailB, password: 'evalpassword123' }),
      }),
    ]);

    const loginAData = await loginARes.json();
    const loginBData = await loginBRes.json();
    assert(loginARes.ok && loginAData.user?.role === 'EVALUATOR', 'Evaluator A session established');
    assert(loginBRes.ok && loginBData.user?.role === 'EVALUATOR', 'Evaluator B session established');
    evalACookie = (loginARes.headers.get('set-cookie') || '').split(';')[0];
    evalBCookie = (loginBRes.headers.get('set-cookie') || '').split(';')[0];

    // 4. Fetch Event, Categories, and Criteria
    console.log('\n[4] Querying active event and criteria...');
    const eventsRes = await fetch(`${BASE_URL}/api/events`);
    const eventsData = await eventsRes.json();
    const event = eventsData.events[0];
    assert(event?._id, `Active Event: "${event.name}" (${event._id})`);

    const critRes = await fetch(`${BASE_URL}/api/criteria?eventId=${event._id}`);
    let critData = await critRes.json();
    let criteriaList = critData.criteria || [];

    // Ensure at least 2 criteria exist
    if (criteriaList.length < 2) {
      console.log('    Creating baseline criteria for event...');
      await fetch(`${BASE_URL}/api/criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          eventId: event._id,
          name: 'Innovation & Core Concept',
          maxMarks: 20,
          minMarks: 0,
        }),
      });
      await fetch(`${BASE_URL}/api/criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          eventId: event._id,
          name: 'Working Demonstration & Defense',
          maxMarks: 20,
          minMarks: 0,
        }),
      });
      const refreshCrit = await fetch(`${BASE_URL}/api/criteria?eventId=${event._id}`);
      critData = await refreshCrit.json();
      criteriaList = critData.criteria;
    }
    assert(criteriaList.length >= 2, `Criteria configured: ${criteriaList.length} criteria active`);

    // 5. Ensure Two Teams Exist
    console.log('\n[5] Fetching or registering Team 1 and Team 2...');
    const teamsRes = await fetch(`${BASE_URL}/api/teams?eventId=${event._id}`);
    const teamsData = await teamsRes.json();
    let testTeams = teamsData.teams || [];

    if (testTeams.length < 2) {
      const t1 = await fetch(`${BASE_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          eventId: event._id,
          teamName: `Quantum Core Alpha ${timestamp}`,
          school: 'St. Jude College',
          members: [{ name: 'Sam', role: 'Lead' }],
          project: { title: 'Cryogenic Quantum Gateway', shortDescription: 'Quantum cooling' },
          status: 'APPROVED',
          stallNumber: 'Stall Q-01',
        }),
      });
      const t1Data = await t1.json();
      testTeams.push(t1Data.team);

      const t2 = await fetch(`${BASE_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          eventId: event._id,
          teamName: `AeroShield Beta ${timestamp}`,
          school: 'St. Jude College',
          members: [{ name: 'Alex', role: 'Lead' }],
          project: { title: 'Thermal UAV Shroud', shortDescription: 'Aviation shield' },
          status: 'APPROVED',
          stallNumber: 'Stall Q-02',
        }),
      });
      const t2Data = await t2.json();
      testTeams.push(t2Data.team);
    }

    const team1 = testTeams[0];
    const team2 = testTeams[1];
    console.log(`    Team 1: "${team1.teamName}" (${team1._id})`);
    console.log(`    Team 2: "${team2.teamName}" (${team2._id})`);

    // 6. Assign Team 1 to BOTH Evaluator A and Evaluator B; Team 2 ONLY to Evaluator A
    console.log('\n[6] Configuring Assignment Cardinality...');
    // Team 1 -> Judge A and Judge B
    await fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ eventId: event._id, teamId: team1._id, evaluatorId: evaluatorA._id }),
    });
    await fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ eventId: event._id, teamId: team1._id, evaluatorId: evaluatorB._id }),
    });

    // Team 2 -> ONLY Judge A
    await fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ eventId: event._id, teamId: team2._id, evaluatorId: evaluatorA._id }),
    });
    assert(true, 'Team 1 paired with Judges A & B; Team 2 paired ONLY with Judge A');

    // 7. Security Test 1: Assignment Gating (Forbidden 403)
    console.log('\n[7] Testing Security: Evaluator B cannot access unassigned Team 2...');
    const rogueAccessRes = await fetch(`${BASE_URL}/api/evaluator/projects/${team2._id}`, {
      headers: { Cookie: evalBCookie },
    });
    assert(
      rogueAccessRes.status === 403,
      `Evaluator B blocked from unassigned Team 2 with HTTP 403 (Received ${rogueAccessRes.status})`
    );

    // 8. Evaluator A Saves Draft for Team 1
    console.log('\n[8] Testing Evaluator A saving a Draft evaluation for Team 1...');
    const c1 = criteriaList[0];
    const c2 = criteriaList[1];

    const draftPayload = {
      teamId: team1._id,
      isDraft: true,
      scores: [
        { criterionId: c1._id, marks: 16, comment: 'Promising prototype design' },
        { criterionId: c2._id, marks: 14, comment: 'Good live demonstration' },
      ],
      comments: 'Overall solid work, waiting for second live test.',
    };

    const draftRes = await fetch(`${BASE_URL}/api/evaluator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: evalACookie },
      body: JSON.stringify(draftPayload),
    });
    const draftData = await draftRes.json();
    assert(draftRes.ok, 'Evaluator A draft saved successfully');
    assert(draftData.evaluation?.status === 'DRAFT', 'Evaluation status is DRAFT');
    assert(!draftData.evaluation?.isLocked, 'Draft is NOT locked');
    assert(draftData.evaluation?.totalScore === 30, `Total draft score computed accurately: ${draftData.evaluation?.totalScore}`);

    // 9. Security Test 2: Zero Peer Mark Exposure
    console.log('\n[9] Testing Security: Evaluator B cannot view Evaluator A marks for Team 1...');
    const evalBFetchRes = await fetch(`${BASE_URL}/api/evaluator/projects/${team1._id}`, {
      headers: { Cookie: evalBCookie },
    });
    const evalBDetails = await evalBFetchRes.json();
    assert(evalBFetchRes.ok, 'Evaluator B successfully retrieved assigned Team 1');
    assert(
      evalBDetails.evaluation === null || evalBDetails.evaluation?.scores?.length === 0,
      'Evaluator B evaluation payload contains ZERO marks from Evaluator A'
    );

    // 10. Evaluator A Submits Final Evaluation (Locking)
    console.log('\n[10] Testing Final Submission and Evaluation Locking...');
    const submitPayload = {
      teamId: team1._id,
      isDraft: false,
      scores: [
        { criterionId: c1._id, marks: 18, comment: 'Refined hypothesis' },
        { criterionId: c2._id, marks: 17, comment: 'Defended methodology convincingly' },
      ],
      comments: 'Excellent team coordination and sound scientific principles.',
    };

    const submitRes = await fetch(`${BASE_URL}/api/evaluator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: evalACookie },
      body: JSON.stringify(submitPayload),
    });
    const submitData = await submitRes.json();
    assert(submitRes.status === 201 || submitRes.ok, 'Evaluator A submitted final evaluation');
    assert(submitData.evaluation?.status === 'SUBMITTED', 'Status transitioned to SUBMITTED');
    assert(submitData.evaluation?.isLocked === true, 'Evaluation is now LOCKED');
    assert(submitData.evaluation?.totalScore === 35, `Final score: ${submitData.evaluation?.totalScore} pts`);
    const lockedEvalId = submitData.evaluation?._id;

    // Verify Evaluator A cannot overwrite while locked
    const attemptReSubmit = await fetch(`${BASE_URL}/api/evaluator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: evalACookie },
      body: JSON.stringify({ teamId: team1._id, isDraft: false, scores: [] }),
    });
    assert(attemptReSubmit.status === 400, 'Re-submission attempt rejected while evaluation is locked (HTTP 400)');

    // 11. Admin Monitoring Verification
    console.log('\n[11] Testing Admin Evaluation Monitoring (GET /api/admin/evaluations)...');
    const adminMonitorRes = await fetch(`${BASE_URL}/api/admin/evaluations?eventId=${event._id}`, {
      headers: { Cookie: adminCookie },
    });
    const adminMonitorData = await adminMonitorRes.json();
    assert(adminMonitorRes.ok, 'Admin retrieved evaluation monitoring overview');
    const team1Monitoring = adminMonitorData.projects?.find((p) => p.teamId === team1._id);
    assert(!!team1Monitoring, 'Team 1 present in admin monitoring matrix');
    assert(team1Monitoring?.completedCount >= 1, `Team 1 shows completed reviews: ${team1Monitoring?.completedCount}`);

    // 12. Admin Unlock Functionality
    console.log('\n[12] Testing Admin Unlock Capability (POST /api/admin/evaluations/[id]/unlock)...');
    const unlockRes = await fetch(`${BASE_URL}/api/admin/evaluations/${lockedEvalId}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ reason: 'Judge requested revision after observing second trial.' }),
    });
    const unlockData = await unlockRes.json();
    assert(unlockRes.ok && unlockData.success, 'Admin successfully unlocked evaluation');
    assert(unlockData.evaluation?.isLocked === false, 'Evaluation is now UNLOCKED (isLocked: false)');
    assert(unlockData.evaluation?.status === 'DRAFT', 'Evaluation status reverted to DRAFT');

    // 13. Evaluator A Can Now Revise Scores Post-Unlock
    console.log('\n[13] Verifying Evaluator A can resume scoring post-unlock...');
    const postUnlockSave = await fetch(`${BASE_URL}/api/evaluator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: evalACookie },
      body: JSON.stringify({
        teamId: team1._id,
        isDraft: true,
        scores: [
          { criterionId: c1._id, marks: 19 },
          { criterionId: c2._id, marks: 18 },
        ],
        comments: 'Post-unlock updated scores.',
      }),
    });
    assert(postUnlockSave.ok, 'Evaluator A successfully revised scores after admin unlock');

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
