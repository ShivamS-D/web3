import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { newAbi } from './abi/newConfig';

const Todo = () => {
  const [metamask, setMetamask] = useState(true);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  const [manager, setManager] = useState('');
  const [todos, setTodos] = useState([]);
  const [balance, setBalance] = useState(0);
  const [lotteryContract, setLotteryContract] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [refresh, setRefresh] = useState();
  const [connecting, setConnecting] = useState(false);

  // const [signatureOfLocal,setSignatureofLocal]=useState('')
  let signatureOfLocal=localStorage.getItem('signature')
  const initializeContract = async () => {
    setConnecting(true);
    if (window.ethereum) {
      setMetamask(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      const contract = new ethers.Contract("0xcba893d6fb4ffab7855ade6d36a7932b5ca5d602", newAbi, provider);
      setLotteryContract(contract)

      ;
      // console.log(contract)

      try {
        const signerRes = await provider.send("eth_requestAccounts", []);
        const signers = provider.getSigner();
        const message = `Want to connect ?`;
        const signature = await signers.signMessage(message);
        localStorage.setItem("signature", signature);
        // setSignatureofLocal(localStorage.getItem('signature'))
        setSigner(signers);
        setAddress(signerRes[0]);
        await updateState(signerRes[0], contract, provider);
      } catch (e) {
        console.log(e);
      }
    } else {
      setConnecting(false)
      setMetamask(false);
    }
    setConnecting(false);
  };

  // setSignatureofLocal (localStorage.getItem('signature'));

  const updateState = async (addr, contract, provider) => {
    const bal = await provider.getBalance(addr);
    setBalance(ethers.utils.formatEther(bal));

    const admin = await contract.owner();
    setManager(admin);

    const userTodos = await contract.getSingleUserToDos(addr);
    setTodos(userTodos);
    
  };
  //  console.log(todos.slice().sort((a,b)=>b-a))
  useEffect(() => {
    if (signatureOfLocal) {
      const initializeFromSignature = async () => {
        if (window.ethereum) {
          const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
          const contract = new ethers.Contract("0xcba893d6fb4ffab7855ade6d36a7932b5ca5d602", newAbi, provider);
          setLotteryContract(contract);

          const signerRes = await provider.send("eth_requestAccounts", []);
          const signers = provider.getSigner();
          setSigner(signers);
          setAddress(signerRes[0]);
          await updateState(signerRes[0], contract, provider);
        }
      };
      initializeFromSignature();
    }
  }, [signatureOfLocal]);

  useEffect(() => {
    if (address && lotteryContract) {
      const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      updateState(address, lotteryContract, provider);
    }
  }, [address, lotteryContract, refresh]);

  const etherToWei = amount => ethers.utils.parseUnits(amount, "ether");

  const handleAddTo = async () => {
    const addTodos = lotteryContract.connect(signer);
    try {
      const res = await addTodos.addToDo(title, description, deadline, { value: etherToWei('0.000000000001') });
      const receipt = await res.wait();
      setRefresh(receipt);
    } catch (error) {
      console.error(error);
    }
  };

  const handleWithdraw = async () => {
    const addTodos = lotteryContract.connect(signer);
    try {
      const res = await addTodos.withdraw();
      const receipts = await res.wait();
      setRefresh(receipts);
    } catch (error) {
      console.error(error);
    }
  };

  const disConnect=()=>{
    localStorage.removeItem('signature')

    setSigner(null);
    setAddress('');
    setTodos([]);
    setBalance(0);
    setManager('');
    setConnecting(false)
  }
  const deleteAUserTodos=async ()=>{
    const addTodos = lotteryContract.connect(signer);
    const signDelete=await signer.signMessage("Want to delete")
    console.log(signDelete)
    try {
      const res = await addTodos.deleteArrayOfTodo();
      const receipt = await res.wait();
      console.log(receipt)
      setRefresh(receipt);

    } catch (error) {
      console.error(error);
    }

  }
  const deleteOne=async (idx)=>{
    const addTodos = lotteryContract.connect(signer);
    const signDelete=await signer.signMessage(`Do you want to delete todo with index ${idx}`)
    console.log(signDelete)
    try{
      const res=await addTodos.deleteTodo(idx);
      const receipt=await res.wait();
      setRefresh(receipt)
    }
    catch(e){
      console.log(e)
    }

  }

  const updateOne=async (idx)=>{
    const updateTodos=lotteryContract.connect(signer);
    try{
      const res=await updateTodos.updateTodo(idx,title,description,deadline,{value:etherToWei('0.000000000001')});
      const receipt=await res.wait();
      setRefresh(receipt)
    }
    catch(e){
console.log(e)
    }
  }
  return (
    signatureOfLocal ?
      <div>
        <h1>Address: {address}</h1>
        <h2>Balance: {balance} ETH</h2>
        <label>Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} />
        <br />
        <label>Description</label>
        <input type="text" value={description} onChange={e => setDescription(e.target.value)} />
        <br />
        <label>Deadline</label>
        <input type="text" value={deadline} onChange={e => setDeadline(e.target.value)} />
        <br />
        <button onClick={handleAddTo}>Add</button>
        <h1>Todos: {todos.length}</h1>
        <ul>
          {todos.map((todo, index) => (
            <li key={index}>
              <p>Title: {todo.title}</p>
              <p>Description: {todo.description}</p>
              <p>Deadline: {todo.deadline}</p>
              <button onClick={()=>deleteOne(index)}>Delete One</button>
              <button onClick={()=>updateOne(index)}>Update</button>
            </li>
          ))}
        </ul>
        {manager.toLowerCase() === address.toLowerCase() && <button onClick={handleWithdraw}>Withdraw</button>}
        <button onClick={disConnect}>Disconnect</button>
        <button onClick={deleteAUserTodos}>DELETE ALL</button>
      </div>
      :
      <div>
      {!metamask?<p style={{color:'red'}}>Plz have a metamask wallet</p>:null}
        <button onClick={initializeContract} disabled={connecting}>
          {connecting ? "Connecting..." : "Connect"}
        </button>
      </div>
  );
};

export default Todo;
