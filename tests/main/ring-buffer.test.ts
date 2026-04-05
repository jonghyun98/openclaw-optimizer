import { describe, it, expect } from 'vitest';
import { RingBuffer } from '../../src/main/metrics/ring-buffer';

describe('RingBuffer', () => {
  it('stores and retrieves items', () => {
    const buf = new RingBuffer<number>(5);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    expect(buf.toArray()).toEqual([1, 2, 3]);
    expect(buf.count).toBe(3);
  });

  it('overwrites oldest items when full', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    buf.push(4);
    buf.push(5);
    expect(buf.toArray()).toEqual([3, 4, 5]);
    expect(buf.count).toBe(3);
  });

  it('returns latest N items', () => {
    const buf = new RingBuffer<number>(10);
    for (let i = 1; i <= 8; i++) buf.push(i);
    expect(buf.latest(3)).toEqual([6, 7, 8]);
  });

  it('clears correctly', () => {
    const buf = new RingBuffer<number>(5);
    buf.push(1);
    buf.push(2);
    buf.clear();
    expect(buf.count).toBe(0);
    expect(buf.toArray()).toEqual([]);
  });

  it('handles empty buffer', () => {
    const buf = new RingBuffer<string>(3);
    expect(buf.toArray()).toEqual([]);
    expect(buf.count).toBe(0);
    expect(buf.latest(5)).toEqual([]);
  });
});
