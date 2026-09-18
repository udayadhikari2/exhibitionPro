// Automated validation test script for Phase 3 - Student Registration & Admin Review
const BASE_URL = 'http://localhost:3000';

let studentCookie = '';
let adminCookie = '';

async function run() {
  console.log('================================================================');
  console.log('      PHASE 3 — STUDENT REGISTRATION & REVIEW TEST SUITE        ');
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
    // 1. Authenticate as STUDENT
    console.log('\n[1] Authenticating as STUDENT (alex@student.edu)...');
    const studentLoginRes = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alex@student.edu', password: 'student123' }),
    });
    const studentLoginData = await studentLoginRes.json();
    assert(studentLoginRes.ok && studentLoginData.user?.role === 'STUDENT', 'Student logged in successfully');
    studentCookie = (studentLoginRes.headers.get('set-cookie') || '').split(';')[0];

    // 2. Authenticate as SUPER_ADMIN
    console.log('\n[2] Authenticating as SUPER_ADMIN (admin@portal.edu)...');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@portal.edu', password: 'admin123' }),
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.ok && adminLoginData.user?.role === 'SUPER_ADMIN', 'Super Admin logged in successfully');
    adminCookie = (adminLoginRes.headers.get('set-cookie') || '').split(';')[0];

    // 3. Find an active event and category for registration
    console.log('\n[3] Fetching available events and categories...');
    const eventsRes = await fetch(`${BASE_URL}/api/events`);
    const eventsData = await eventsRes.json();
    assert(eventsRes.ok && eventsData.events?.length > 0, `Events retrieved: ${eventsData.events?.length} found`);
    const targetEvent = eventsData.events[0];
    console.log(`    Selected Event: "${targetEvent.name}" (${targetEvent._id}, slug: ${targetEvent.slug})`);

    const catRes = await fetch(`${BASE_URL}/api/events/${targetEvent._id}/categories`);
    const catData = await catRes.json();
    let targetCatId = '';
    if (catData.categories && catData.categories.length > 0) {
      targetCatId = catData.categories[0]._id;
      console.log(`    Selected Category: "${catData.categories[0].name}" (${targetCatId})`);
    }

    // 4. Test File Upload Endpoint
    console.log('\n[4] Testing POST /api/upload (File Upload Abstraction)...');
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const fileContent = 'Simulated Project Synopsis and Circuit Diagram PDF Document Content';
    const multipartBody = [
      `--${boundary}`,
      'Content-Disposition: form-data; name="file"; filename="drone_synopsis.pdf"',
      'Content-Type: application/pdf',
      '',
      fileContent,
      `--${boundary}--`,
    ].join('\r\n');

    const uploadRes = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        Cookie: studentCookie,
      },
      body: multipartBody,
    });
    const uploadData = await uploadRes.json();
    assert(uploadRes.ok && uploadData.url, `File uploaded successfully: ${uploadData.url}`);
    const uploadedFileUrl = uploadData.url;

    // 5. Create Team with Full Project Dossier & Members
    console.log('\n[5] Testing POST /api/teams (Registering Team with Members & Project)...');
    const teamPayload = {
      eventId: targetEvent._id,
      categoryId: targetCatId,
      teamName: `AeroRelief Innovations ${Date.now().toString().slice(-4)}`,
      school: 'St. Xavier Science Institute',
      class: 'Grade 11',
      section: 'B',
      mentor: 'Dr. Alistair Vance (Department of Robotics)',
      contact: '+1 555-019-8833',
      members: [
        {
          name: 'Alex Johnson',
          class: 'Grade 11',
          section: 'B',
          rollNumber: 'R-1102',
          role: 'Team Leader & Embedded Programmer',
          contact: 'alex@student.edu',
        },
        {
          name: 'Maya Patel',
          class: 'Grade 11',
          section: 'B',
          rollNumber: 'R-1144',
          role: 'Hardware & Sensor Engineer',
          contact: 'maya@student.edu',
        },
        {
          name: 'Devon Lee',
          class: 'Grade 11',
          section: 'A',
          rollNumber: 'R-1118',
          role: 'Aerodynamics & CAD Designer',
          contact: 'devon@student.edu',
        },
      ],
      project: {
        title: 'Autonomous First-Aid Dispatch UAV with Thermal Beacon Detection',
        shortDescription: 'A rapid deployment emergency drone delivering life-saving medical supplies to disaster zones.',
        problemStatement: 'Search and rescue teams face delayed access to remote terrain during earthquakes and floods.',
        objectives: '1. Autonomous GPS waypoint navigation. 2. Thermal payload drop within 1m accuracy. 3. 25-minute flight time.',
        methodology: 'Built using carbon fiber quad airframe, Pixhawk PX4 autopilot, and FLIR Lepton sensor module.',
        innovation: 'Custom dual-gimbal quick-release mechanism with parachute descent for fragile insulin/adrenaline packages.',
        materials: 'Carbon fiber tubes, 2212 920KV brushless motors, 4S 5000mAh LiPo, PX4 autopilot, ESP32 telemetry.',
        technologyUsed: 'C++, ROS2, Computer Vision OpenCV, PX4 Autopilot, Next.js Ground Station UI',
        expectedOutcome: 'Achieve stable autonomous hover and deliver 500g medical payload to designated GPS coordinates.',
        futureScope: 'Integration with 5G cellular modems and satellite communications for beyond-visual-line-of-sight operations.',
        projectCost: 380,
        files: [
          {
            name: 'drone_synopsis.pdf',
            url: uploadedFileUrl,
            size: fileContent.length,
            type: 'application/pdf',
          },
        ],
      },
      status: 'SUBMITTED',
    };

    const createTeamRes = await fetch(`${BASE_URL}/api/teams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify(teamPayload),
    });
    const createTeamData = await createTeamRes.json();
    assert(createTeamRes.status === 201 && createTeamData.team?._id, 'Team registered with HTTP 201 Created');
    const createdTeam = createTeamData.team;

    // Verify auto-generated Team Code
    console.log(`    Auto-generated Team Code: "${createdTeam.teamCode}"`);
    const codeFormatRegex = /^[A-Z0-9]+-\d{4}-\d{3,}$/;
    assert(codeFormatRegex.test(createdTeam.teamCode), `Team code matches standard pattern: ${createdTeam.teamCode}`);
    assert(createdTeam.members?.length === 3, 'All 3 roster members stored accurately');
    assert(createdTeam.project?.title === teamPayload.project.title, 'Project technical scope correctly preserved');
    assert(createdTeam.status === 'SUBMITTED', 'Team status is initially SUBMITTED');

    // 6. Test Student GET /api/teams and /api/teams?myTeams=true
    console.log('\n[6] Testing GET /api/teams?myTeams=true (Student Team Portfolio)...');
    const myTeamsRes = await fetch(`${BASE_URL}/api/teams?myTeams=true`, {
      headers: { Cookie: studentCookie },
    });
    const myTeamsData = await myTeamsRes.json();
    assert(myTeamsRes.ok && Array.isArray(myTeamsData.teams), 'Student myTeams endpoint returned array');
    const foundMyTeam = myTeamsData.teams.find((t) => t._id === createdTeam._id);
    assert(!!foundMyTeam, 'Newly created team appears in student profile');

    // 7. Test Admin GET /api/teams & /api/teams/[id]
    console.log('\n[7] Testing Admin GET /api/teams (Portal Submissions Console)...');
    const adminTeamsRes = await fetch(`${BASE_URL}/api/teams`, {
      headers: { Cookie: adminCookie },
    });
    const adminTeamsData = await adminTeamsRes.json();
    assert(adminTeamsRes.ok && Array.isArray(adminTeamsData.teams), 'Admin retrieved all portal registrations');

    const adminDetailRes = await fetch(`${BASE_URL}/api/teams/${createdTeam._id}`, {
      headers: { Cookie: adminCookie },
    });
    const adminDetailData = await adminDetailRes.json();
    assert(adminDetailRes.ok && adminDetailData.team?._id === createdTeam._id, 'Admin retrieved full team dossier');

    // 8. Admin Requests Correction (CORRECTION_REQUIRED)
    console.log('\n[8] Testing Admin POST /api/teams/[id]/status (Request Correction with remarks)...');
    const correctionRemarks = 'Please clarify flight endurance under maximum 500g payload and verify battery safety protocol.';
    const correctionRes = await fetch(`${BASE_URL}/api/teams/${createdTeam._id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        status: 'CORRECTION_REQUIRED',
        remarks: correctionRemarks,
      }),
    });
    const correctionData = await correctionRes.json();
    assert(correctionRes.ok, 'Correction request successfully posted');
    assert(
      correctionData.team?.status === 'CORRECTION_REQUIRED',
      'Team status transitioned to CORRECTION_REQUIRED'
    );
    assert(
      correctionData.team?.adminRemarks === correctionRemarks,
      'Admin remarks saved on team record'
    );

    // 9. Student Updates Project and Resubmits (PUT /api/teams/[id])
    console.log('\n[9] Testing Student PUT /api/teams/[id] (Project Update & Auto-Resubmit)...');
    const updatedMethodology =
      teamPayload.project.methodology + ' [UPDATED: Bench-tested with 500g payload, confirmed 22min flight duration with thermal cutoff switch].';
    const updateRes = await fetch(`${BASE_URL}/api/teams/${createdTeam._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie,
      },
      body: JSON.stringify({
        project: {
          ...teamPayload.project,
          methodology: updatedMethodology,
        },
      }),
    });
    const updateData = await updateRes.json();
    assert(updateRes.ok, 'Student successfully updated project submission');
    assert(
      updateData.team?.status === 'SUBMITTED',
      'Team status automatically re-promoted to SUBMITTED after student revision'
    );
    assert(
      updateData.team?.project?.methodology.includes('[UPDATED:'),
      'Updated methodology stored properly'
    );

    // 10. Admin Approves Team & Allocates Stall Number
    console.log('\n[10] Testing Admin POST /api/teams/[id]/status (Approval & Stall Allocation)...');
    const allocatedStall = 'Stall B-14';
    const approveRes = await fetch(`${BASE_URL}/api/teams/${createdTeam._id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        status: 'APPROVED',
        stallNumber: allocatedStall,
        remarks: 'Excellent technical methodology and safety compliance. Approved for main exhibition.',
      }),
    });
    const approveData = await approveRes.json();
    assert(approveRes.ok, 'Team approved successfully');
    assert(approveData.team?.status === 'APPROVED', 'Team status is APPROVED');
    assert(approveData.team?.stallNumber === allocatedStall, `Allocated stall: ${approveData.team?.stallNumber}`);
    assert(
      approveData.team?.qrCodeUrl && approveData.team?.qrCodeUrl.includes('/stall/'),
      `QR Stall URL generated: ${approveData.team?.qrCodeUrl}`
    );

    // 11. Verify Unapproved / Unauthorized Access Protection
    console.log('\n[11] Testing Security: Student cannot approve their own team...');
    const rogueApproveRes = await fetch(`${BASE_URL}/api/teams/${createdTeam._id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: studentCookie, // STUDENT role attempting admin status transition
      },
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    assert(
      rogueApproveRes.status === 403,
      `Student blocked from status transition with HTTP 403 (Received ${rogueApproveRes.status})`
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
