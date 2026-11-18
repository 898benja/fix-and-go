import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source = readFileSync(new URL('../src/pdf-base64.ts', import.meta.url), 'utf8');
const js = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText;
const {pdfBase64} = await import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);

test('web PDF data URL preserves exact document bytes without its prefix', () => {
  const pdf = Buffer.from('%PDF-1.4\n' + 'A'.repeat(120) + '\n%%EOF');
  const encoded = pdf.toString('base64');
  assert.deepEqual(Buffer.from(pdfBase64(`data:application/pdf;base64,${encoded}`), 'base64'), pdf);
  assert.equal(pdfBase64(`data:application/octet-stream;base64,${encoded}`), encoded);
});
test('native raw Base64 is unchanged', () => {
  const encoded = Buffer.from('%PDF-1.4\n').toString('base64');
  assert.equal(pdfBase64(encoded), encoded);
});
test('missing, malformed and non-Base64 inputs are rejected', () => {
  for (const value of [undefined, '', 'data:application/pdf,hello', 'data:application/pdf;base64,', '%%%!', 'abc']) {
    assert.throws(() => pdfBase64(value));
  }
});
test('3 MB boundary uses decoded size and rejects even one extra byte', () => {
  const exact = Buffer.alloc(3 * 1024 * 1024).toString('base64');
  assert.equal(pdfBase64(`data:application/pdf;base64,${exact}`), exact);
  assert.throws(() => pdfBase64(Buffer.alloc(3 * 1024 * 1024 + 1).toString('base64')), /3 MB/);
});
