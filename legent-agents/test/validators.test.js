import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidIco, isValidCzDic, isValidCzAccount, isValidIban, parseCzAccount } from '../src/validators/cz.js';

test('IČO: kontrolní číslice', () => {
  assert.equal(isValidIco('00006947'), true); // Ministerstvo financí (veřejně známé IČO)
  assert.equal(isValidIco('12345679'), true);
  assert.equal(isValidIco('12345678'), false);
  assert.equal(isValidIco('1234567'), false);
  assert.equal(isValidIco(null), false);
});

test('DIČ: formát CZ + 8–10 číslic', () => {
  assert.equal(isValidCzDic('CZ12345679'), true);
  assert.equal(isValidCzDic('cz 12345679'), true);
  assert.equal(isValidCzDic('SK1234567'), false);
});

test('Český účet: formát a modulo 11', () => {
  assert.deepEqual(parseCzAccount('19-2000145399/0800'), { prefix: '19', number: '2000145399', bankCode: '0800' });
  assert.equal(isValidCzAccount('2001234561/2010'), true);
  assert.equal(isValidCzAccount('2001234562/2010'), false);
  assert.equal(isValidCzAccount('abc/0100'), false);
});

test('IBAN: modulo 97', () => {
  assert.equal(isValidIban('GB82 WEST 1234 5698 7654 32'), true); // ukázkový IBAN z normy
  assert.equal(isValidIban('GB82 WEST 1234 5698 7654 33'), false);
});
