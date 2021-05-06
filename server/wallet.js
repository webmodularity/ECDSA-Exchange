const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const CryptoJS = require('crypto-js');
const KEC256 = require('js-sha3').keccak256;
const BS58 = require('bs58');

class Wallet {
    constructor(privateKey) {
        this.key = privateKey ? ec.keyFromPrivate(privateKey) : ec.genKeyPair();
        this.privateKey = this.key.getPrivate().toString('hex');
        this.publicX = this.key.getPublic().x.toString('hex');
        this.publicY = this.key.getPublic().y.toString('hex');
        this.balance = 0;
        // Generate Wallet ID
        // Use this for Btc style Wallet IDs
        //this.id = this.getBtcId();
        // Use this for Eth style wallet IDs
        this.id = this.getEthId();
    }
    getBtcId() {
        // Btc address Code from https://github.com/cdgmachado0/Exchange/blob/main/server/keys.js
        // We are using the CryptoJS.enc.Hex.parse() method on firstSHA and secondSHA to ensure we are passing a hex
        const compressedPublicKey = Wallet.hexIsEven(this.publicY) ? '02' : '03' + this.publicX;
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
    getEthId() {
        return '0x' + KEC256(this.publicX + this.publicY).substr(24, 40);
    }
    getTransactionHash(amount, recipient) {
        // We force amount to be an int so our hash is correct even if amount is passed as string
        amount = parseInt(amount);
        return CryptoJS.SHA256(JSON.stringify({ amount, recipient })).toString();
    }
    getDerSignatureAsHexString(msgHash) {
        const signature = this.key.sign(msgHash);
        return signature.toDER('hex');
    }
    // Static Methods
    static hexIsEven(hex) {
        const even = ['0', '2', '4', '6', '8', 'A', 'C', 'E'];
        return even.includes(hex.charAt(hex.length - 1));
    }
}

module.exports = Wallet;