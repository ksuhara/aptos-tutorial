import React from "react";
import "./App.css";
import { Types, AptosClient } from "aptos";

const client = new AptosClient("https://fullnode.devnet.aptoslabs.com/v1");

function App() {
  // Retrieve aptos.account on initial render and store it.
  const [address, setAddress] = React.useState<string | null>(null);

  const [account, setAccount] = React.useState<Types.AccountData | null>(null);

  /**
   * init function
   */
  const init = async () => {
    // connect
    const { address, publicKey } = await window.aptos.connect();
    setAddress(address);
  };

  const [modules, setModules] = React.useState<Types.MoveModuleBytecode[]>([]);

  React.useEffect(() => {
    init();
  }, []);

  React.useEffect(() => {
    if (!address) return;
    client.getAccount(address).then(setAccount);
    client.getAccountModules(address).then(setModules);
  }, [address]);

  const hasModule = modules.some((m) => m.abi?.name === "message");

  const publishInstructions = (
    <pre>
      Run this command to publish the module:
      <br />
      aptos move publish --package-dir /path/to/hello_blockchain/
      --named-addresses hello_blockchain={address}
    </pre>
  );

  const ref = React.createRef<HTMLTextAreaElement>();
  const [isSaving, setIsSaving] = React.useState(false);
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!ref.current) return;

    const message = ref.current.value;
    const transaction = {
      type: "entry_function_payload",
      function: `${address}::message::set_message`,
      arguments: [message],
      type_arguments: [],
    };

    try {
      setIsSaving(true);
      await window.aptos.signAndSubmitTransaction(transaction);
    } finally {
      setIsSaving(false);
    }
  };

  const [resources, setResources] = React.useState<Types.MoveResource[]>([]);
  React.useEffect(() => {
    if (!address) return;
    client.getAccountResources(address).then(setResources);
  }, [address]);
  const resourceType = `${address}::message::MessageHolder`;
  const resource = resources.find((r) => r.type === resourceType);
  const data = resource?.data as { message: string } | undefined;
  const message = data?.message;

  return (
    <div className="App">
      <p>
        Account Address: <code>{address}</code>
      </p>
      <p>
        Sequence Number: <code>{account?.sequence_number}</code>
      </p>
      {hasModule ? (
        <form onSubmit={handleSubmit}>
          <p>On-chain message</p>
          <textarea ref={ref} defaultValue={message} />
          <input disabled={isSaving} type="submit" />
        </form>
      ) : (
        publishInstructions
      )}
    </div>
  );
}

export default App;
