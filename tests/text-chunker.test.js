/**
 * Su_AdBlock Tests - Text Chunker
 */

const assert = require('assert');
const { TextChunker } = require('../translator/text-chunker');

function runTest() {
  console.log('--- Testing Text Chunker ---');

  // Test 1: Empty and short text
  assert.deepStrictEqual(TextChunker.chunk(''), []);
  assert.deepStrictEqual(TextChunker.chunk('   '), []);

  const shortText = 'Hello world.';
  const res1 = TextChunker.chunk(shortText, 200);
  assert.strictEqual(res1.length, 1);
  assert.strictEqual(res1[0].text, 'Hello world.');

  // Test 2: Paragraph preservation
  const multiPara = 'First paragraph here.\n\nSecond paragraph here.';
  const res2 = TextChunker.chunk(multiPara, 200);
  assert.strictEqual(res2.length, 2);
  assert.strictEqual(res2[0].isParagraphBreak, true);
  assert.strictEqual(res2[1].isParagraphBreak, false);

  // Test 3: Sentence splitting under maxChunkSize
  const longSentence = 'The quick brown fox jumps over the lazy dog. A second sentence follows closely behind. Another one comes after that.';
  const res3 = TextChunker.chunk(longSentence, 50);
  assert(res3.length >= 2, 'Should be split into multiple chunks');
  for (const c of res3) {
    assert(c.text.length <= 60, `Chunk too long: ${c.text.length}`);
  }

  console.log('✓ Text Chunker tests passed.');
}

if (require.main === module) {
  runTest();
}

module.exports = { runTest };
