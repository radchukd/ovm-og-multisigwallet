import { useState } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { Web3ReactProvider } from '@web3-react/core';

import { ChainId } from 'components/ChainId';
import { BlockNumber } from 'components/BlockNumber';
import { Owners } from 'components/OwnersTable';
import { TransactionTable } from 'components/TransactionsTable';
import { Connection } from 'components/Connection';
import { NetworkName } from 'components/NetworkName';
import { WithModal } from 'components/Modal';
import { SetOrDeployMultisig } from 'components/SetOrDeployMultisig';
import { WithToast, Toast } from 'components/Toast';
import { MultisigInfo } from 'components/MultisigInfo';

function getLibrary(provider: any): Web3Provider {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

const Page = () => {
  return (
    <>
      <Web3ReactProvider getLibrary={getLibrary}>
        <App />
      </Web3ReactProvider>
    </>
  );
};

const App = () => {
  const [multisigAddress, setMultisigAddress] = useState('');

  return (
    <>
      <WithModal>
        <WithToast>
          <div className="container mx-auto px-4">
            <div className="flex justify-end mt-2">
              <ChainId />
              <BlockNumber />
              <NetworkName />
              <Connection />
            </div>
            <div className="mt-4">
              <Toast />
            </div>
            <SetOrDeployMultisig
              address={multisigAddress}
              setMultisigAddress={setMultisigAddress}
            />
            {multisigAddress && (
              <>
                <MultisigInfo address={multisigAddress} setMultisigAddress={setMultisigAddress} />
                <TransactionTable address={multisigAddress} />
                <Owners address={multisigAddress} />
              </>
            )}
          </div>
        </WithToast>
      </WithModal>
    </>
  );
};

export default Page;
