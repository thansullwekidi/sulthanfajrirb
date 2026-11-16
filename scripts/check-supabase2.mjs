// Cek apakah Supabase bisa dipanggil dengan service_role key
// (Verifikasi bahwa key yang ada di Vercel benar)
const supabaseUrl = 'https://gxunsxsmtusncztjkezt.supabase.co';

// Test dengan anon key terlebih dahulu - apakah RLS sudah beres
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4dW5zeHNtdHVzbmN6dGprZXp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwNzIxNjYsImV4cCI6MjEwNTY0ODE2Nn0.ZyGksMox_Uo6lOfQo9GIrAYzuNx_nBx7abaUSSNl2k8';

const res = await fetch(`${supabaseUrl}/rest/v1/rpc/portfolio_read`, {
  method: 'POST',
  headers: {
    'apikey': anonKey,
    'Authorization': `Bearer ${anonKey}`,
    'Content-Type': 'application/json'
  },
  body: '{}'
});
console.log('RPC with anon key - Status:', res.status);
const data = await res.text();
console.log('Response:', data.slice(0, 500));
