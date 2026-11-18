// Ambil data langsung dari Supabase untuk lihat apa yang ada
const supabaseUrl = 'https://gxunsxsmtusncztjkezt.supabase.co';
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

const data = await res.json();
const payload = data[0]?.payload;

if (payload) {
  console.log('=== DATA DI SUPABASE ===');
  console.log('Revision:', data[0]?.revision);
  console.log('\nExperiences (' + payload.experiences?.length + '):');
  payload.experiences?.forEach(e => console.log(' -', e.type, '|', e.role, '@', e.organization));
  
  console.log('\nSkills (' + payload.skills?.length + '):');
  payload.skills?.forEach(s => console.log(' -', s.category, '|', s.name, s.level + '%'));
  
  console.log('\nArticles (' + payload.articles?.length + '):');
  payload.articles?.forEach(a => console.log(' -', a.status, '|', a.title));
  
  console.log('\nSocialLinks (' + payload.socialLinks?.length + '):');
  payload.socialLinks?.forEach(s => console.log(' -', s.label, '|', s.url));

  console.log('\nSiteConfig.fullName:', payload.siteConfig?.fullName);
  console.log('SiteConfig.headline:', payload.siteConfig?.headline);
} else {
  console.log('NO DATA:', JSON.stringify(data).slice(0,300));
}
