const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const CryptoJS = require('crypto-js');
const BS58 = require('bs58');
const WALLET_COUNT = 3;
const STARTING_WALLET_BALANCES = [25, 50, 75, 100, 1000];

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = {}

app.get('/balance/:address/:privateKey', (req, res) => {
  const address = req.params.address;
  const privateKey = req.params.privateKey;
  let balance = 0;
  let error = '';

  if (address && privateKey) {
    const key = ec.keyFromPrivate(privateKey);
    const walletId = getBtcAddressFromEcdsaKey(key);
    if (walletId === address && walletId in balances) {
      // SUCCESS
      balance = balances[walletId];
    } else {
      // FAIL
      if (!balances.hasOwnProperty(address)) {
        error = "Wallet address not found!!";
      } else {
        error = "Private key does not match this wallet address!";
      }
    }
  }
  res.send({balance: balance, error: error});
});

app.post('/send', (req, res) => {
  const {sender, recipient, amount, privateKey} = req.body;
  let error = '';

  if (sender && recipient && privateKey && amount > 0) {
    const key = ec.keyFromPrivate(privateKey);
    const walletId = getBtcAddressFromEcdsaKey(key);
    if (walletId === sender && walletId in balances && recipient in balances && (balances[walletId] - amount) >= 0) {
      // SUCCESS
      balances[sender] -= amount;
      balances[recipient] = (balances[recipient] || 0) + +amount;
    } else {
      // FAIL
      if ((balances[sender] - amount) < 0) {
        error = "Insufficient balance."
      } else if (!balances.hasOwnProperty(recipient)) {
        error = "Unknown recipient address";
      } else if (!balances.hasOwnProperty(sender)) {
        error = "Unknown sender address";
      } else if (walletId !== sender) {
        error = "Private key does not match this wallet address!";
      }
    }
    res.send({balance: balances[sender] || 0, error: error});
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
  const wallets = [];
  for (let i = 0; i < WALLET_COUNT; i++) {
    wallets[i] = {};
    const key = ec.genKeyPair();
    wallets[i].privateKey = key.getPrivate().toString('hex');
    wallets[i].id = getBtcAddressFromEcdsaKey(key);
    // Assign random starting balance
    wallets[i].balance = STARTING_WALLET_BALANCES[Math.floor(Math.random() * STARTING_WALLET_BALANCES.length)];
    // Add wallet id and balance to global balances object
    balances[wallets[i].id] = wallets[i].balance;
  }
  console.log(wallets);
});

// Helper Functions

function getBtcAddressFromEcdsaKey(key) {
  // Code from https://github.com/cdgmachado0/Exchange/blob/main/server/keys.js
  const compressedPublicKey = xPrefix(key.getPublic().y.toString('hex')) + key.getPublic().x.toString('hex');
  const firstSHA = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(compressedPublicKey));
  const ripemd = CryptoJS.RIPEMD160(firstSHA).toString();
  const networkBytes = '00' + ripemd;
  const secondSHA = CryptoJS.SHA256(CryptoJS.enc.Hex.parse(networkBytes));
  const thirdSHA = CryptoJS.SHA256(secondSHA).toString();
  const checksum = thirdSHA.substring(0, 8);
  const binaryAddress = networkBytes + checksum;

  const bytes = Buffer.from(binaryAddress, 'hex');
  return BS58.encode(bytes);
}

function hexIsEven(hex)
{
  const even = ['0', '2', '4', '6', '8', 'A', 'C', 'E'];
  return even.includes(hex.charAt(hex.length - 1));
}

function xPrefix(yHex) {
  return hexIsEven(yHex) ? '02' : '03';
}
