/* eslint-disable @typescript-eslint/no-dynamic-delete */
/* eslint-disable @typescript-eslint/dot-notation */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-useless-template-literals */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

//const fs = require('fs');
//const { mkdirpSync } = require('mkdirp');
//const glob = require('glob').sync;
//const path = require('path');

import fs from 'fs';
import { mkdirpSync } from 'mkdirp';
import { sync as glob } from 'glob';
import path from 'path';
import sharp from 'sharp';

const __dirname = import.meta.dirname;

const replace = new Map<string, string>();

const resizeImg = async (imageUri: string) => {
  try {
    const localPath = path.resolve(
      imageUri.replace(
        'https://raw.githubusercontent.com/cosmos/chain-registry/master/',
        path.join(__dirname, '../chain-registry/'),
      ),
    );
    const sharp128 = sharp(localPath).resize(128, 128, { fit: 'inside' });
    const data = await sharp128.png().toBuffer();
    return `data:image/png;base64,${data.toString('base64')}`;
  } catch (error) {
    return undefined;
  }
};

// eslint-disable-next-line @typescript-eslint/array-type
const data128png = async (imageUris: Array<string>) => {
  const already = imageUris.map(u => replace.get(u));
  const preferred =
    already.find(a => a) ??
    (await (async () => {
      const attemptResize = await Promise.allSettled(imageUris.map(resizeImg));
      const results = attemptResize.map(r => r.status === 'fulfilled' && r.value);
      const success = results.find(Boolean);
      if (!success) console.log('failed', ...imageUris);
      return success;
    })());
  if (preferred && !already.every(Boolean)) imageUris.map(u => replace.set(u, preferred));
  return preferred;
};

export type JsonValue =
  | number
  | string
  | boolean
  | null
  | {
      [k: string]: JsonValue;
    }
  | JsonValue[];

const replaceUrisInJson = async (obj: JsonValue) => {
  // eslint-disable-next-line @typescript-eslint/no-array-constructor
  const stack = new Array();
  stack.push(obj);
  while (stack.length) {
    const current = stack.pop();
    if (current && typeof current === 'object') {
      if ('png' in current || 'svg' in current || 'jpeg' in current) {
        const prefer = [...[current['png'], current['svg'], current['jpeg']].filter(Boolean)];
        delete current['jpeg'];
        delete current['svg'];
        current['png'] = await data128png(prefer as string[]);
      }
      for (const key in current) if (typeof current[key] === 'object') stack.push(current[key]);
    }
  }
};

const NON_COSMOS_NETWORK_TYPE = 'noncosmos';

const getValidVarName = varName => {
  if (!/^[a-zA-Z_$]/.test(varName)) {
    return `_${varName}`;
  }

  return varName;
};

const write = async (filePath, json, TypeName, isArray = false) => {
  await replaceUrisInJson(json);
  const strfy = JSON.stringify(json, null, 2);
  const exportType = isArray ? TypeName + '[]' : TypeName;
  fs.writeFileSync(
    filePath,
    `import { ${TypeName} } from '@chain-registry/types';
const info: ${exportType} = ${strfy};
export default info;`,
  );
};

const writeChainIndex = (filePath, chainObj) => {
  fs.writeFileSync(
    filePath,
    `${
      chainObj.assets
        ? `import _assets from './assets';
`
        : ''
    }${
      chainObj.chain
        ? `import _chain from './chain';
`
        : ''
    }${
      chainObj.ibc
        ? `import _ibc from './ibc';
`
        : ''
    }${
      chainObj.ibc_chain1
        ? `import _ibc_chain1 from './ibc_chain1';
`
        : ''
    }
${
  chainObj.assets
    ? `export const assets = _assets;
`
    : ''
}${
      chainObj.chain
        ? `export const chain = _chain;
`
        : ''
    }${
      chainObj.ibc
        ? `export const ibc = _ibc;
`
        : ''
    }${
      chainObj.ibc_chain1
        ? `export const ibc_chain1 = _ibc_chain1;
`
        : ''
    }`,
  );
};

