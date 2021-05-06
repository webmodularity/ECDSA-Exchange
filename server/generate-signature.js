const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const Wallet = require("./wallet");

const args = process.argv.slice(2);
const amount = args[0];
const recipient = args[1];
const privateKey = args[2];

const wallet = new Wallet(privateKey);
const signature = wallet.getDerSignatureAsHexString(wallet.getTransactionHash(amount, recipient));
console.log(signature);