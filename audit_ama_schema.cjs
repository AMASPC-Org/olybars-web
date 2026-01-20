const { Firestore } = require('@google-cloud/firestore');
const projectId = process.env.AMA_PROJECT_ID; 

if (!projectId) {
  console.error('ERROR: AMA_PROJECT_ID env var is missing.');
  process.exit(1);
}

const firestore = new Firestore({ projectId: projectId });

async function audit() {
  console.log('--- AUDITING SCHEMA FOR: ' + projectId + ' ---');
  try {
    const collections = await firestore.listCollections();
    if (collections.length === 0) {
      console.log('No collections found (or permission denied).');
      return;
    }

    for (const col of collections) {
      console.log('\n[COLLECTION]: ' + col.id);
      const snapshot = await col.limit(1).get();
      if (snapshot.empty) {
        console.log('  (Empty)');
      } else {
        snapshot.forEach(doc => {
          console.log('  SAMPLE DOC (' + doc.id + '):');
          console.log(JSON.stringify(doc.data(), null, 2));
        });
      }
    }
  } catch (err) {
    console.error('CRITICAL ERROR:', err.message);
  }
}

audit();
