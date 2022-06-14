import React, {useState} from 'react';
import Web3Modal from "web3modal";
import { ethers } from "ethers";
// import abi here
import GnosisSafeL2Abi from "./abi/GnosisSafeL2.json";
import FactoryAbi from "./abi/GnosisSafeProxyFactory.json";
import config from "./config.json";

const Sign = () => {
  // const [getNonceButtonText, setGetNonceButtonText] = useState('getNonce');
  // const [getHashButtonText, setGetHashButtonText] = useState('getHash');
  const [newWalletButtonText, setNewWalletButtonText] = useState('new wallet');
  const [submitSignButtonText, setSubmitSignButtonText] = useState('get hash');
  const [execTransactionButtonText, setExecTransactionButtonText] = useState('execute');
  const [nonce, setNonce] = useState('unknow');
  const [txHash, setTxHash] = useState('unknow');
  const [signed, setSigned] = useState('unknow');
  const [account, setAccount] = useState('unknow');
  const [walletAddress, setWalletAddress] = useState('unknow');
  // const [errorMessage, setErrorMessage] = useState(null);
  // const [myOutput, setMyOutput] = useState(null);
  const newWalletHandler = async () => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    // init contract
    const contract = new ethers.Contract(
      config.GnosisSafeProxyFactory,
      FactoryAbi['abi'],
      signer
    );

    const data_new = document.getElementById("data_new").value;
    const result = await contract.createProxyWithNonce(
      config.GnosisSafeL2,
      "0xb63e800d" + data_new,
      Math.floor(Math.random() * Math.pow(2, 32))
    )
    console.log(result);
    setWalletAddress(result["hash"]);
  }
  const submitSignHandler = async () => {
    //get signer
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    // init contract
    const walletAddress = document.getElementById("walletAddress").value;
    const contract = new ethers.Contract(
      walletAddress,
      GnosisSafeL2Abi['abi'],
      signer
    );

    // input
    const to = document.getElementById("to").value;
    const value = document.getElementById("value").value;
    const data = document.getElementById("data").value;
    var nonce = document.getElementById("nonce").value;

    // fetch nonce if needed
    if(nonce === "latest"){
      nonce = await contract.nonce();
      setNonce(nonce["_hex"].toString(16));
    }else{
      setNonce(nonce);
    }

    // get data hash to be signed
    const dataHash = await contract.getTransactionHash(
      to,
      value,
      data,
      0, 0, 0, 0,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      nonce
    );
    setTxHash(dataHash);


    // sign
    const dataHashBytes = ethers.utils.arrayify(dataHash);
    var flatSig = await signer.signMessage(dataHashBytes);
    if(flatSig[131] === 'b'){
       flatSig = flatSig.slice(0, 130);
       flatSig += '1f';
    }else{
       flatSig = flatSig.slice(0, 130);
       flatSig += '20';
    }
    const recovered = ethers.utils.verifyMessage(dataHashBytes, flatSig);
    setSigned(flatSig);
    setAccount(recovered);
    // let sig = ethers.utils.splitSignature(result);
    // console.log(sig);
    setSubmitSignButtonText('Signed');
  }

  const execTransactionHandler = async () => {
    //get signer
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = await provider.getSigner();
    // init contract
    const walletAddress = document.getElementById("walletAddress").value;
    const contract = new ethers.Contract(
      walletAddress,
      GnosisSafeL2Abi['abi'],
      signer
    );
    //contract call
    const to = document.getElementById("to").value;
    const value = document.getElementById("value").value;
    const data = document.getElementById("data").value;
    const signatures = document.getElementById("signatures").value;
    const gas = document.getElementById("gas").value;
    const gasPrice = document.getElementById("gasPrice").value;
    console.log(signatures);
    await contract.execTransaction(
      to,
      value,
      data,
      0, 0, gas, gasPrice,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      signatures
    )
    setExecTransactionButtonText("executed");
  }

  return(
    <div className='Multisig Wallet'>

    <h3> {"New Wallet"}</h3>
    setup: (owners, threshold, 0x00…0, 0x, CompatibilityFallbackHandler, 0x00…0, 0x00…0, 0x00…0)<br></br>
    <textarea rows="10" cols="63" id="data_new" defaultValue="0000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000180000000000000000000000000f48f2b2d2a534e402487b3ee7c18c33aec0fe5e400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000030000000000000000000000007aca9263555a4333f55c66d135705fede8fc8bf6000000000000000000000000b7b286b5a4a9004ef972864469a0c49e35b505e40000000000000000000000001e9e43d1c62c81fa0bd0695d12847f40a02fbefb0000000000000000000000000000000000000000000000000000000000000000"></textarea>
    <button onClick={newWalletHandler}>{newWalletButtonText}</button>
    <div> <span className="wallet address">{walletAddress}</span> </div>

    <h3> {"Sign"} </h3>

    walletAddress: <input type="text" id="walletAddress" size="35" defaultValue="0x87d5afbf0bd175e3665f02207afc31eb245b8b24"></input><br></br>
    to: <input type="text" id="to" placeholder="address" size="35" defaultValue="0x57b61Ee713097bE30031Fb391b5413C0Aaee5d8B"></input><br></br>
    value: <input type="text" id="value" placeholder="int" defaultValue="100000000000000000"></input><br></br>
    data: <input type="text" id="data" placeholder="address" defaultValue="0x"></input><br></br>
    nonce: <input type="text" id="nonce" defaultValue="latest"></input><br></br>
    gas: <input type="text" id="gas" defaultValue="0"></input><br></br>
    gasPrice: <input type="text" id="gasPrice" defaultValue="0"></input><br></br>

    <button onClick={submitSignHandler}>{submitSignButtonText}</button>

    <div> <span className="outputs"> account: {account}</span> </div>
    <div> <span className="outputs"> signed: {txHash}</span> </div>
    <div> <span className="outputs"> nonce: {nonce}</span> </div>
    <div> <span className="signedOutput">{signed}</span> </div>

    <h3>{"Execute"} </h3>
    <textarea rows="7" cols="64" id="signatures" placeholder="0x<65_bytes_sig1><65_bytes_sig2>..."></textarea>
    <button onClick={execTransactionHandler}>{execTransactionButtonText}</button>

    </div>
  )
}

export default Sign;
