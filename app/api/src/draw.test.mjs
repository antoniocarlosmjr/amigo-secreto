import { test } from 'node:test';
import assert from 'node:assert/strict';
import { drawAssignments } from './draw.ts';

test('3 a 50: bijeção sem autoatribuição', () => {
  for (const n of [3, 4, 10, 50]) for (let attempt = 0; attempt < 100; attempt++) {
    const result = drawAssignments(n);
    assert.ok(result);
    assert.equal(new Set(result).size, n);
    for (let i = 0; i < n; i++) assert.notEqual(result[i], i);
  }
});
test('restrições mútuas são respeitadas', () => {
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = drawAssignments(6, [[0,1],[2,3]]);
    assert.ok(result);
    assert.notEqual(result[0], 1); assert.notEqual(result[1], 0);
    assert.notEqual(result[2], 3); assert.notEqual(result[3], 2);
  }
});
test('restrições impossíveis retornam null', () => {
  assert.equal(drawAssignments(3, [[0,1],[0,2]]), null);
});
test('valida entradas', () => {
  assert.throws(() => drawAssignments(2), RangeError);
  assert.throws(() => drawAssignments(3, [[0,3]]), RangeError);
});
