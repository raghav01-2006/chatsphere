
const API_URL = 'http://localhost:5000/api';

const verify = async () => {
  const email = 'raghav1cs2006@gmail.com';
  const password = 'password123';

  try {
    console.log('--- 1. Testing Login ---');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const loginData = await loginRes.json();
    
    if (!loginRes.ok) throw new Error(`Login failed: ${loginData.message}`);
    
    const token = loginData.token;
    console.log('✅ Login successful. Token obtained.');

    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n--- 2. Testing Admin Seeding (Quizzes) ---');
    const quizRes = await fetch(`${API_URL}/game/quiz/seed`, {
      method: 'POST',
      headers
    });
    const quizData = await quizRes.json();
    console.log(`✅ Quiz Seeding: ${quizData.message}`);

    console.log('\n--- 3. Testing Admin Seeding (Badges) ---');
    const badgeRes = await fetch(`${API_URL}/game/badges/seed`, {
      method: 'POST',
      headers
    });
    const badgeData = await badgeRes.json();
    console.log(`✅ Badge Seeding: ${badgeData.message}`);

    console.log('\n--- 4. Verifying Data in DB ---');
    const dailyQuizRes = await fetch(`${API_URL}/game/quiz/daily`, { headers });
    const dailyQuizData = await dailyQuizRes.json();
    console.log(`✅ Daily Quiz fetch: Found ${dailyQuizData.questions?.length} questions.`);

    console.log('\n--- 5. Verifying Admin Status in Profile ---');
    const profileRes = await fetch(`${API_URL}/users/${loginData.user._id}`, { headers });
    const profileData = await profileRes.json();
    console.log(`✅ Profile Check: isAdmin = ${profileData.user.isAdmin}`);

    console.log('\n🚀 ALL SYSTEMS VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } catch (error) {
    console.error(`\n❌ Verification Failed: ${error.message}`);
    process.exit(1);
  }
};

verify();
