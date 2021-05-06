const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;

const WALLET_COUNT = 3;
const STARTING_WALLET_BALANCES = [25, 50, 75, 100, 1000];
const Wallet = require('./wallet');

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

// Build wallets
const wallets = {};
for (let i = 0; i < WALLET_COUNT; i++) {
  const newWallet = new Wallet();
  wallets[newWallet.id] = newWallet;
  wallets[newWallet.id].balance = STARTING_WALLET_BALANCES[Math.floor(Math.random() * STARTING_WALLET_BALANCES.length)];
}

// Check balance GET
app.get('/balance/:address', (req, res) => {
  const address = req.params.address;
  let balance = 0;
  if (address && wallets[address].balance > 0) {
    balance = wallets[address].balance;
  }
  res.send({balance: balance});
});

// Send transaction POST
app.post('/send', (req, res) => {
  const {sender, recipient, amount, signature} = req.body;
  let error = '';

  if (sender && recipient && amount > 0) {
    if (wallets[sender].key.verify(wallets[sender].getTransactionHash(amount, recipient), signature) && (wallets[sender].balance - amount) > 0) {
      // SUCCESS
      wallets[sender].balance -= amount;
      wallets[recipient].balance = (wallets[recipient] || 0) + +amount;
    } else {
      // FAIL
      if ((wallets[sender].balance - amount) < 0) {
        error = "Insufficient balance."
      } else {
        error = "Transaction error, amount not sent."
      }
    }
    res.send({balance: wallets[sender].balance || 0, error: error});
  }
});

// Start server and output wallet info
app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
  // TODO cleanup how wallets are displayed
  console.log(wallets);
});