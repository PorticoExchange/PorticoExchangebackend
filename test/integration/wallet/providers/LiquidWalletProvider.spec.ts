import { Transaction } from 'bitcoinjs-lib';
import Logger from '../../../../lib/Logger';
import { bitcoinClient } from '../../Nodes';
import CoreWalletProvider from '../../../../lib/wallet/providers/CoreWalletProvider';
import { SentTransaction } from '../../../../lib/wallet/providers/WalletProviderInterface';
import { networks } from 'bitcoinjs-lib';
import { networks as lqnetworks } from 'liquidjs-lib';

const testAddress = 'tlq1qq2g4a757szepagfdvlnukt3cyacfkhz2dfhd6yzqtlpzkpweckjxaj4hjwnhuawmt4gd3d8z7u2fkl5han2cct626dpy6r0n6';

describe('LiquidWalletProvider', () => {
  const provider = new CoreWalletProvider(Logger.disabledLogger, bitcoinClient);

  const verifySentTransaction = async (sentTransaction: SentTransaction, destination: string, amount: number, isSweep: boolean) => {
    const rawTransaction = await bitcoinClient.getRawTransactionVerbose(sentTransaction.transactionId);

    expect(sentTransaction.transactionId).toEqual(rawTransaction.txid);
    expect(sentTransaction.transactionId).toEqual(sentTransaction.transaction!.getId());
    expect(sentTransaction.transaction).toEqual(Transaction.fromHex(rawTransaction.hex));

    expect(rawTransaction.vout[sentTransaction.vout!].scriptPubKey.addresses).toEqual(undefined);
    expect(rawTransaction.vout[sentTransaction.vout!].scriptPubKey.address).toEqual(destination);

    const expectedAmount = isSweep ? Math.round(amount - sentTransaction.fee!) : amount;
    expect(sentTransaction.transaction!.outs[sentTransaction.vout!].value).toEqual(expectedAmount);

    let outputSum = 0;

    for (const vout of sentTransaction.transaction!.outs) {
      outputSum += vout.value;
    }

    let inputSum = 0;

    for (const vin of rawTransaction.vin) {
      const inputTransaction = Transaction.fromHex(await bitcoinClient.getRawTransaction(vin.txid));
      inputSum += inputTransaction.outs[vin.vout].value;
    }

    expect(sentTransaction.fee).toEqual(inputSum - outputSum);
  };

  beforeEach(async () => {
    await bitcoinClient.generate(1);
  });

  it('should generate addresses', async () => {
    expect((await provider.getAddress()).startsWith('bcrt1')).toEqual(true);
  });

  it('should get balance', async () => {
    const balance = await provider.getBalance();

    expect(balance.confirmedBalance).toBeGreaterThan(0);
    expect(balance.totalBalance).toEqual(balance.confirmedBalance + balance.unconfirmedBalance);
  });

  it('should send transactions', async () => {
    const amount = 212121;
    const sentTransaction = await provider.sendToAddress(testAddress, amount);

    await verifySentTransaction(sentTransaction, testAddress, amount, false);
  });

  it('should sweep the wallet', async () => {
    const balance = await provider.getBalance();
    const sentTransaction = await provider.sweepWallet(testAddress);

    await verifySentTransaction(sentTransaction, testAddress, balance.confirmedBalance, true);

    expect((await provider.getBalance()).confirmedBalance).toEqual(0);
  });
});
