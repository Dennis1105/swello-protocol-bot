const { default: axios } = require("axios");

const network = process.env.NETWORK;
const BINANCE_MAINNET_WBNB_ADDRESS = process.env.BINANCE_MAINNET_WBNB_ADDRESS;
const SWELLO_BNB_PAIR_ADDRESS = process.env[`${network}_SWELLO_BNB_PAIR_ADDRESS`];
const CHAIN_ID = process.env[`${network}_CHAIN_ID_HEX`];
const MORALIS_API_KEY = process.env.MORALIS_API_KEY;


const getSwelloPrice = async (token_address, chain_id) => {
    let result = await axios.get(`https://deep-index.moralis.io/api/v2/erc20/${token_address}/price?chain=0x${chain_id}`, {
        headers: {
            'x-api-key': MORALIS_API_KEY
        }
    });
    return result.data.usdPrice;
}

module.exports = { getSwelloPrice };
