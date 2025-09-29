// Test API response directly
const BASE_URL = 'https://app.changeworksfund.org';

async function testAPIResponse() {
  console.log('🧪 TESTING API RESPONSE DIRECTLY');
  console.log('=' .repeat(50));

  try {
    const sessionId = 'cs_test_a1y9LUEOvmCCv3LE0LMg2yKHqxr2SxPeRvZ0a78MFua0G6rtkD2Qspqozu';
    
    console.log(`Testing with session ID: ${sessionId}`);
    console.log('');

    const response = await fetch(`${BASE_URL}/api/subscriptions/verify-success`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    console.log('');

    const text = await response.text();
    console.log('Raw response text:');
    console.log(text);
    console.log('');

    try {
      const json = JSON.parse(text);
      console.log('Parsed JSON:');
      console.log(JSON.stringify(json, null, 2));
    } catch (parseError) {
      console.log('JSON parse error:', parseError.message);
    }

  } catch (error) {
    console.log('Error:', error.message);
  }
}

testAPIResponse();
