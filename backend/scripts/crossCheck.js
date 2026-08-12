const baseUrl = 'http://localhost:4000';

async function runTests() {
  console.log('🚀 Starting Full FastBite Subsystem Cross-Check...\n');
  const results = [];

  async function check(name, fn) {
    try {
      const res = await fn();
      results.push({ name, status: 'PASS', details: res });
      console.log('✅ PASS:', name, res ? JSON.stringify(res) : '');
    } catch (err) {
      results.push({ name, status: 'FAIL', error: err.message });
      console.error('❌ FAIL:', name, err.message);
    }
  }

  // 1. Health Check
  await check('Health Endpoint', async () => {
    const r = await fetch(baseUrl + '/health');
    const d = await r.json();
    if (d.status !== 'ok' || d.database !== 'connected') throw new Error('Unhealthy DB');
    return { status: d.status, db: d.database };
  });

  // 2. CORS Headers Check
  await check('CORS & Preflight Headers', async () => {
    const r = await fetch(baseUrl + '/api/user/login', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,token'
      }
    });
    const cors = r.headers.get('access-control-allow-origin');
    if (!cors) throw new Error('Missing CORS Header');
    return { status: r.status, cors };
  });

  // 3. Products Catalog (Storefront)
  await check('Public Products API', async () => {
    const r = await fetch(baseUrl + '/api/food/list');
    const d = await r.json();
    if (!d.success || !Array.isArray(d.data)) throw new Error('Failed to load products');
    return { count: d.data.length, sampleProduct: d.data[0]?.name };
  });

  // 4. Categories (Storefront)
  await check('Public Categories API', async () => {
    const r = await fetch(baseUrl + '/api/categories');
    const d = await r.json();
    if (!d.success || !Array.isArray(d.data)) throw new Error('Failed to load categories');
    return { count: d.data.length };
  });

  // 5. Reviews Endpoint (Storefront)
  await check('Public Reviews API', async () => {
    const r = await fetch(baseUrl + '/api/reviews/product/1?limit=1');
    const d = await r.json();
    if (!d.success || !d.summary) throw new Error('Failed to load reviews');
    return { avgRating: d.summary.averageRating, totalReviews: d.summary.totalReviews };
  });

  // 6. User Auth (Invalid Login handled with 400 & CORS)
  await check('Auth Login Flow', async () => {
    const r = await fetch(baseUrl + '/api/user/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ email: 'nonexistent_test_user@fastbite.com', password: 'wrongpassword' })
    });
    const d = await r.json();
    if (r.status !== 400 || d.success !== false) throw new Error('Unexpected login behavior: ' + JSON.stringify(d));
    return { status: r.status, message: d.message };
  });

  // 7. Restaurant Resolution (Public Storefront Slug)
  await check('Restaurant Storefront Resolution', async () => {
    const r = await fetch(baseUrl + '/api/restaurant/slug/fastbite');
    const d = await r.json();
    if (!d.success) throw new Error(d.message || 'Restaurant not found');
    return { id: d.data.id, name: d.data.name, slug: d.data.slug, status: d.data.status };
  });

  console.log('\n========================================');
  const allPassed = results.every((r) => r.status === 'PASS');
  console.log(allPassed ? '🎉 ALL 7 SUBSYSTEM CHECKS PASSED!' : '⚠️ SOME CHECKS FAILED');
  console.log('========================================\n');
  process.exit(allPassed ? 0 : 1);
}

runTests();
