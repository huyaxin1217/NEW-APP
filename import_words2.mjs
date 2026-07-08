import { initializeApp } from "firebase/app";
import { getFirestore, collection, writeBatch, doc } from "firebase/firestore";
import fs from "fs";

const text = fs.readFileSync('words_part2.txt', 'utf-8');
const lines = text.split('\n');
const words = [];
for (let line of lines) {
    line = line.trim();
    if (!line) continue;
    const parts = line.split(/\s(?=[a-zA-Z\-]+\s+[a-z&\.]+\.)/g);
    for (const part of parts) {
        const match = part.trim().match(/^([a-zA-Z\-]+)\s+(.+)$/);
        if (match) {
            words.push({
                english: match[1],
                definition: match[2],
                book: 'CET6'
            });
        }
    }
}

const config = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function upload() {
    console.log(`Parsed ${words.length} words.`);
    let batch = writeBatch(db);
    let count = 0;
    
    for (const word of words) {
        const newDocRef = doc(collection(db, "words"));
        batch.set(newDocRef, {
            ...word,
            id: newDocRef.id
        });
        count++;
        if (count % 400 === 0) {
            await batch.commit();
            batch = writeBatch(db);
        }
    }
    if (count % 400 !== 0) {
        await batch.commit();
    }
    console.log(`Successfully uploaded ${count} words.`);
    process.exit(0);
}

upload().catch(err => {
    console.error(err);
    process.exit(1);
});
