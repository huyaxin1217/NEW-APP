const fs = require("fs");
const dict = require("cmu-pronouncing-dictionary").dictionary;
const { toIPA } = require("arpabet-and-ipa-convertor-ts");

function processFile(filename, bookName, limit) {
  const data = JSON.parse(fs.readFileSync(filename));
  return data.slice(0, limit).map(item => {
    let arpabet = dict[item.word.toLowerCase()];
    let phonetic = item.phonetic || "";
    if (!phonetic && arpabet) {
      try {
        phonetic = "/" + toIPA(arpabet) + "/";
      } catch(e) {}
    }
    
    const defs = item.translations ? item.translations.map(t => `${t.type ? t.type + '.' : ''}${t.translation}`).join('；') : '';
    let exampleEn = '';
    let exampleZh = '';
    if (item.phrases && item.phrases.length > 0) {
      exampleEn = item.phrases[0].phrase;
      exampleZh = item.phrases[0].translation;
    }
    
    return {
      english: item.word,
      phonetic: phonetic,
      definition: defs,
      exampleEn: exampleEn,
      exampleZh: exampleZh,
      book: bookName
    };
  });
}

// Full lists are big, let's keep it to 2000 for each to avoid 20MB file.
const cet4Words = processFile("cet4.json", "CET4", 2000);
const cet6Words = processFile("cet6.json", "CET6", 2000);
const allWords = [...cet4Words, ...cet6Words];

let output = "export const initialWords = " + JSON.stringify(allWords, null, 2) + ";\n";
fs.writeFileSync("src/data/words.ts", output);
console.log(`Generated ${allWords.length} words.`);
