export default {
	regex: {
		azAZ09_: /^[A-Za-z0-9_]+$/,
		az09_: /^[a-z0-9_]+$/,
		emailSimple: /^[\x00-\x7F]+@[a-z0-9]+\.[a-z0-9]+(\.[a-z0-9]+)?$/,
		ascii: /^[\x00-\x7F]+$/,
		name: /^[\p{L} .'-]+$/u,
		password:
			/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~])[A-Za-z\d!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/,
		custom: regex => new RegExp(`^[${regex}]+$`)
	},
	isLength: (string, min, max) =>
		!(
			typeof string !== "string" ||
			string.length < min ||
			string.length > max
		)
};
