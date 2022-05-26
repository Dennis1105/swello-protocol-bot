require('dotenv').config();
const connUri = process.env.DB_URL
const express = require('express');
const mongoose = require("mongoose")
const bodyParser = require("body-parser");
const cors = require("cors");
const cron = require('node-cron');
const { ethers, BigNumber } = require('ethers');
const abi = require('./SwelloAbi.json')
const logger = require('./logger');
const { SwelloModel } = require('./model');
const { getSwelloPrice } = require('./api');


const corsOpts = {
    origin: '*',

    methods: [
        'GET',
        'POST',
    ],

    allowedHeaders: [
        '*',
    ],
};

const app = express()

app.use(cors(corsOpts))
app.use(
    bodyParser.urlencoded({
        limit: "50mb",
        extended: true,
        parameterLimit: 50000
    })
)
app.use(bodyParser.json());

mongoose.promise = global.Promise;
mongoose.connect(connUri, {
    useNewUrlParser: true
})
const connection = mongoose.connection
connection.once("open", () => console.log("Database connection established successfully"))
connection.on("error", (err) => {
    console.log("Database connection error :" + err)
    process.exit()
})

const contractAddress = process.env.CONTRACT_ADDRESS;
const privateKey = process.env.PRIVATE_KEY;
const network = process.env.NETWORK;
const provider = new ethers.providers.JsonRpcProvider(process.env[`${network}_RPC`], Number(process.env[`${network}_CHAIN_ID`]));
const wallet = new ethers.Wallet(privateKey, provider);
const walletAddress = wallet.getAddress();
const options = { gasLimit: 2999999 };
const contract = new ethers.Contract(contractAddress, abi, provider);
const contractWithSigner = contract.connect(wallet);

let lastRewardTime = new Date();

const callManualRebase = async () => {
    try {
        const res = await contractWithSigner.manualRebase(options);
        lastRewardTime = new Date();
        logger.info(res);
    } catch (error) {
        lastRewardTime = new Date();
        logger.error('Whooops! This broke with error: ', error)
    }
}
cron.schedule('*/15 * * * *', async () => {
    logger.info("every 15 mins called");
    callManualRebase();
    saveDashboardData();
});

callManualRebase();


const saveDashboardData = async () => {
    try {
        const circulatingSupply = await contractWithSigner.getCirculatingSupply(options);
        const treasuryReceiverAddress = await contractWithSigner.treasuryReceiver(options);
        const safetyFundReceiverAddress = await contractWithSigner.safetyFundReceiver(options);
        const treasuryReceiverBalance = await contractWithSigner.balanceOf(treasuryReceiverAddress, options);
        const safetyFundReceiverBalance = await contractWithSigner.balanceOf(safetyFundReceiverAddress, options);
        const swelloPrice = await getSwelloPrice();
        const swelloObj = {
            swelloPrice: swelloPrice,
            circulatingSupply: circulatingSupply._hex,
            treasuryReceiverBalance: treasuryReceiverBalance._hex,
            safetyFundReceiverBalance: safetyFundReceiverBalance._hex
        }
        const _swello = new SwelloModel(swelloObj);
        const res = await _swello.save();
        logger.info(res);
    } catch (error) {
        logger.error('Whooops! This broke with error: ', error)
    }
}

saveDashboardData();


app.get("/getLastReardTime", (req, res) => {
    res.status(200).send({
        lastRewardTime: lastRewardTime,
        restTime: new Date() - lastRewardTime
    });
});

app.get("/swelloData", async (req, res) => {
    try {
        const swelloData = await SwelloModel.findOne({
            "created_at": {
                $gt: new Date(new Date().getTime() - (24 * 60 * 60 * 1000))
            }
        })
        res.json(swelloData)

    } catch (e) {
        res.send('Error' + e)
    }
});

app.listen(3001, () => console.log("server running on :" + 3001))
