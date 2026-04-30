/** 上衣尺寸預設：10 ~ 24（含 0.5），整數顯示為整數，半號顯示為一位小數 */
export function defaultTopSizes(): string[] {
  const out: string[] = [];
  for (let v = 10; v <= 24 + 1e-9; v += 0.5) {
    const rounded = Math.round(v * 10) / 10;
    out.push(Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1));
  }
  return out;
}