const writeNetworkAssets = (filePath, networkObj) => {
  const validChain = [];
  const importStat = Object.keys(networkObj)
    .map(chain_name => {
      if (!networkObj[chain_name].assets) {
        return null;
      }

      validChain.push(chain_name);
      return `import * as _${chain_name} from './${chain_name}'`;
    })
    .filter(Boolean)
    .join(';\n');

  if (!validChain.length) {
    return false;
  }

  fs.writeFileSync(
    filePath,
    `import { AssetList } from '@chain-registry/types';

${importStat}

const assets: AssetList[] = [${validChain
      .map(chain_name => {
        return `_${chain_name}.assets`;
      })
      .join(',')}];

export default assets;
`,
  );

  return true;
};

const writeNetworkChains = (filePath, networkObj) => {
  const validChain = [];

  const importStat = Object.keys(networkObj)
    .map(chain_name => {
      if (!networkObj[chain_name].chain) {
        return null;
      }

      validChain.push(chain_name);
      return `import * as _${chain_name} from './${chain_name}'`;
    })
    .filter(Boolean)
    .join(';\n');

  if (!validChain.length) {
    return false;
  }

  fs.writeFileSync(
    filePath,
    `import { Chain } from '@chain-registry/types';

${importStat}

const chains: Chain[] = [${validChain
      .map(chain_name => {
        return `_${chain_name}.chain`;
      })
      .join(',')}];

export default chains;
`,
  );

  return true;
};

const writeNetworkIbc = (filePath, networkObj) => {
  const validChain = [];

  const importStat = Object.keys(networkObj)
    .map(chain_name => {
      if (!networkObj[chain_name].ibc_chain1) {
        return null;
      }

      validChain.push(chain_name);
      return `import * as _${chain_name} from './${chain_name}'`;
    })
    .filter(Boolean)
    .join(';\n');

  if (!validChain.length) {
    return false;
  }

  fs.writeFileSync(
    filePath,
    `import { IBCInfo } from '@chain-registry/types';

${importStat}

const ibc: IBCInfo[] = [${validChain
      .map(chain_name => {
        return `..._${chain_name}.ibc_chain1`;
      })
      .join(',')}];

export default ibc;
`,
  );

  return true;
};

const writeNetworkIndex = (filePath, networkObj) => {
  fs.writeFileSync(
    filePath,
    `${Object.keys(networkObj)
      .map(chain_name => {
        return `export * as ${getValidVarName(chain_name)} from './${chain_name}'`;
      })
      .filter(Boolean)
      .join(';\n')}`,
  );
};

const writeNetworkAll = (filePath, isAssets, isChains, isIbc) => {
  fs.writeFileSync(
    filePath,
    `${
      isAssets
        ? `import assets from './assets';
`
        : ''
    }${
      isChains
        ? `import chains from './chains';
`
        : ''
    }${
      isIbc
        ? `import ibc from './ibc';
`
        : ''
    }

    export default {
      ${isAssets ? 'assets,' : ''}
      ${isChains ? 'chains,' : ''}
      ${isIbc ? 'ibc,' : ''}
    };

    export {
      ${isAssets ? 'assets,' : ''}
      ${isChains ? 'chains,' : ''}
      ${isIbc ? 'ibc,' : ''}
     };
`,
  );
};

const writeRootAssets = (filePath, obj) => {
  const validNetwork = [];
  const importStat = Object.keys(obj)
    .map(network_type => {
      if (!obj[network_type].all_files.isAssets) {
        return null;
      }

      validNetwork.push(network_type);
      return `import * as _${network_type} from './${network_type}/all'`;
    })
    .filter(Boolean)
    .join(';\n');

  if (!validNetwork.length) {
    return false;
  }

  fs.writeFileSync(
    filePath,
    `import { AssetList } from '@chain-registry/types';

${importStat}

const assets: AssetList[] = [${validNetwork
      .map(network_type => {
        return `..._${network_type}.assets`;
      })
      .join(',')}];

export default assets;
`,
  );

  return true;
};

const writeRootChains = (filePath, obj) => {
  const validNetwork = [];

  const importStat = Object.keys(obj)
    .map(network_type => {
      if (!obj[network_type].all_files.isChains) {
        return null;
      }

      validNetwork.push(network_type);
      return `import * as _${network_type} from './${network_type}/all'`;
    })
    .filter(Boolean)
    .join(';\n');

  if (!validNetwork.length) {
    return false;
  }

  fs.writeFileSync(
    filePath,
    `import { Chain } from '@chain-registry/types';

${importStat}

const chains: Chain[] = [${validNetwork
      .map(network_type => {
        return `..._${network_type}.chains`;
      })
      .join(',')}];

export default chains;
`,
  );

  return true;
};

