import { useContext, FC } from 'react';
import { useWeb3React } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';
import { Modal, ModalContext } from 'components/Modal';
import { abi as multisigAbi } from 'abi/MultiSigWallet.json';
import { CloseIcon } from 'components/Images';
import { isAddress } from '@ethersproject/address';
import { Form, Field } from 'react-final-form';
import { FORM_ERROR } from 'final-form';
import { OwnersContext } from 'contexts/OwnersContext';

interface FormValues {
  newOwnerAddress: string;
}

interface FormErrors {
  newOwnerAddress?: string;
}

interface AddOwnerModalProps {
  address: string;
}

interface ReplaceOwnerModalProps extends AddOwnerModalProps {
  ownerToBeReplaced?: string;
}

interface OwnerModalProps extends ReplaceOwnerModalProps {
  addOrReplace: 'add' | 'replace';
}

export const AddOwnerModal: FC<AddOwnerModalProps> = ({ address }) => (
  <OwnerModal address={address} addOrReplace="add" />
);
export const ReplaceOwnerModal: FC<ReplaceOwnerModalProps> = ({ address, ownerToBeReplaced }) => (
  <OwnerModal address={address} addOrReplace="replace" ownerToBeReplaced={ownerToBeReplaced} />
);

export const OwnerModal: FC<OwnerModalProps> = ({ address, addOrReplace, ownerToBeReplaced }) => {
  const { library } = useWeb3React<Web3Provider>();
  const { owners } = useContext(OwnersContext);
  const { clearModal } = useContext(ModalContext);
  const contract = new Contract(address, multisigAbi);

  const canSubmit = (values: FormValues, errors: FormErrors) => {
    const hasValues = values.newOwnerAddress.length;
    const hasErrors = Boolean(Object.keys(errors).length);

    return hasValues && !hasErrors;
  };

  const addOwner = async (owner: string) => {
    const tx = await contract
      .connect(library.getSigner())
      .submitTransaction(
        contract.address,
        0,
        contract.interface.encodeFunctionData('addOwner', [owner])
      );
    const receipt = await tx.wait();
    return receipt;
  };

  const replaceOwner = async (owner: string, newOwner: string) => {
    const tx = await contract
      .connect(library.getSigner())
      .submitTransaction(
        contract.address,
        0,
        contract.interface.encodeFunctionData('replaceOwner', [owner, newOwner])
      );
    const receipt = await tx.wait();
    return receipt;
  };

  const sendTx = async ({ newOwnerAddress }: FormValues) => {
    try {
      const receipt =
        addOrReplace === 'add'
          ? await addOwner(newOwnerAddress)
          : await replaceOwner(ownerToBeReplaced, newOwnerAddress);
      clearModal();
      return receipt;
    } catch (e) {
      return { [FORM_ERROR]: e.message };
    }
  };

  const itemStyle = 'flex justify-between items-center';
  const inputStyle = 'border border-gray-500 w-80 font-mono';
  const labelStyle = '';

  if (addOrReplace === 'replace' && !addOrReplace.length) {
    return null;
  }

  return (
    <Modal>
      <div className="flex justify-between w-full bg-gray-200 p-3 font-semibold">
        <h2>{addOrReplace === 'add' ? 'Add' : 'Change'} Owner</h2>
        <CloseIcon
          className="opacity-50 hover:opacity-80 hover:cursor-pointer"
          onClick={() => clearModal()}
        />
      </div>
      <Form
        onSubmit={sendTx}
        initialValues={{
          newOwnerAddress: '',
        }}
        validate={({ newOwnerAddress }: FormValues) => {
          const errors: FormErrors = {};

          if (newOwnerAddress?.length && !isAddress(newOwnerAddress)) {
            errors.newOwnerAddress = 'Please enter a valid address';
          } else if (
            newOwnerAddress?.length &&
            owners.some((owner) => owner.toUpperCase() === newOwnerAddress.toUpperCase())
          ) {
            errors.newOwnerAddress = 'This address is already an owner';
          }

          return errors;
        }}
        render={({ handleSubmit, errors, submitting, values, submitError }) => (
          <>
            {Boolean(submitError) && (
              <div className="bg-red-100 border border-red-500 text-red-500 p-3 m-5">
                {submitError}
              </div>
            )}
            <form className="pb-5" onSubmit={handleSubmit}>
              <ul>
                {addOrReplace === 'replace' && (
                  <li>
                    <div className="flex-col m-4">
                      <div className="flex-col">
                        <div>Replace Owner:</div>
                        <div>{ownerToBeReplaced}</div>
                      </div>
                    </div>
                  </li>
                )}
                <li>
                  <Field name="newOwnerAddress" parse={(value) => String(value)}>
                    {({ input, meta }) => (
                      <div className="flex-col m-4">
                        <div className={itemStyle}>
                          <label className={labelStyle}>New owner address</label>
                          <input
                            {...input}
                            className={`${inputStyle} ${meta.error ? 'text-red-500' : ''}`}
                          />
                        </div>
                        {meta.error && (
                          <div className="text-right text-red-500 m-1">{meta.error}</div>
                        )}
                      </div>
                    )}
                  </Field>
                </li>
              </ul>
              <button
                disabled={!canSubmit(values, errors as FormErrors) || submitting}
                className="btn-primary block mx-auto"
                type="submit"
              >
                Submit
              </button>
            </form>
          </>
        )}
      />
    </Modal>
  );
};
