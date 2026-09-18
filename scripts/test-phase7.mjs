// Automated validation test script for Phase 7 - Public Exhibition Experience & QR
const BASE_URL = 'http://localhost:3000';

async function run() {
  console.log('================================================================');
  console.log('       PHASE 7 — PUBLIC EXHIBITION EXPERIENCE TEST SUITE        ');
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
    // 1. Fetch public events list to pick an active event
    console.log('\n[1] Checking Public Events Discovery (/api/events)...');
    const eventsRes = await fetch(`${BASE_URL}/api/events`);
    const eventsData = await eventsRes.json();
    assert(eventsRes.ok && Array.isArray(eventsData.events) && eventsData.events.length > 0, 'Public events API is accessible without authentication');

    const testEvent = eventsData.events.find((e) => e.slug === 'phase6-cup-4422') || eventsData.events[0];
    const eventSlug = testEvent.slug;
    console.log(`  -> Selected event: "${testEvent.name}" (slug: ${eventSlug})`);

    // 2. Fetch Public Event Details & Project Showcase (GET /api/public/events/[slug])
    console.log(`\n[2] Checking Public Exhibition API (/api/public/events/${eventSlug})...`);
    const publicEventRes = await fetch(`${BASE_URL}/api/public/events/${eventSlug}`);
    assert(publicEventRes.ok, `HTTP ${publicEventRes.status} from public event API (no auth required)`);

    const publicEventData = await publicEventRes.json();
    assert(publicEventData.success === true, 'Response contains success: true');
    assert(publicEventData.event && publicEventData.event.name === testEvent.name, `Event name matched: "${publicEventData.event?.name}"`);
    assert(Array.isArray(publicEventData.categories), `Categories returned (${publicEventData.categories.length} tracks)`);
    assert(Array.isArray(publicEventData.projects), `Projects returned (${publicEventData.projects.length} exhibition entries)`);

    // 3. Strict Privacy & Sanitization Verification
    console.log('\n[3] Verifying Zero PII Leak & Strict Sanitization...');
    if (publicEventData.projects.length > 0) {
      const sample = publicEventData.projects[0];
      assert(!!sample.projectTitle && !!sample.teamName, 'Project title and team name are present');
      assert(!!sample.teamCode, `Team code present: ${sample.teamCode}`);
      assert(sample.teamLeader?.email === undefined, 'Team leader email is strictly removed');
      assert(sample.teamLeader?.phone === undefined, 'Team leader phone is strictly removed');
      assert(sample.teamLeader?.userId === undefined, 'Team leader userId is strictly removed');
      assert(sample.mentor?.phone === undefined, 'Mentor phone is strictly removed');
      assert(sample.mentor?.email === undefined, 'Mentor email is strictly removed');

      if (sample.members && sample.members.length > 0) {
        assert(!!sample.members[0].name, `Student member name present: ${sample.members[0].name}`);
        assert(sample.members[0].email === undefined, 'Student member email is strictly stripped');
        assert(sample.members[0].contact === undefined, 'Student member contact is strictly stripped');
        assert(sample.members[0].rollNumber === undefined, 'Student member roll number is strictly stripped');
      }

      assert(sample.evaluations === undefined, 'Internal judge evaluations strictly stripped');
      assert(sample.evaluatorScores === undefined, 'Evaluator scorecards strictly stripped');
    }

    // 4. Multi-Field Search Filter Verification
    console.log('\n[4] Testing Multi-Field Search on Public Projects...');
    if (publicEventData.projects.length > 0) {
      const targetProject = publicEventData.projects[0];
      const searchTerm = (targetProject.projectTitle || targetProject.teamName || 'Drone').split(' ')[0];

      const searchRes = await fetch(`${BASE_URL}/api/public/events/${eventSlug}?search=${encodeURIComponent(searchTerm)}`);
      const searchData = await searchRes.json();
      assert(searchRes.ok, `Search request HTTP 200 for term "${searchTerm}"`);
      assert(searchData.projects.some((p) => p.id === targetProject.id), `Search returned target project (${targetProject.projectTitle})`);

      // Negative search
      const negRes = await fetch(`${BASE_URL}/api/public/events/${eventSlug}?search=RandomNonsenseX999`);
      const negData = await negRes.json();
      assert(negData.projects.length === 0, 'Search for non-existent term returns 0 projects');
    }

    // 5. Individual Public Project Showcase (/api/public/events/[slug]/projects/[teamCode])
    console.log('\n[5] Testing Individual Public Project Showcase...');
    const targetCode = publicEventData.projects[0]?.teamCode || 'EXH-2026-001';
    const singleProjRes = await fetch(`${BASE_URL}/api/public/events/${eventSlug}/projects/${targetCode}`);
    assert(singleProjRes.ok, `HTTP ${singleProjRes.status} for project showcase (${targetCode})`);

    const singleProjData = await singleProjRes.json();
    assert(singleProjData.success === true, 'Single project returned success: true');
    assert(singleProjData.project?.teamCode === targetCode, `Matched team code: ${targetCode}`);
    assert(!!singleProjData.project?.shortDescription, 'Project short description is present');
    assert(singleProjData.project?.qrCodeUrl?.includes(`/events/${eventSlug}/projects/${targetCode}`), 'Canonical QR target URL is properly formed');

    // 6. Event-Level QR Code (/api/public/events/[slug]/qr)
    console.log('\n[6] Testing Event Gateway QR Code Generator...');
    const eventQrRes = await fetch(`${BASE_URL}/api/public/events/${eventSlug}/qr`);
    assert(eventQrRes.ok, 'Event QR endpoint responded HTTP 200');
    const eventQrData = await eventQrRes.json();
    assert(eventQrData.success === true, 'Event QR success: true');
    assert(eventQrData.qrDataUrl && eventQrData.qrDataUrl.startsWith('data:image/'), 'QR code data URL generated');
    assert(eventQrData.targetUrl && eventQrData.targetUrl.includes(`/events/${eventSlug}`), 'Event QR target URL matches canonical path');

    // Test SVG format
    const eventQrSvgRes = await fetch(`${BASE_URL}/api/public/events/${eventSlug}/qr?format=svg`);
    assert(eventQrSvgRes.ok, 'Event QR SVG responded HTTP 200');
    const contentType = eventQrSvgRes.headers.get('content-type') || '';
    assert(contentType.includes('image/svg+xml'), `Content-Type is SVG (${contentType})`);
    const svgText = await eventQrSvgRes.text();
    assert(svgText.includes('<svg'), 'SVG output contains <svg tag');

    // 7. Project-Level QR Code (/api/public/events/[slug]/projects/[teamCode]/qr)
    console.log('\n[7] Testing Project Placard QR Code Generator...');
    const projQrRes = await fetch(`${BASE_URL}/api/public/events/${eventSlug}/projects/${targetCode}/qr`);
    assert(projQrRes.ok, 'Project QR endpoint responded HTTP 200');
    const projQrData = await projQrRes.json();
    assert(projQrData.success === true, 'Project QR success: true');
    assert(projQrData.qrDataUrl && projQrData.qrDataUrl.startsWith('data:image/'), 'Project QR PNG data URL generated');
    assert(projQrData.targetUrl && projQrData.targetUrl.includes(`/events/${eventSlug}/projects/${targetCode}`), 'Project QR links to canonical project URL');

    // 8. Public Visitor Feedback Submission (/api/feedback)
    console.log('\n[8] Testing Public Visitor Feedback Submission...');
    const fbRes = await fetch(`${BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: singleProjData.project.id,
        visitorName: 'Dr. Jane Visitor',
        visitorType: 'Industry Professional',
        rating: 5,
        comments: 'Outstanding prototype! Innovative architecture and clean presentation.',
      }),
    });
    assert(fbRes.ok, `Visitor feedback submission succeeded (HTTP ${fbRes.status})`);
    const fbData = await fbRes.json();
    assert(fbData.success === true || !!fbData.feedback, 'Feedback record confirmed in response');

    // 9. Public HTML Pages Accessibility (No Auth Required)
    console.log('\n[9] Testing Public Frontend Pages Status...');
    const [eventPageRes, projectPageRes] = await Promise.all([
      fetch(`${BASE_URL}/events/${eventSlug}`),
      fetch(`${BASE_URL}/events/${eventSlug}/projects/${targetCode}`),
    ]);
    assert(eventPageRes.ok, `Public Event Page HTTP ${eventPageRes.status}`);
    assert(projectPageRes.ok, `Public Project Page HTTP ${projectPageRes.status}`);

  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  }

  console.log('\n================================================================');
  console.log(`  PHASE 7 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

run();
