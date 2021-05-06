import "./index.scss";

const server = "http://localhost:3042";

document.getElementById("exchange-address").addEventListener('input', () => {
  const address = document.getElementById("exchange-address").value;

  if (!address) {
    document.getElementById("balance").innerHTML = ' ' + 0;
    return;
  }

  fetch(`${server}/balance/${address}`).then((response) => {
    return response.json();
  }).then(({ balance, error }) => {
    document.getElementById("balance").innerHTML = ' ' + balance;
    if (error) {
      document.getElementById("wallet-error").innerHTML = error;
    }
  });
});

document.getElementById("transfer-amount").addEventListener('click', () => {
  const sender = document.getElementById("exchange-address").value;
  const amount = document.getElementById("send-amount").value;
  const recipient = document.getElementById("recipient").value;
  // Make sure we eliminate any whitespace in signature input
  const signature = document.getElementById("der-signature").value.replace(/\s+/g, '');
  document.getElementById("transfer-success").innerHTML = '';
  document.getElementById("transfer-error").innerHTML = '';

  const body = JSON.stringify({
    sender, amount, recipient, signature
  });

  const request = new Request(`${server}/send`, { method: 'POST', body });

  fetch(request, { headers: { 'Content-Type': 'application/json' }}).then(response => {
    return response.json();
  }).then(({ balance, error }) => {
    document.getElementById("balance").innerHTML = balance;
     if (error) {
       document.getElementById("transfer-error").innerHTML = 'Transfer Failed: ' + error;
     } else {
       document.getElementById("transfer-success").innerHTML = 'Transfer Success: ' + amount + ' sent to (' + recipient + ')';
     }
  });
});
