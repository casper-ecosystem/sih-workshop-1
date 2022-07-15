# Smart India Hackathon - Workshop 1

Hi everyone and welcome to Workshop 1 as part of the Smart India Hackathon. My name is Dylan Ireland and I am a Developer Advocate for the Casper Association. My focus is onboarding developers and helping them complete events such as these. Today I'll be demonstrating front-end network interaction and NFT contract deployments using the Casper JavaScript SDK. To follow along with this workshop you'll need a basic understanding of JavaScript and npm, blockchain basics, and the bash command line. You'll also need a working bash environment. Other shells like zsh on macOS will work but if you are on Windows you will need the Windows Subsystem for Linux set up. Let's get started.

Begin by opening a terminal window and navigate to the directory you'd like your project to live. I will navigate home using `cd ~`.

Once in your parent directory, create a new folder for your project and `cd` into this new directory

```bash
mkdir workshop
cd workshop
```

Now initialize a new `npm` project

```bash
npm init -y
```

Install the `casper-js-sdk`

```bash
npm i casper-js-sdk
```

Create your entry file

```bash
touch index.js
```

Now let's clone the CEP-78 repository. CEP-78 is Casper's new enhanced NFT standard, and it is what we'll be using today.

```bash
git clone https://github.com/casper-ecosystem/cep-78-enhanced-nft.git
```

And we'll go ahead and compile our CEP-78 contracts. First, `cd` into *cep-78-enhanced-nft* then run

```bash
make prepare
make build-contract
```

You'll need `make` and `rust` for this.

*Build and while it is compiling open a new tab with command-t and show the below commands for installing make and rust.*

To install `make` on Ubuntu you can run `sudo apt install build-essential`, on macOS you can do `brew install make` or just install the Xcode tools with `xcode-select --install`.

For Rust run `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` on pretty much all machines.

Make is now building and compiling (has built and compiled) the CEP-78 contract as well as some helper contracts for interacting with the CEP-78 entrypoints.

When it is done we should have our main contract in its compiled WebAssembly form in *cep-78-enhanced-nft/contract/target/wasm32-unknown-unknown/release/contract.wasm*

We should also have our helper session code WASM in *cep-78-enhanced-nft/client/\*/wasm32-unknown-unknown/release/contract.wasm*

Lastly before we begin coding, lets create some new account keys and fund the account using the cspr.live faucet.

So `cd` back to your project working directory by executing `cd ../`.

To generate new keys we're going to use the Rust `casper-client`. Install it by running

```bash
cargo install casper-client
```

Now run

```bash
casper-client keygen keys
```

