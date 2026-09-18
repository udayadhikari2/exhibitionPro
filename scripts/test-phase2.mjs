// Automated validation test script for Phase 2 - Event & Category Management
const BASE_URL = 'http://localhost:3000';

let adminCookie = '';

async function run() {
  console.log('--- Starting Phase 2 Automated Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`PASS: ${message}`);
      passed++;
    } else {
      console.error(`FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate as SUPER_ADMIN
    console.log('\n[1] Authenticating as SUPER_ADMIN...');
    const loginRes = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@portal.edu', password: 'admin123' }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.ok && loginData.success, 'Super Admin logged in successfully');
    adminCookie = loginRes.headers.get('set-cookie') || '';
    if (adminCookie.includes(';')) {
      adminCookie = adminCookie.split(';')[0];
    }

    // 2. Query all events
    console.log('\n[2] Testing GET /api/events...');
    const listRes = await fetch(`${BASE_URL}/api/events`);
    const listData = await listRes.json();
    assert(listRes.ok && Array.isArray(listData.events), 'Events list returns array');
    const initialCount = listData.events.length;
    console.log(`Found ${initialCount} initial events in catalog.`);

    // 3. Create a new event with custom type
    console.log('\n[3] Testing POST /api/events (Create Event)...');
    const newEventPayload = {
      name: `Robotics Expo 2026 Test ${Date.now()}`,
      slug: `robotics-expo-test-${Date.now()}`,
      description: 'Annual inter-collegiate robotics and embedded systems showcase.',
      eventType: 'Robotics',
      venue: 'Innovation Hub Pavilion C',
      startDate: '2026-11-20T09:00:00Z',
      endDate: '2026-11-22T18:00:00Z',
      registrationStart: '2026-10-01T00:00:00Z',
      registrationEnd: '2026-11-10T23:59:59Z',
      organizer: 'Robotics Guild & Faculty',
      contact: 'guild@portal.edu / (555) 300-1122',
    };

    const createRes = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify(newEventPayload),
    });
    const createData = await createRes.json();
    assert(createRes.status === 201 && createData.event?._id, 'Event created with 201 Created status');
    const createdEvent = createData.event;
    assert(createdEvent.status === 'DRAFT', 'Initial event status is DRAFT');
    assert(createdEvent.eventType === 'Robotics', 'Custom eventType preserved as Robotics');

    const eventId = createdEvent._id;
    const eventSlug = createdEvent.slug;

    // 4. Retrieve event by ID and Slug
    console.log('\n[4] Testing GET /api/events/[id] and by slug...');
    const getByIdRes = await fetch(`${BASE_URL}/api/events/${eventId}`);
    const getByIdData = await getByIdRes.json();
    assert(getByIdRes.ok && getByIdData.event?._id === eventId, 'Fetched event by ID');

    const getBySlugRes = await fetch(`${BASE_URL}/api/events/${eventSlug}`);
    const getBySlugData = await getBySlugRes.json();
    assert(getBySlugRes.ok && getBySlugData.event?.slug === eventSlug, 'Fetched event by Slug');

    // 5. Add Categories to the Event
    console.log('\n[5] Testing POST & GET /api/events/[id]/categories...');
    const cat1Payload = {
      name: 'Autonomous Rover Challenge',
      description: 'Obstacle avoidance and SLAM navigation.',
      order: 1,
      status: 'ACTIVE',
    };
    const addCat1 = await fetch(`${BASE_URL}/api/events/${eventId}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify(cat1Payload),
    });
    const addCat1Data = await addCat1.json();
    assert(addCat1.status === 201 && addCat1Data.category?._id, 'Created Category 1 (Autonomous Rover Challenge)');
    const cat1Id = addCat1Data.category._id;

    const cat2Payload = {
      name: 'BattleBots Combat Division',
      description: '30lb combat robotics elimination rounds.',
      order: 2,
      status: 'ACTIVE',
    };
    const addCat2 = await fetch(`${BASE_URL}/api/events/${eventId}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify(cat2Payload),
    });
    const addCat2Data = await addCat2.json();
    assert(addCat2.status === 201 && addCat2Data.category?._id, 'Created Category 2 (BattleBots Combat Division)');
    const cat2Id = addCat2Data.category._id;

    // Fetch categories for this event
    const getCatsRes = await fetch(`${BASE_URL}/api/events/${eventId}/categories`);
    const getCatsData = await getCatsRes.json();
    assert(getCatsRes.ok && getCatsData.categories.length >= 2, 'Fetched event categories list');

    // 6. Update a category
    console.log('\n[6] Testing PUT /api/categories/[id]...');
    const updateCatRes = await fetch(`${BASE_URL}/api/categories/${cat1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ name: 'Autonomous Rover & Drone Challenge' }),
    });
    const updateCatData = await updateCatRes.json();
    assert(updateCatRes.ok && updateCatData.category?.name.includes('Drone'), 'Category updated successfully');

    // 7. Validate Status Transitions
    console.log('\n[7] Testing Status Transitions & Lifecycle Validation...');
    // Attempt invalid jump from DRAFT directly to RESULT_PUBLISHED
    const invalidJumpRes = await fetch(`${BASE_URL}/api/events/${eventId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'RESULT_PUBLISHED' }),
    });
    const invalidJumpData = await invalidJumpRes.json();
    console.log('DEBUG invalidJump:', invalidJumpRes.status, invalidJumpData);
    assert(!invalidJumpRes.ok && invalidJumpRes.status === 400, 'Invalid transition (DRAFT -> RESULT_PUBLISHED) rejected with 400');
    console.log(`Validation reason: "${invalidJumpData.error}"`);

    // Valid forward transition: DRAFT -> REGISTRATION_OPEN
    const validStep1 = await fetch(`${BASE_URL}/api/events/${eventId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'REGISTRATION_OPEN' }),
    });
    const validStep1Data = await validStep1.json();
    assert(validStep1.ok && validStep1Data.event?.status === 'REGISTRATION_OPEN', 'Advanced status to REGISTRATION_OPEN');

    // Valid step 2: REGISTRATION_OPEN -> REGISTRATION_CLOSED
    const validStep2 = await fetch(`${BASE_URL}/api/events/${eventId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'REGISTRATION_CLOSED' }),
    });
    const validStep2Data = await validStep2.json();
    assert(validStep2.ok && validStep2Data.event?.status === 'REGISTRATION_CLOSED', 'Advanced status to REGISTRATION_CLOSED');

    // 8. Update Event Details
    console.log('\n[8] Testing PUT /api/events/[id] (Edit Event)...');
    const updateEvtRes = await fetch(`${BASE_URL}/api/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        venue: 'Grand Tech Arena - Main Stage',
      }),
    });
    const updateEvtData = await updateEvtRes.json();
    assert(updateEvtRes.ok && updateEvtData.event?.venue === 'Grand Tech Arena - Main Stage', 'Updated event venue');

    // 9. Archive Event
    console.log('\n[9] Testing DELETE /api/events/[id] (Archive Event)...');
    const archiveRes = await fetch(`${BASE_URL}/api/events/${eventId}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    const archiveData = await archiveRes.json();
    assert(archiveRes.ok && archiveData.event?.status === 'ARCHIVED', 'Archived event successfully');

    // Verify archived event is excluded from standard listing unless includeArchived=true
    const checkExclusionRes = await fetch(`${BASE_URL}/api/events`);
    const checkExclusionData = await checkExclusionRes.json();
    const isPresentInNormal = checkExclusionData.events.some((e) => e._id === eventId);
    assert(!isPresentInNormal, 'Archived event excluded from default listing');

    const checkInclusionRes = await fetch(`${BASE_URL}/api/events?includeArchived=true`);
    const checkInclusionData = await checkInclusionRes.json();
    const isPresentInArchived = checkInclusionData.events.some((e) => e._id === eventId);
    assert(isPresentInArchived, 'Archived event returned when includeArchived=true');

    // 10. Delete a Category
    console.log('\n[10] Testing DELETE /api/categories/[id]...');
    const delCatRes = await fetch(`${BASE_URL}/api/categories/${cat2Id}`, {
      method: 'DELETE',
      headers: { Cookie: adminCookie },
    });
    const delCatData = await delCatRes.json();
    assert(delCatRes.ok && delCatData.success, 'Deleted category 2 successfully');

    console.log(`\n========================================`);
    console.log(`Phase 2 Tests Finished: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================`);

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Test suite error:', err);
    process.exit(1);
  }
}

run();
