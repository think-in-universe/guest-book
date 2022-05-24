import 'regenerator-runtime/runtime';
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Big from 'big.js';
import Form from './components/Form';
import SignIn from './components/SignIn';
import Messages from './components/Messages';

const SUGGESTED_DONATION = '0';
const BOATLOAD_OF_GAS = Big(3).times(10 ** 13).toFixed();

const encode_call = (contractAccount, methodName, args) => {
  return Buffer.concat([
    Buffer.from(contractAccount),
    Buffer.from([0]),
    Buffer.from(methodName),
    Buffer.from([0]),
    Buffer.from(JSON.stringify(args))
  ]);
}

const App = ({ account, contract, currentUser, nearConfig, wallet }) => {
  const [messages, setMessages] = useState([]);

  const getMessages = () => {
    return account.viewFunction(
      nearConfig.contractName,
      "view_js_contract",
      encode_call(nearConfig.jsContractName, "getMessages", []),
      {
        stringify: (val) => val
      }
    );
  }

  const addMessage = ({ text }, gas, deposit) => {
    return account.functionCall(
      nearConfig.contractName,
      "call_js_contract",
      encode_call(nearConfig.jsContractName, "addMessage", [text]),
      gas,
      deposit
    );
  }

  useEffect(() => {
    // TODO: don't just fetch once; subscribe!
    getMessages().then(setMessages);
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();

    const { fieldset, message, donation } = e.target.elements;

    fieldset.disabled = true;

    // TODO: optimistically update page with new message,
    // update blockchain data in background
    // add uuid to each message, so we know which one is already known
    addMessage(
      { text: message.value },
      BOATLOAD_OF_GAS,
      Big(Number(donation.value) || '0.01').times(10 ** 24).toFixed()
    ).then(() => {
      getMessages().then(messages => {
        setMessages(messages);
        message.value = '';
        donation.value = SUGGESTED_DONATION;
        fieldset.disabled = false;
        message.focus();
      });
    });
  };

  const signIn = () => {
    wallet.requestSignIn(
      {contractId: nearConfig.contractName, methodNames: [contract.call_js_contract.name]}, //contract requesting access
      'NEAR Guest Book', //optional name
      null, //optional URL to redirect to if the sign in was successful
      null //optional URL to redirect to if the sign in was NOT successful
    );
  };

  const signOut = () => {
    wallet.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  };

  return (
    <main>
      <header>
        <h1>NEAR Guest Book</h1>
        { currentUser
          ? <button onClick={signOut}>Log out</button>
          : <button onClick={signIn}>Log in</button>
        }
      </header>
      { currentUser
        ? <Form onSubmit={onSubmit} currentUser={currentUser} />
        : <SignIn/>
      }
      { !!currentUser && !!messages.length && <Messages messages={messages}/> }
    </main>
  );
};

App.propTypes = {
  contract: PropTypes.shape({
    call_js_contract: PropTypes.func.isRequired,
    view_js_contract: PropTypes.func.isRequired
  }).isRequired,
  currentUser: PropTypes.shape({
    accountId: PropTypes.string.isRequired,
    balance: PropTypes.string.isRequired
  }),
  nearConfig: PropTypes.shape({
    contractName: PropTypes.string.isRequired
  }).isRequired,
  wallet: PropTypes.shape({
    requestSignIn: PropTypes.func.isRequired,
    signOut: PropTypes.func.isRequired
  }).isRequired
};

export default App;
