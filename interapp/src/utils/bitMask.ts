type BitMask = number;

export function setBit(mask: BitMask, bit: number): BitMask {
  return mask | (1 << bit);
}

export function hasBit(mask: BitMask, bit: number): boolean {
  return (mask & (1 << bit)) !== 0;
}

export function clearBit(mask: BitMask, bit: number): BitMask {
  return mask & ~(1 << bit);
}
