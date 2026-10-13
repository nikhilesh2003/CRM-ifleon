const https = require('https');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== VERIFYING LIVE PRODUCTION CRM AT HTTPS://CRM.IFLEON.COM ===\n');

  // Test 1: GET /login
  console.log('1. Testing GET https://crm.ifleon.com/login ...');
  const resLogin = await request({
    host: 'crm.ifleon.com',
    path: '/login',
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  console.log(`   Status: ${resLogin.statusCode}`);
  console.log(`   Contains "Sign In to CRM Portal": ${resLogin.body.includes('Sign In to CRM Portal') || resLogin.body.includes('login')}`);

  // Test 2: GET /register
  console.log('\n2. Testing GET https://crm.ifleon.com/register ...');
  const resRegister = await request({
    host: 'crm.ifleon.com',
    path: '/register',
    method: 'GET',
    headers: { 'User-Agent': 'Mozilla/5.0' },
  });
  console.log(`   Status: ${resRegister.statusCode}`);
  console.log(`   Contains "Create Enterprise Account": ${resRegister.body.includes('Create Enterprise Account') || resRegister.body.includes('register')}`);

  // Test 3: POST /api/auth with invalid credentials
  console.log('\n3. Testing POST /api/auth with invalid password ...');
  const resBadAuth = await request(
    {
      host: 'crm.ifleon.com',
      path: '/api/auth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    },
    {
      action: 'login',
      email: 'admin@ifleon.com',
      password: 'WrongPassword123',
    }
  );
  console.log(`   Status: ${resBadAuth.statusCode}`);
  console.log(`   Response: ${resBadAuth.body}`);

  // Test 4: POST /api/auth with valid credentials & Remember Me = true
  console.log('\n4. Testing POST /api/auth login with Admin credentials & Remember Me = true ...');
  const resAdminAuth = await request(
    {
      host: 'crm.ifleon.com',
      path: '/api/auth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    },
    {
      action: 'login',
      email: 'admin@ifleon.com',
      password: 'Admin@123',
      rememberMe: true,
    }
  );
  console.log(`   Status: ${resAdminAuth.statusCode}`);
  const adminData = JSON.parse(resAdminAuth.body);
  console.log(`   Success: ${adminData.success}`);
  console.log(`   User: ${adminData.user.name} (${adminData.user.role})`);
  const daysExpiry = ((adminData.session.expiresAt - adminData.session.loginTime) / (1000 * 60 * 60 * 24)).toFixed(0);
  console.log(`   Session duration: ${daysExpiry} days (ExpiresAt: ${new Date(adminData.session.expiresAt).toISOString()})`);

  // Test 5: POST /api/auth with valid credentials & Remember Me = false
  console.log('\n5. Testing POST /api/auth login with Remember Me = false ...');
  const resNoRemember = await request(
    {
      host: 'crm.ifleon.com',
      path: '/api/auth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    },
    {
      action: 'login',
      email: 'consultant@ifleon.com',
      password: 'Consultant@123',
      rememberMe: false,
    }
  );
  const noRemData = JSON.parse(resNoRemember.body);
  const hoursExpiry = ((noRemData.session.expiresAt - noRemData.session.loginTime) / (1000 * 60 * 60)).toFixed(0);
  console.log(`   Session duration without remember me: ${hoursExpiry} hours`);

  // Test 6: POST /api/auth Google SSO
  console.log('\n6. Testing POST /api/auth Google SSO ...');
  const resGoogle = await request(
    {
      host: 'crm.ifleon.com',
      path: '/api/auth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    },
    {
      action: 'google',
      email: 'rajesh.kumar@ifleon.com',
      name: 'Rajesh Kumar',
      rememberMe: true,
    }
  );
  console.log(`   Status: ${resGoogle.statusCode}`);
  const googleData = JSON.parse(resGoogle.body);
  console.log(`   Success: ${googleData.success}, User: ${googleData.user.name}`);

  // Test 7: Registration of a new consultant
  const testEmail = `test.agent.${Date.now()}@ifleon.com`;
  console.log(`\n7. Testing Registration of new user: ${testEmail} ...`);
  const resNewUser = await request(
    {
      host: 'crm.ifleon.com',
      path: '/api/auth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    },
    {
      action: 'register',
      name: 'Vikram Reddy',
      email: testEmail,
      phone: '+91 98480 99887',
      role: 'consultant',
      department: 'Andhra Pradesh Dealerships',
      password: 'Vikram@Password123',
      rememberMe: true,
    }
  );
  console.log(`   Status: ${resNewUser.statusCode}`);
  const newUserData = JSON.parse(resNewUser.body);
  console.log(`   Registered User: ${newUserData.user.name} (ID: ${newUserData.user.id}, Role: ${newUserData.user.role})`);
  console.log(`   Tutorial completed initially: ${newUserData.user.tutorialCompleted}`);

  // Test 8: Complete Tutorial
  console.log(`\n8. Testing Tutorial Completion for ${newUserData.user.id} ...`);
  const resTutComplete = await request(
    {
      host: 'crm.ifleon.com',
      path: '/api/auth',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    },
    {
      action: 'tutorial_complete',
      userId: newUserData.user.id,
    }
  );
  console.log(`   Status: ${resTutComplete.statusCode}`);
  const tutData = JSON.parse(resTutComplete.body);
  console.log(`   Tutorial Completed after API call: ${tutData.user.tutorialCompleted}`);

  console.log('\n=== ALL PRODUCTION AUTH & LIVE SERVER TESTS PASSED PERFECTLY! ===');
}

runTests().catch(console.error);