const writeRootIbc = (filePath, obj) => {
  const validNetwork = [];

  const importStat = Object.keys(obj)
    .map(network_type => {
      if (!obj[network_type].all_files.isIbc) {
        return null;
      }

      validNetwork.push(network_type);
      return `import * as _${network_type} from './${network_type}/all'`;
    })
    .filter(Boolean)
    .join(';\n');

  if (!validNetwork.length) {
    return false;
  }

  fs.writeFileSync(
    filePath,
    `import { IBCInfo } from '@chain-registry/types';

${importStat}

const ibc: IBCInfo[] = [${validNetwork
      .map(network_type => {
        return `..._${network_type}.ibc`;
      })
      .join(',')}];

export default ibc;
`,
  );

  return true;
};

const writeRootAll = filePath => {
  fs.writeFileSync(
    filePath,
    `import assets from './assets';
import chains from './chains';
import ibc from './ibc';

export default {
  assets,
  chains,
  ibc
};

export { assets, chains, ibc };`,
  );
};

const writeRootIndex = (filePath, obj) => {
  let imports = Object.keys(obj)
    .map(network_type => {
      return `export * from './${network_type}'`;
    })
    .filter(Boolean)
    .join(';\n');

  imports = `${imports}; import all from './all';

  export default all;

  const { assets, chains, ibc }= all;

  export { assets, chains, ibc };
  `;

  fs.writeFileSync(filePath, `${imports}`);
};

const initChainBlock = (obj, network_type, chain_name) => {
  if (!obj[network_type]) {
    obj[network_type] = {};
  }

  if (!obj[network_type][chain_name]) {
    obj[network_type][chain_name] = {};
  }
};

const initIBC = (obj, ibcFieldName) => {
  if (!obj[ibcFieldName]) {
    obj[ibcFieldName] = [];
  }
};

const NON_INFO_DIRS = ['_memo_keys', '_scripts', '_template', '.github'];

const chainPaths = glob(`${__dirname}/../chain-registry/**/chain.json`).filter(a => {
  const splitedDirs = a.split('chain-registry/chain-registry');
  let dir = splitedDirs.pop();
  dir = path.basename(path.dirname(dir));
  return !NON_INFO_DIRS.includes(dir);
});

const paths = glob(`${__dirname}/../chain-registry/**/*.json`).filter(a => {
  const splitedDirs = a.split('chain-registry/chain-registry');
  const filePath = splitedDirs.pop();
  const dir = path.basename(path.dirname(filePath));
  return !NON_INFO_DIRS.includes(dir) && path.basename(filePath) !== 'chain.json';
});

const chainNetworkMap = {};

const result = {};

chainPaths.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  if (!data.$schema) {
    console.warn('problematic data:');
    console.log(data);
    return;
  }

  if (data.$schema.endsWith('chain.schema.json')) {
    if (!data.slip44) data.slip44 = 118;
    if (data.codebase) {
      data.codebase = {
        cosmos_sdk_version: data.codebase.cosmos_sdk_version,
        cosmwasm_enabled: data.codebase.cosmwasm_enabled,
        cosmwasm_version: data.codebase.cosmwasm_version,
      };
    }
    delete data.peers;

    if (!data.chain_name) {
      console.log(`problematic file: ${file}`);
      return;
    }

    initChainBlock(result, data.network_type, data.chain_name);

    result[data.network_type][data.chain_name].chain = data;

    chainNetworkMap[data.chain_name] = data.network_type;
  }
});

