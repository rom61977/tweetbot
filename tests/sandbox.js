import X from "../dist/auth.js";
import EBretry from "../dist/index.js";
import { lookupPost } from "../dist/post.js";
//lookupPost("1787328155650515106");

const fn = () => {
	const n = Math.random() * 10;
	if (n > 8) return true;
	throw new Error(`fn failed with n=${n}`);
};

await EBretry(fn, 5, 1000);
