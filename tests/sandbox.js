import expoBackoffRetry from "../dist/retry.js";
const retryMax = 5;
const waitMS = 100;
const waitInterval = 5000;
const failRate = 8;
const showResult = async (pre, post) => {
	const i = Math.ceil(Math.random() * 10);
	if (i > failRate) {
		return console.log(`i = ${i} ${pre}${post}!!`);
	}
	throw new Error("showResult failed.");
};

new Promise((resolve, reject) => {
	setInterval(async () => {
		try {
			resolve(await expoBackoffRetry(retryMax, waitMS, showResult, ["hey", " it succeeded"]));
		} catch (e) {
			reject(console.log(e));
		}
	}, waitInterval);
});