paths.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  if (!data.$schema) {
    console.warn('problematic data:');
    console.log(data);
    return;
  }

  if (data.$schema.endsWith('assetlist.schema.json')) {
    const network_type = chainNetworkMap[data.chain_name];

    if (!network_type) {
      initChainBlock(result, NON_COSMOS_NETWORK_TYPE, data.chain_name);
      result[NON_COSMOS_NETWORK_TYPE][data.chain_name].assets = data;
    } else {
      result[network_type][data.chain_name].assets = data;
    }
  }

  if (data.$schema.endsWith('ibc_data.schema.json')) {
    const network_type1 = chainNetworkMap[data.chain_1.chain_name];

    if (!network_type1) {
      initChainBlock(result, NON_COSMOS_NETWORK_TYPE, data.chain_1.chain_name);
      initIBC(result[NON_COSMOS_NETWORK_TYPE][data.chain_1.chain_name], 'ibc');
      initIBC(result[NON_COSMOS_NETWORK_TYPE][data.chain_1.chain_name], 'ibc_chain1');
      result[NON_COSMOS_NETWORK_TYPE][data.chain_1.chain_name].ibc.push(data);
      result[NON_COSMOS_NETWORK_TYPE][data.chain_1.chain_name].ibc_chain1.push(data);
    } else {
      initIBC(result[network_type1][data.chain_1.chain_name], 'ibc');
      initIBC(result[network_type1][data.chain_1.chain_name], 'ibc_chain1');
      result[network_type1][data.chain_1.chain_name].ibc.push(data);
      result[network_type1][data.chain_1.chain_name].ibc_chain1.push(data);
    }

    const network_type2 = chainNetworkMap[data.chain_2.chain_name];

    if (!network_type2) {
      initChainBlock(result, NON_COSMOS_NETWORK_TYPE, data.chain_2.chain_name);
      initIBC(result[NON_COSMOS_NETWORK_TYPE][data.chain_2.chain_name], 'ibc');
      result[NON_COSMOS_NETWORK_TYPE][data.chain_2.chain_name].ibc.push(data);
    } else {
      initIBC(result[network_type2][data.chain_2.chain_name], 'ibc');
      result[network_type2][data.chain_2.chain_name].ibc.push(data);
    }
  }
});

const SRC_ROOT = `${__dirname}/../src`;
fs.rmSync(SRC_ROOT, { recursive: true });

Object.keys(result).forEach(network_type => {
  const networkFolder = path.join(SRC_ROOT, network_type);

  Object.keys(result[network_type]).forEach(chain_name => {
    const chainFolderPath = path.join(networkFolder, chain_name);
    mkdirpSync(chainFolderPath);

    const chainObj = result[network_type][chain_name];

    if (chainObj.chain) {
      const chainFilePath = path.join(chainFolderPath, 'chain.ts');
      void write(chainFilePath, chainObj.chain, 'Chain', false);
    }

    if (chainObj.assets) {
      const assetsFilePath = path.join(chainFolderPath, 'assets.ts');
      void write(assetsFilePath, chainObj.assets, 'AssetList', false);
    }

    if (chainObj.ibc) {
      const ibcFilePath = path.join(chainFolderPath, 'ibc.ts');
      void write(ibcFilePath, chainObj.ibc, 'IBCInfo', true);
    }

    if (chainObj.ibc_chain1) {
      const ibc1FilePath = path.join(chainFolderPath, 'ibc_chain1.ts');
      void write(ibc1FilePath, chainObj.ibc_chain1, 'IBCInfo', true);
    }

    const indexFilePath = path.join(chainFolderPath, 'index.ts');
    writeChainIndex(indexFilePath, chainObj);
  });

  const assetsFilePath = path.join(networkFolder, 'assets.ts');
  const isAssets = writeNetworkAssets(assetsFilePath, result[network_type]);

  const chainsFilePath = path.join(networkFolder, 'chains.ts');
  const isChains = writeNetworkChains(chainsFilePath, result[network_type]);

  const ibcFilePath = path.join(networkFolder, 'ibc.ts');
  const isIbc = writeNetworkIbc(ibcFilePath, result[network_type]);

  const indexFilePath = path.join(networkFolder, 'index.ts');
  writeNetworkIndex(indexFilePath, result[network_type]);

  const allFilePath = path.join(networkFolder, 'all.ts');
  result[network_type]['all_files'] = {
    isAssets,
    isChains,
    isIbc,
  };
  writeNetworkAll(allFilePath, isAssets, isChains, isIbc);
});

const assetsRootFilePath = path.join(SRC_ROOT, 'assets.ts');
writeRootAssets(assetsRootFilePath, result);

const chainsRootFilePath = path.join(SRC_ROOT, 'chains.ts');
writeRootChains(chainsRootFilePath, result);

const ibcRootFilePath = path.join(SRC_ROOT, 'ibc.ts');
writeRootIbc(ibcRootFilePath, result);

const allRootFilePath = path.join(SRC_ROOT, 'all.ts');
writeRootAll(allRootFilePath);

const indexRootFilePath = path.join(SRC_ROOT, 'index.ts');
writeRootIndex(indexRootFilePath, result);
