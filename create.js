require('dotenv').config();
const fs = require('fs');
const yaml = require('yaml');
const axios = require('axios');
const { Connection, Keypair } = require('@solana/web3.js');
const { createMint, getOrCreateAssociatedTokenAccount, mintTo } = require('@solana/spl-token');
const bs58 = require('bs58');
const { percentAmount, generateSigner, signerIdentity, createSignerFromKeypair } = require('@metaplex-foundation/umi');
const { TokenStandard, createAndMint } = require('@metaplex-foundation/mpl-token-metadata');
const { createUmi } = require('@metaplex-foundation/umi-bundle-defaults');
const { mplCandyMachine } = require("@metaplex-foundation/mpl-candy-machine");

const WALLET_PRIVATE_KEY_BASE58 = process.env.PRIVATE_KEY;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_APIEY;

async function uploadToPinata(metadata) {
  const url = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';
  try {
    const response = await axios.post(url, metadata, {
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_API_KEY,
      },
    });
    return `ipfs://${response.data.IpfsHash}`;
  } catch (error) {
    console.error('Failed to upload metadata to Pinata:', error);
    throw error;
  }
}

async function main() {
  const config = yaml.parse(fs.readFileSync('token_config.yaml', 'utf8'));

  const metadataUri = await uploadToPinata({
    name: config.name,
    symbol: config.symbol,
    description: config.description,
    image: config.image,
    ...config.extensions,
  });
  console.log(`Metadata uploaded to IPFS: ${metadataUri}`);

  const connection = new Connection(config.rpcUrl, 'confirmed');

  const privateKeyBuffer = bs58.decode(WALLET_PRIVATE_KEY_BASE58);
  const walletKeypair = Keypair.fromSecretKey(privateKeyBuffer);

  const mint = await createMint(
    connection,
    walletKeypair,
    walletKeypair.publicKey,
    null,
    config.decimals
  );
  console.log(`Token mint created: ${mint.toBase58()}`);

  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    walletKeypair,
    mint,
    walletKeypair.publicKey
  );
  console.log(`Token account created: ${tokenAccount.address.toBase58()}`);

  const totalSupply = config.totalSupply * 10 ** config.decimals;
  await mintTo(
    connection,
    walletKeypair,
    mint,
    tokenAccount.address,
    walletKeypair,
    totalSupply
  );
  console.log(`Minted ${config.totalSupply} tokens to ${tokenAccount.address.toBase58()}`);

  const metadata = {
    name: config.name,
    symbol: config.symbol,
    uri: metadataUri,
  };

  const umi = createUmi(config.rpcUrl);

  const userWallet = umi.eddsa.createKeypairFromSecretKey(privateKeyBuffer);
  const userWalletSigner = createSignerFromKeypair(umi, userWallet);

  const mintPDA = generateSigner(umi);
  umi.use(signerIdentity(userWalletSigner));
  umi.use(mplCandyMachine());

  createAndMint(umi, {
    mint: mintPDA,
    authority: umi.identity,
    name: metadata.name,
    symbol: metadata.symbol,
    uri: metadata.uri,
    sellerFeeBasisPoints: percentAmount(0),
    decimals: config.decimals,
    amount: totalSupply,
    tokenOwner: userWallet.publicKey,
    tokenStandard: TokenStandard.Fungible,
  }).sendAndConfirm(umi).then(() => {
    console.log("Token minted with metadata successfully.");
  }).catch((error) => {
    console.error("Failed to mint token with metadata:", error);
  });
}

main().catch((err) => {
  console.error(err);
});
