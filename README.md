# Smart India Hackathon Workshop 1
Using the Casper JS SDK to install and interact with CEP-78 NFTs

## Prerequisites
You must have Rust, make, and the `casper-client` installed.
Learn how to do so [here](https://docs.casperlabs.io/workflow/setup/) 

## Install

```bash
git clone https://github.com/casper-ecosystem/sih-workshop-1.git
cd sih-workshop-1
casper-client keygen keys/
npm install
```

## Fund Account
Download and Open the [Casper Signer](https://chrome.google.com/webstore/detail/casper-signer/djhndpllfiibmcdbnmaaahkhchcoijce)
[Create a vault](https://docs.casperlabs.io/workflow/signer-guide/#12-logging-in-to-the-casper-signer) if you haven't already
Click **IMPORT ACCOUNT** and select the *secret_key.pem* file in *sih-workshop-1/keys/*
Go to the [CSPR testnet faucet](https://testnet.cspr.live/tools/faucet), complete the captcha, and obtain test CSPR

