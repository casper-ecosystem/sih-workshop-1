const { RuntimeArgs, CLValueBuilder, Contracts, CasperClient, DeployUtil, CLPublicKey, Keys, CLValue, CLType, CLKey } = require('casper-js-sdk')
const { Option, Some } = require('ts-results')
const fs = require('fs')
const client = new CasperClient("http://136.243.187.84:7777/rpc")
const contract = new Contracts.Contract(client)

const keyPairFilePath = "keys/secret_key.pem"
const keys = getKeys()
const network = "casper-test"
const contractHash = ""

var collection_name = "SIH Workshop NFT Test"
var collection_symbol = "SIH"


async function installContract() {

  const zero = new Some(CLValueBuilder.u8(0))
  const schema = {
    "properties": {
      "first_name": {
        "name": "First Name",
        "description": "Token holder's first name",
        "required": true
      },
      "last_name": {
        "name": "Last Name"
        "description": "Token holder's last name"
        "required": true
      }
    }
  }

  const args = RuntimeArgs.fromMap({
    "collection_name": CLValueBuilder.string(collection_name),
    "collection_symbol": CLValueBuilder.string(collection_symbol),
    "total_token_supply": CLValueBuilder.u64(11),
    "ownership_mode": CLValueBuilder.u8(1),
    "nft_kind": CLValueBuilder.u8(1),
    "holder_mode": CLValueBuilder.option(zero),
    "nft_metadata_kind": CLValueBuilder.u8(3),
    "json_schema": CLValueBuilder.string(JSON.stringify(schema)),
    "identifier_mode": CLValueBuilder.u8(0),
    "metadata_mutability": CLValueBuilder.u8(0)
  });

  const deploy = contract.install(
    getWasm("cep-78-enhanced-nft/contract/target/wasm32-unknown-unknown/release/contract.wasm"),
    args,
    "200000000000", //200 CSPR
    keys.publicKey,
    network,
    [keys]
  )

  var deployHash
  try {
    deployHash = await client.putDeploy(deploy)
  } catch(error) {
    console.log(error)
  }

  var contractHash
  try {
    const result = await pollDeployment(deployHash)
    contractHash = iterateTransforms(result)
  } catch(error) {
    console.error(error)
  }

  console.log("Contract hash: " + contractHash)
}





async function mint() {
  contract.setContractHash(contractHash)

  const metadata = {
    "first_name": "Dylan",
    "last_name": "Ireland"
  }

  const args = RuntimeArgs.fromMap({
    "token_owner": keys.publicKey,
    "token_meta_data": CLValueBuilder.string(JSON.stringify(metadata))
  })

  const deploy = contract.callEntrypoint(
    "mint",
    args,
    keys.publicKey,
    network,
    "1000000000", // 1 CSPR
    [keys]
  )

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
}






async function transfer() {
  contract.setContractHash(contractHash)

  const args = RuntimeArgs.fromMap({
    "token_id": CLValueBuilder.u64(0),
    "target_key": CLPublicKey.fromHex("0177a214d1c6ebdcf9f5f5e977236f3f904613eb9dcd76da61aaa64beec4c349c5"),
    "source_key": keys.publicKey
  })

  const deploy = contract.callEntrypoint(
    "transfer",
    args,
    keys.publicKey,
    network,
    "1000000000", // 1 CSPR
    [keys]
  )

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
}




function getKeys() {
  return Keys.Ed25519.loadKeyPairFromPrivateFile(keyPairFilePath)
}

function getWasm(file) {
  try {
    return new Uint8Array(fs.readFileSync(file).buffer)
  } catch (err) {
    console.error(err)
  }
}

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

function iterateTransforms(result) {
  const transforms = result.effect.transforms
  for (var i = 0; i < transforms.length; i++) {
    if (transforms[i].transform == "WriteContract") {
      return transforms[i].key
    }
  }
}

installContract()
//mint()
//transfer()
