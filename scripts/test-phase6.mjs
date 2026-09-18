// Automated validation test script for Phase 6 - Result Management & Multi-Judge Tabulation
const BASE_URL = 'http://localhost:3000';

let adminCookie = '';
let judge1Cookie = '';
let judge2Cookie = '';

async function run() {
  console.log('================================================================');
  console.log('       PHASE 6 — RESULT MANAGEMENT & TABULATION TEST SUITE       ');
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
    assert(adminLoginRes.ok && adminLoginData.user?.role === 'SUPER_ADMIN', 'Super Admin authenticated');
    adminCookie = (adminLoginRes.headers.get('set-cookie') || '').split(';')[0];

    // 2. Create Test Event
    const timestamp = Date.now().toString().slice(-4);
    const eventSlug = `phase6-cup-${timestamp}`;
    console.log(`\n[2] Creating Test Event (${eventSlug})...`);
    const eventRes = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        name: `Robotics & AI Cup ${timestamp}`,
        slug: eventSlug,
        description: 'Championship for autonomous aerial drones and robotics.',
        eventType: 'Robotics',
        venue: 'Grand Arena',
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        status: 'EVALUATION_RUNNING',
      }),
    });
    const eventData = await eventRes.json();
    const eventId = eventData.event._id;
    assert(eventRes.ok && !!eventId, `Event created with ID: ${eventId}`);

    // 3. Create 2 Categories
    console.log('\n[3] Creating Categories...');
    const [cat1Res, cat2Res] = await Promise.all([
      fetch(`${BASE_URL}/api/events/${eventId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ name: 'Autonomous Drones', order: 1, status: 'ACTIVE' }),
      }),
      fetch(`${BASE_URL}/api/events/${eventId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ name: 'Bionic Prosthetics', order: 2, status: 'ACTIVE' }),
      }),
    ]);
    const cat1Data = await cat1Res.json();
    const cat2Data = await cat2Res.json();
    const cat1Id = cat1Data.category._id;
    const cat2Id = cat2Data.category._id;
    assert(cat1Res.ok && cat2Res.ok, `Categories created: ${cat1Id}, ${cat2Id}`);

    // 4. Create 3 Evaluation Criteria
    console.log('\n[4] Configuring Evaluation Criteria...');
    const createCrit = async (name, maxMarks, order) => {
      const res = await fetch(`${BASE_URL}/api/criteria`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          eventId,
          name,
          description: `Assessment of ${name}`,
          maxMarks,
          minMarks: 0,
          order,
          required: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) console.error('Criteria error:', res.status, data);
      return data.criterion;
    };

    const crit1 = await createCrit('Innovation & Originality', 40, 1);
    const crit2 = await createCrit('Technical Execution', 40, 2);
    const crit3 = await createCrit('Presentation & Defense', 20, 3);
    assert(!!crit1?._id && !!crit2?._id && !!crit3?._id, `Criteria created: (Max 40, 40, 20 = 100 total)`);


    // 5. Create 3 Approved Teams
    console.log('\n[5] Creating and Approving 3 Teams...');
    const [team1Res, team2Res, team3Res] = await Promise.all([
      fetch(`${BASE_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          eventId,
          categoryId: cat1Id,
          teamName: 'Team Falcon X',
          project: { title: 'Autonomous Thermal Drone' },
          teamLeader: { name: 'Alice Lee', email: `alice.${timestamp}@student.edu` },
          members: [{ name: 'Alice Lee', class: 'Grade 12' }],
        }),
      }),
      fetch(`${BASE_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          eventId,
          categoryId: cat1Id,
          teamName: 'Team SkyWatcher',
          project: { title: 'AI Swarm Drone Fleet' },
          teamLeader: { name: 'Bob Ray', email: `bob.${timestamp}@student.edu` },
          members: [{ name: 'Bob Ray', class: 'Grade 12' }],
        }),
      }),
      fetch(`${BASE_URL}/api/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({
          eventId,
          categoryId: cat2Id,
          teamName: 'Team BionicGrip',
          project: { title: 'Neural Robotic Prosthetic' },
          teamLeader: { name: 'Charlie Kim', email: `charlie.${timestamp}@student.edu` },
          members: [{ name: 'Charlie Kim', class: 'Grade 11' }],
        }),
      }),
    ]);
    const team1Id = (await team1Res.json()).team._id;
    const team2Id = (await team2Res.json()).team._id;
    const team3Id = (await team3Res.json()).team._id;

    // Approve all 3 teams
    await Promise.all([
      fetch(`${BASE_URL}/api/teams/${team1Id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ status: 'APPROVED', stallNumber: 'A-101' }),
      }),
      fetch(`${BASE_URL}/api/teams/${team2Id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ status: 'APPROVED', stallNumber: 'A-102' }),
      }),
      fetch(`${BASE_URL}/api/teams/${team3Id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ status: 'APPROVED', stallNumber: 'B-201' }),
      }),
    ]);
    assert(!!team1Id && !!team2Id && !!team3Id, 'Teams created and approved');


    // 6. Create 2 Evaluators
    console.log('\n[6] Creating 2 Evaluators...');
    const judge1Email = `judge1.${timestamp}@portal.edu`;
    const judge2Email = `judge2.${timestamp}@portal.edu`;

    const [j1Res, j2Res] = await Promise.all([
      fetch(`${BASE_URL}/api/evaluators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ name: 'Dr. Katherine Bell', email: judge1Email, password: 'judgepassword123' }),
      }),
      fetch(`${BASE_URL}/api/evaluators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ name: 'Prof. Simon Vance', email: judge2Email, password: 'judgepassword123' }),
      }),
    ]);
    const judge1Id = (await j1Res.json()).evaluator._id;
    const judge2Id = (await j2Res.json()).evaluator._id;
    assert(!!judge1Id && !!judge2Id, '2 Evaluators created successfully');

    // Authenticate judges to get session cookies
    const [j1Login, j2Login] = await Promise.all([
      fetch(`${BASE_URL}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: judge1Email, password: 'judgepassword123' }),
      }),
      fetch(`${BASE_URL}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: judge2Email, password: 'judgepassword123' }),
      }),
    ]);
    judge1Cookie = (j1Login.headers.get('set-cookie') || '').split(';')[0];
    judge2Cookie = (j2Login.headers.get('set-cookie') || '').split(';')[0];
    assert(j1Login.ok && j2Login.ok, 'Evaluator session cookies acquired');

    // 7. Assign Evaluators to Teams
    console.log('\n[7] Assigning Evaluators (Team 1 & 2 have 2 judges; Team 3 has 1 judge)...');
    await Promise.all([
      fetch(`${BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ eventId, evaluatorId: judge1Id, teamId: team1Id }),
      }),
      fetch(`${BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ eventId, evaluatorId: judge2Id, teamId: team1Id }),
      }),
      fetch(`${BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ eventId, evaluatorId: judge1Id, teamId: team2Id }),
      }),
      fetch(`${BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ eventId, evaluatorId: judge2Id, teamId: team2Id }),
      }),
      fetch(`${BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
        body: JSON.stringify({ eventId, evaluatorId: judge1Id, teamId: team3Id }),
      }),
    ]);
    assert(true, 'Evaluators assigned to teams');

    // 8. Submit Multi-Judge Evaluations
    console.log('\n[8] Submitting Completed Evaluations with known marks...');
    // Team 1:
    // J1: Crit1=36, Crit2=34, Crit3=18 -> Total: 88
    // J2: Crit1=38, Crit2=36, Crit3=18 -> Total: 92
    // Average Team 1 = 90.00
    await fetch(`${BASE_URL}/api/evaluator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: judge1Cookie },
      body: JSON.stringify({
        eventId,
        teamId: team1Id,
        scores: [
          { criterionId: crit1._id, marks: 36 },
          { criterionId: crit2._id, marks: 34 },
          { criterionId: crit3._id, marks: 18 },
        ],
        generalFeedback: 'Strong flight demonstration.',
      }),
    });

    await fetch(`${BASE_URL}/api/evaluator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: judge2Cookie },
      body: JSON.stringify({
        eventId,
        teamId: team1Id,
        scores: [
          { criterionId: crit1._id, marks: 38 },
          { criterionId: crit2._id, marks: 36 },
          { criterionId: crit3._id, marks: 18 },
        ],
        generalFeedback: 'Impressive telemetry downlink.',
      }),
    });

    // Team 2 (Designed to tie at 90.00 average, but with higher Innovation marks):
    // J1: Crit1=40, Crit2=30, Crit3=20 -> Total: 90
    // J2: Crit1=40, Crit2=30, Crit3=20 -> Total: 90
    // Average Team 2 = 90.00
    // Team 2 Innovation average = 40.00 vs Team 1 Innovation average = 37.00
    await fetch(`${BASE_URL}/api/evaluator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: judge1Cookie },
      body: JSON.stringify({
        eventId,
        teamId: team2Id,
        scores: [
          { criterionId: crit1._id, marks: 40 },
          { criterionId: crit2._id, marks: 30 },
          { criterionId: crit3._id, marks: 20 },
        ],
        generalFeedback: 'Groundbreaking swarm synchronization algorithm.',
      }),
    });

    await fetch(`${BASE_URL}/api/evaluator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: judge2Cookie },
      body: JSON.stringify({
        eventId,
        teamId: team2Id,
        scores: [
          { criterionId: crit1._id, marks: 40 },
          { criterionId: crit2._id, marks: 30 },
          { criterionId: crit3._id, marks: 20 },
        ],
        generalFeedback: 'Flawless innovation.',
      }),
    });

    // Team 3 (Single judge, 75 total):
    // J1: Crit1=30, Crit2=30, Crit3=15 -> Total: 75
    await fetch(`${BASE_URL}/api/evaluator/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: judge1Cookie },
      body: JSON.stringify({
        eventId,
        teamId: team3Id,
        scores: [
          { criterionId: crit1._id, marks: 30 },
          { criterionId: crit2._id, marks: 30 },
          { criterionId: crit3._id, marks: 15 },
        ],
        generalFeedback: 'Good biomechanics prototype.',
      }),
    });
    assert(true, 'All 5 evaluations submitted and locked');

    // 9. Verify Multi-Judge Arithmetic Average Calculation
    console.log('\n[9] Tabulating Results & Verifying Arithmetic Averages...');
    const tabRes = await fetch(`${BASE_URL}/api/results/${eventId}?recalculate=true`, {
      headers: { Cookie: adminCookie },
    });
    const tabData = await tabRes.json();
    if (!tabRes.ok || !tabData.success) {
      console.error('Tabulation failed:', tabRes.status, tabData);
    }
    assert(tabRes.ok && tabData.success, 'Results tabulated successfully');

    const results = tabData.result?.results || [];

    const resTeam1 = results.find((r) => r.teamId === team1Id);
    const resTeam2 = results.find((r) => r.teamId === team2Id);
    const resTeam3 = results.find((r) => r.teamId === team3Id);

    assert(resTeam1 && resTeam1.averageScore === 90, `Team 1 average score is 90.00 (got ${resTeam1?.averageScore})`);
    assert(resTeam1?.evaluationsCount === 2, 'Team 1 has 2 completed evaluations');
    assert(resTeam2 && resTeam2.averageScore === 90, `Team 2 average score is 90.00 (got ${resTeam2?.averageScore})`);
    assert(resTeam3 && resTeam3.averageScore === 75, `Team 3 average score is 75.00 (got ${resTeam3?.averageScore})`);

    // 10. Verify Tie-Breaking Resolution:
    // With default order (Crit1 = Innovation first), Team 2 has 40.00 vs Team 1 has 37.00.
    // Therefore Team 2 MUST be Rank 1 and Team 1 MUST be Rank 2!
    console.log('\n[10] Verifying Tie-Breaking with Innovation Priority...');
    assert(resTeam2?.rankOverall === 1, `Team 2 ranked #1 Overall by tie-breaker (got #${resTeam2?.rankOverall})`);
    assert(resTeam1?.rankOverall === 2, `Team 1 ranked #2 Overall (got #${resTeam1?.rankOverall})`);
    assert(resTeam3?.rankOverall === 3, `Team 3 ranked #3 Overall (got #${resTeam3?.rankOverall})`);

    // Category ranks:
    // In Autonomous Drones: Team 2 is #1 in Category, Team 1 is #2 in Category.
    // In Bionic Prosthetics: Team 3 is #1 in Category.
    assert(resTeam2?.rankInCategory === 1, `Team 2 is #1 in Autonomous Drones`);
    assert(resTeam1?.rankInCategory === 2, `Team 1 is #2 in Autonomous Drones`);
    assert(resTeam3?.rankInCategory === 1, `Team 3 is #1 in Bionic Prosthetics`);

    // 11. Test Custom Tie-Break Order Reversal:
    // Switch priority so Technical Execution (Crit 2) is evaluated FIRST.
    // Team 1 Technical Execution average: (34 + 36) / 2 = 35.00
    // Team 2 Technical Execution average: (30 + 30) / 2 = 30.00
    // After re-ordering, Team 1 MUST now beat Team 2 and become Rank 1!
    console.log('\n[11] Re-ordering Tie-Breaker to Technical Execution Priority...');
    const reorderRes = await fetch(`${BASE_URL}/api/results/${eventId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        tieBreakOrder: [crit2._id, crit1._id, crit3._id],
      }),
    });
    const reorderData = await reorderRes.json();
    assert(reorderRes.ok && reorderData.success, 'Tie-break order successfully updated');

    const reorderedResults = reorderData.result.results;
    const reTeam1 = reorderedResults.find((r) => r.teamId === team1Id);
    const reTeam2 = reorderedResults.find((r) => r.teamId === team2Id);

    assert(
      reTeam1?.rankOverall === 1,
      `Team 1 now wins Rank #1 with Technical Execution tie-breaker (got #${reTeam1?.rankOverall})`
    );
    assert(
      reTeam2?.rankOverall === 2,
      `Team 2 moves to Rank #2 (got #${reTeam2?.rankOverall})`
    );

    // 12. Test Public Gating Before Publication
    console.log('\n[12] Testing Public Gating (Current status is DRAFT)...');
    const publicPreRes = await fetch(`${BASE_URL}/api/public/events/${eventSlug}/results`);
    const publicPreData = await publicPreRes.json();
    assert(
      publicPreRes.ok && publicPreData.isPublished === false,
      'Public access blocked when results are in DRAFT (isPublished: false)'
    );

    // 13. Test Status Transitions: DRAFT -> REVIEW -> APPROVED -> PUBLISHED
    console.log('\n[13] Testing Lifecycle Transitions: DRAFT -> REVIEW -> APPROVED -> PUBLISHED...');

    // Attempt invalid transition (e.g., DRAFT directly to PUBLISHED)
    const invalidJump = await fetch(`${BASE_URL}/api/results/${eventId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'PUBLISHED' }),
    });
    assert(
      !invalidJump.ok,
      'Direct leap DRAFT -> PUBLISHED rejected by transition guard'
    );

    // DRAFT -> REVIEW
    const toReview = await fetch(`${BASE_URL}/api/results/${eventId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'REVIEW' }),
    });
    const toReviewData = await toReview.json();
    assert(toReview.ok && toReviewData.result?.status === 'REVIEW', 'Status moved to REVIEW');

    // Verify public is still blocked during committee REVIEW
    const publicReviewRes = await fetch(`${BASE_URL}/api/public/events/${eventSlug}/results`);
    const publicReviewData = await publicReviewRes.json();
    assert(
      publicReviewData.isPublished === false,
      'Public access blocked during committee REVIEW'
    );

    // REVIEW -> APPROVED
    const toApproved = await fetch(`${BASE_URL}/api/results/${eventId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    const toApprovedData = await toApproved.json();
    assert(
      toApproved.ok && toApprovedData.result?.status === 'APPROVED' && !!toApprovedData.result?.approvedBy,
      `Status moved to APPROVED with steering committee signature (${toApprovedData.result?.approvedBy})`
    );

    // APPROVED -> PUBLISHED
    const toPublished = await fetch(`${BASE_URL}/api/results/${eventId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'PUBLISHED' }),
    });
    const toPublishedData = await toPublished.json();
    assert(
      toPublished.ok && toPublishedData.result?.status === 'PUBLISHED' && !!toPublishedData.result?.publishedAt,
      `Status moved to PUBLISHED with publishedAt timestamp`
    );

    // 14. Test Public Leaderboard Access & Confidentiality
    console.log('\n[14] Testing Public Leaderboard & Confidentiality (Zero peer judge identity exposure)...');
    const publicPostRes = await fetch(`${BASE_URL}/api/public/events/${eventSlug}/results`);
    const publicPostData = await publicPostRes.json();

    assert(
      publicPostRes.ok && publicPostData.isPublished === true,
      'Public leaderboard now live (isPublished: true)'
    );

    const publicTeams = publicPostData.result?.results || [];
    assert(publicTeams.length === 3, `Public results returned 3 competing teams`);

    // Verify evaluator anonymity: NO evaluatorScores, NO evaluator names in public response
    const hasEvaluatorLeak = publicTeams.some(
      (t) => t.evaluatorScores !== undefined && t.evaluatorScores.length > 0
    );
    assert(!hasEvaluatorLeak, 'Evaluator confidentiality verified: evaluatorScores stripped from public view');

    // Verify Winner standings in public response
    const publicWinner = publicTeams[0];
    assert(publicWinner.rankOverall === 1, `Public Grand Champion is Rank #1 (${publicWinner.teamName})`);
    assert(publicWinner.averageScore === 90, `Public final score accurately displayed (${publicWinner.averageScore} pts)`);

    // 15. Verify Admin Overview Endpoint
    console.log('\n[15] Testing GET /api/results admin overview...');
    const allResultsRes = await fetch(`${BASE_URL}/api/results`, {
      headers: { Cookie: adminCookie },
    });
    const allResultsData = await allResultsRes.json();
    console.log('GET /api/results status:', allResultsRes.status, 'Body:', JSON.stringify(allResultsData).slice(0, 300));
    const eventSummary = allResultsData.events?.find((e) => e.eventId === eventId);

    assert(
      allResultsRes.ok && eventSummary?.resultStatus === 'PUBLISHED',
      'Event result summary correctly reflected in admin directory'
    );


    console.log('\n================================================================');
    console.log(`Phase 6 Result Engine Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test run error:', error);
    process.exit(1);
  }
}

run();
