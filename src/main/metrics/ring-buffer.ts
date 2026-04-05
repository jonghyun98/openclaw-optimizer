export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private head = 0;
  private _count = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this._count < this.capacity) this._count++;
  }

  get count(): number {
    return this._count;
  }

  toArray(): T[] {
    if (this._count === 0) return [];
    if (this._count < this.capacity) {
      return this.buffer.slice(0, this._count) as T[];
    }
    return [
      ...this.buffer.slice(this.head),
      ...this.buffer.slice(0, this.head),
    ] as T[];
  }

  latest(n: number): T[] {
    const arr = this.toArray();
    return arr.slice(-n);
  }

  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this._count = 0;
  }
}
