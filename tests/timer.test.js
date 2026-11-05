import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTimer, formatClock } from '../js/timer.js';

function fakeClock() {
  let t = 0;
  return { now: () => t, advance: ms => { t += ms; } };
}

test('the timer does not run before start', () => {
  const clock = fakeClock();
  const timer = createTimer(1000, clock.now);
  clock.advance(500);
  assert.equal(timer.remaining(), 1000);
  assert.equal(timer.isRunning(), false);
});

test('the timer counts down and stops at zero', () => {
  const clock = fakeClock();
  const timer = createTimer(1000, clock.now);
  timer.start();
  clock.advance(400);
  assert.equal(timer.remaining(), 600);
  clock.advance(5000);
  assert.equal(timer.remaining(), 0);
});

test('pause freezes the remaining time', () => {
  const clock = fakeClock();
  const timer = createTimer(1000, clock.now);
  timer.start();
  clock.advance(300);
  timer.pause();
  clock.advance(10_000);
  assert.equal(timer.remaining(), 700);
  timer.start();
  clock.advance(200);
  assert.equal(timer.remaining(), 500);
});

test('a penalty takes time off, running or not', () => {
  const clock = fakeClock();
  const timer = createTimer(60_000, clock.now);
  timer.penalize(10_000);
  assert.equal(timer.remaining(), 50_000);
  timer.start();
  clock.advance(1000);
  timer.penalize(5000);
  assert.equal(timer.remaining(), 44_000);
});

test('formatClock shows minutes and seconds, rounded up', () => {
  assert.equal(formatClock(20 * 60_000), '20:00');
  assert.equal(formatClock(61_500), '01:02');
  assert.equal(formatClock(1), '00:01');
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(-5), '00:00');
});
