import ModuleIndex from '../src/ModuleIndex';

const fs = require('fs');

test('JSON serialization', () => {
  const filename = './data/KJV.zip';
  const contents = fs.readFileSync(filename);
  const fileIndex = ModuleIndex.fromNodeBuffer(contents);
  const json = fileIndex.serializeAsJson();
  const jsonString = JSON.stringify(json);
  const jsonObject = JSON.parse(jsonString);
  const restoredFileIndex = ModuleIndex.fromSerializedJson(jsonObject);
  expect(JSON.stringify(fileIndex)).toBe(JSON.stringify(restoredFileIndex));
});
