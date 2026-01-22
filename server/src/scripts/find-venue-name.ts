
import venues from '../data/venues_master.json';

const query = process.argv[2] || '4th';

const matches = (venues as any[]).filter(v =>
  v.name.toLowerCase().includes(query.toLowerCase()) ||
  v.id.includes(query.toLowerCase())
);

console.log(`Found ${matches.length} matches for "${query}":`);
matches.forEach(v => {
  console.log(`- [${v.id}] ${v.name} (Address: ${v.address})`);
});
