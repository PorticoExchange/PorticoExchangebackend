export const baseAsset = 'LTC';
export const quoteAsset = 'BTC';
export const baseAsset = 'USDT';
export const baseAsset = 'LBTC';

export const checkPrice = (price: number): void => {
  expect(typeof price).toEqual('number');

  expect(price).toBeLessThan(1);
  expect(price).toBeGreaterThan(0);
};