to generate a key pair in the new folder *keys/*.

`cd` in with `cd keys` and run `ls` to view your key files.

`cd` back and head to a Chromium based browser like Chrome or Brave.

If you already have the Casper Signer installed go ahead and open it up, but if not just Google "Casper Signer" and install it from the Chrome Web Store.

Create or unlock your wallet and click "Import Account". Click "UPLOAD" and find the "secret_key.pem" file you just created in the *keys/* directory. Name the account whatever you'd like and click "IMPORT".

Now to go testnet.cspr.live, hover over "Tools" in the menu bar, and click "Faucet". Complete the captcha and click "Request tokens". Once the transaction executes you should have 1000 CSPR in your account. *View the account*

Now open *index.js* and let's begin coding

The first step will be to `require` the appropriate classes from the JS SDK. We will also need the `Option` class from the `ts-results` library which is included as a dependancy to the JS SDK. Let's also require `fs` so we can read in our compiled smart contracts

```javascript
const { RuntimeArgs, CLValueBuilder, Contracts, CasperClient, DeployUtil, CLPublicKey, Keys, CLValue, CLType } = require('casper-js-sdk')
const { Option, Some } = require('ts-results')
const fs = require('fs')
```

Now let's instantiate a `CasperClient` instance with a known node url for deploying our contract and session code. We'll also need a `Contract` object linked to our `CasperClient` object.

```javascript
const client = new CasperClient("http://136.243.187.84:7777/rpc")
const contract = new Contracts.Contract(client)
```

Next we'll create a constant to represent the path to the secret key to be used for deployment. Additionally we will create a constant for the network name. We will be using the Casper testnet, so we'll use "casper-test". Lastly we'll define a constant that calls a function named `getKeys()` which we will go over next

```javascript
const keyPairFilePath = "keys/secret_key.pem"
const network = "casper-test"
const keys = getKeys()
```

Create the `getKeys` function like so:

```javascript
function getKeys() {
  return Keys.Ed25519.loadKeyPairFromPrivateFile(keyPairFilePath)
}
```

This function will load our private key in using the filepath we defined a moment ago.

Now let's look at actually installing the contract.

Create an `async` function. I'll name it `installContract`

```javascript
async function installContract() {
  
}
```

Before we define our deployment arguments, let's see what they mean by heading to https://github.com/casper-ecosystem/cep-78-enhanced-nft

*Show modalities*

Now that you have an understanding of the CEP-78 standard, let's create our metadata schema and define our deployment arguments.

```javascript
const schema = {
	"properties": {
		"first_name": {
    	"name": "First Name",
      "description": "Your first name",
      "required": true,
   	},
    "last_name": {
    	"name": "Last Name",
      "description": "Your last name",
      "required": true,
   	}
  }
}

const zero = new Some(CLValueBuilder.u8(0))
const args = RuntimeArgs.fromMap({
	"collection_name": CLValueBuilder.string("name"),
  "collection_symbol": CLValueBuilder.string("SYMBL"),
  "total_token_supply": CLValueBuilder.u64(1000),
  "ownership_mode": CLValueBuilder.u8(2),
  "nft_kind": CLValueBuilder.u8(1),
  "holder_mode": CLValueBuilder.option(zero),
  "nft_metadata_kind": CLValueBuilder.u8(3),
  "json_schema": CLValueBuilder.string(JSON.stringify(schema)),
  "identifier_mode": CLValueBuilder.u8(0),
  "metadata_mutability": CLValueBuilder.u8(0)
});
```

Now let's write a function to read in the compiled CEP-78 WASM

```javascript
function getWasm(file) {
  try {
    return new Uint8Array(fs.readFileSync(file).buffer)
  } catch (err) {
    console.error(err)
  }
}
```

Now let's build the deploy.

```javascript
const deploy = contract.install(
  getWasm("cep-78-enhanced-nft/contract/target/wasm32-unknown-unknown/release/contract.wasm"), //Wasm as Uint8Array
  args, //RuntimeArgs
  "300000000000", //300 CSPR gas payment in motes
  keys.publicKey, //CLPublic key of the sender
  network, //network name
  [keys] //Array of signing keys
)
```

To build the deploy, we pass in the WebAssembly as a `Uint8Array`, the runtime arguments, our gas payment in motes, our public key, the network name, and an array with only our keys.

This function will build a deployable transaction that we can send to a node. To send it off we'll use the `putDeploy` `CasperClient` method.

```javascript
var deployHash
try {
	deployHash = await client.putDeploy(deploy)
} catch(error) {
	console.log(error)
}
```

The function `client.putDeploy` returns a `Promise` that resolves to the hash of the deploy, which we can query to check the execution status.

In order to check for the result, we can create a polling function that will query the deploy status every couple of seconds.

```javascript
function pollDeployment(deployHash) {
  return new Promise((resolve, reject) => {
    var poll = setInterval(async function(deployHash) {
      try {
        response = await client.getDeploy(deployHash)
    	  if (response[1].execution_results.length != 0) {
           //Deploy executed
           if (response[1].execution_results[0].result.Failure != null) {
             clearInterval(poll)
             reject("Deployment failed")
             return
           }
           clearInterval(poll)
           resolve(response[1].execution_results[0].result.Success)
         }
  	  } catch(error) {
        console.error(error)
  	  }
    }, 2000, deployHash)
  })
}
```

This polling function makes use of the `getDeploy` `CasperClient` method. Everything else is just parsing the result and looping until the deploy executes.

In order to retrieve the contract address from the deploy result, we can write a function to iterate through the on-chain transformations that occurred, to find the "WriteContract" transformation. Associated with this key will be the contract hash of the NFT contract.

```javascript
function iterateTransforms(result) {
  const transforms = result.effect.transforms
  for (var i = 0; i < transforms.length; i++) {
    if (transforms[i].transform == "WriteContract") {
      return transforms[i].key
    }
  }
}
```

Now we can go back to our `installContract()` function and put this all together.

```javascript
var contract_hash
try {
  const result = await pollDeployment(deployHash)
  contract_hash = iterateTransforms(result)
} catch(error) {
  console.error(error)
}
```

For simplicity's sake, we'll log our contract address and hard code it for now, but you could easily store it in a local database, or pass it directly to the minting function etcetera.

```javascript
console.log(contract_hash)
```

I'll now quickly define a global constant `contractHash` that contains a hexadecimal string of the contract hash of the NFT contract. Note that we need to prepend the contract hash with "hash-"

```javascript
const contractHash = contract_hash //Set this up up top using a String, not the variable `contract_hash`
```

Now that we've installed the contract we can begin calling entrypoints. First we will mint an NFT to ourselves.

Create a new JavaScript function called `mint`

```javascript
function mint() {
  
}
```

First we'll need to set our contract hash to our `Contract` object.

```javascript
contract.setContractHash(contractHash)
```

Create an object with your metadata

```javascript
const metadata = {
  "first_name": "Dylan",
  "last_name": "Ireland"
}
```

Now define your deployment arguments

```javascript
const args = RuntimeArgs.fromMap({
  "token_owner": keys.publicKey,
  "token_meta_data": CLValueBuilder.string(JSON.stringify(metadata))
})
```

The "token_owner" is the receiver of the token, and the "token_meta_data" is the metadata of the NFT. We use `JSON.stringify` to turn our metadata into a `String`.

You may also mint to another account, as long as the ownership mode is not set to `Minter`, by using:

```javascript
CLPublicKey.fromHex("hex")
```

Next we'll build a deploy using the `callEntrypoint` on your `CasperClient` instance.

Then, just like after we installed the contract, we will use `putDeploy` to send the deploy, then we will poll for the deployment result. This time however we will not iterate the transformations, we will just ensure the success of the deployment.

```javascript
var deployHash
try {
  deployHash = await client.putDeploy(deploy)
} catch(error) {
  console.log(error)
}

var result
try {
  result = await pollDeployment(deployHash)
} catch(error) {
  console.error(error)
}

console.log("Result: " + result)
```

Now that it succeeded, we can verify it on testnet.cspr.live.
