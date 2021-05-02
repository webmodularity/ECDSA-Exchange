const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const KEC256 = require('js-sha3').keccak256;
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
    const walletId = getWalletIdFromPublicKey(getPublicHexFromKey(key));
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
    const walletId = getWalletIdFromPublicKey(getPublicHexFromKey(key));
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
    wallets[i].privateKey = key.getPrivate().toString(16);
    wallets[i].id = getWalletIdFromPublicKey(getPublicHexFromKey(key));
    // Assign random starting balance
    wallets[i].balance = STARTING_WALLET_BALANCES[Math.floor(Math.random() * STARTING_WALLET_BALANCES.length)];
    // Add wallet id and balance to global balances object
    balances[wallets[i].id] = wallets[i].balance;
  }
  console.log(wallets);
});

function getWalletIdFromPublicKey(publicKey) {
  return '0x' + KEC256(publicKey).substr(24, 40);
}

function getPublicHexFromKey(key) {
  return key.getPublic().encode('hex').substr(2);
}
