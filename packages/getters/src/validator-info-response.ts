import { ValidatorInfoResponse } from '@penumbra-zone/protobuf/types';
import { createGetter } from './utils/create-getter.js';
import { getIdentityKeyFromValidatorInfo, getRateData } from './validator-info.js';
import { getValidatorExchangeRate } from './rate-data.js';

export const getValidatorInfo = createGetter(
  (validatorInfoResponse?: ValidatorInfoResponse) => validatorInfoResponse?.validatorInfo,
);

export const getExchangeRateFromValidatorInfoResponse = getValidatorInfo
  .pipe(getRateData)
  .pipe(getValidatorExchangeRate);

export const getIdentityKeyFromValidatorInfoResponse = getValidatorInfo.pipe(
  getIdentityKeyFromValidatorInfo,
);
