// Test apakah Supabase bisa diakses dari luar
const supabaseUrl = 'https://gxunsxsmtusncztjkezt.supabase.co';

// Test REST API
try {
  const res = await fetch(`${supabaseUrl}/rest/v1/portfolio_state?limit=1`, {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dW5zeHNtdHVzbmN6dGprZXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzIxNjYsImV4cCI6MjEwNTY0ODE2Nn0.ZyGksMox_Uo6lOfQo9GIrAYzuNx_nBx7abaUSSNl2k8',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dW5zeHNtdHVzbmN6dGprZXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzIxNjYsImV4cCI6MjEwNTY0ODE2Nn0.ZyGksMox_Uo6lOfQo9GIrAYzuNx_nBx7abaUSSNl2k8'
    }
  });
  const data = await res.text();
  console.log('Supabase REST status:', res.status);
  console.log('Data:', data.slice(0, 300));
} catch (e) {
  console.error('Supabase REST error:', e.message);
}

// Test RPC
try {
  const res2 = await fetch(`${supabaseUrl}/rest/v1/rpc/portfolio_read`, {
    method: 'POST',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dW5zeHNtdHVzbmN6dGprZXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzIxNjYsImV4cCI6MjEwNTY0ODE2Nn0.ZyGksMox_Uo6lOfQo9GIrAYzuNx_nBx7abaUSSNl2k8',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dW5zeHNtdHVzbmN6dGprZXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzIxNjYsImV4cCI6MjEwNTY0ODE2Nn0.ZyGksMox_Uo6lOfQo9GIrAYzuNx_nBx7abaUSSNl2k8',
      'Content-Type': 'application/json'
    },
    body: '{}'
  });
  const data2 = await res2.text();
  console.log('\nSupabase RPC status:', res2.status);
  console.log('RPC Data:', data2.slice(0, 500));
} catch (e) {
  console.error('Supabase RPC error:', e.message);
}
