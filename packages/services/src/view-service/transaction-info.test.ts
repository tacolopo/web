import {
  TransactionInfo,
  TransactionInfoRequest,
  TransactionInfoResponse,
} from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/view/v1/view_pb';
import { createContextValues, createHandlerContext, HandlerContext } from '@connectrpc/connect';
import { ViewService } from '@penumbra-zone/protobuf';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { DatabaseCtx, dbCtx } from '../ctx/database';
import { fvkCtx } from '../ctx/full-viewing-key';
import { mockIndexedDb, testFullViewingKey } from '../test-utils';
import { transactionInfo } from './transaction-info';

const mockTransactionInfo = vi.hoisted(() => vi.fn());
vi.mock('@penumbra-zone/wasm/transaction', () => ({
  generateTransactionInfo: mockTransactionInfo,
}));

describe('TransactionInfo request handler', () => {
  let mockCtx: HandlerContext;
  let req: TransactionInfoRequest;

  beforeEach(() => {
    vi.resetAllMocks();

    mockCtx = createHandlerContext({
      service: ViewService,
      method: ViewService.methods.transactionInfo,
      protocolName: 'mock',
      requestMethod: 'MOCK',
      url: '/mock',
      contextValues: createContextValues()
        .set(dbCtx, () => Promise.resolve(mockIndexedDb as unknown as DatabaseCtx))
        .set(fvkCtx, () => Promise.resolve(testFullViewingKey)),
    });

    mockIndexedDb.iterateTransactionInfo.mockImplementation(async function* () {
      yield* await Promise.resolve(testData);
    });

    mockTransactionInfo.mockReturnValue({
      txp: {},
      txv: {},
    });

    req = new TransactionInfoRequest();
  });

  test('should get all transactions if startHeight and endHeight are not set in request', async () => {
    const responses: TransactionInfoResponse[] = [];
    for await (const res of transactionInfo(req, mockCtx)) {
      responses.push(new TransactionInfoResponse(res));
    }
    expect(responses.length).toBe(4);
  });

  test('should get only transactions whose height is not greater than endHeight', async () => {
    const responses: TransactionInfoResponse[] = [];
    req.endHeight = 2525n;
    for await (const res of transactionInfo(req, mockCtx)) {
      responses.push(new TransactionInfoResponse(res));
    }
    expect(responses.length).toBe(3);
  });

  test('should receive only transactions whose height is not less than startHeight', async () => {
    const responses: TransactionInfoResponse[] = [];
    req.startHeight = 2525n;
    for await (const res of transactionInfo(req, mockCtx)) {
      responses.push(new TransactionInfoResponse(res));
    }
    expect(responses.length).toBe(2);
  });

  test('should receive only transactions whose height is between startHeight and endHeight inclusive', async () => {
    const responses: TransactionInfoResponse[] = [];
    req.startHeight = 998n;
    req.endHeight = 2525n;
    for await (const res of transactionInfo(req, mockCtx)) {
      responses.push(new TransactionInfoResponse(res));
    }
    expect(responses.length).toBe(2);
  });
});

const testData: TransactionInfo[] = [
  TransactionInfo.fromJson({
    height: '222',
    id: {
      inner: '1MI8IG5D3MQj3s1j0MXTwCQtAaVbwTlPkW8Qdz1EVIo=',
    },
    transaction: {},
  }),
  TransactionInfo.fromJson({
    height: '1000',
    id: {
      inner: '2MI8IG5D3MQj3s1j0MXTwCQtAaVbwTlPkW8Qdz1EVIo=',
    },
    transaction: {},
  }),
  TransactionInfo.fromJson({
    height: '2525',
    id: {
      inner: '3MI8IG5D3MQj3s1j0MXTwCQtAaVbwTlPkW8Qdz1EVIo=',
    },
    transaction: {},
  }),
  TransactionInfo.fromJson({
    height: '12255',
    id: {
      inner: '4MI8IG5D3MQj3s1j0MXTwCQtAaVbwTlPkW8Qdz1EVIo=',
    },
    transaction: {},
  }),
];
