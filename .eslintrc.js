module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	plugins: [
		'@typescript-eslint',
	],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		//'prettier/@typescript-eslint',
    ],
	rules: {
		"no-use-before-define": "off",
		"no-inner-declarations": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-use-before-define": "off",
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/no-namespace": "off", // XXX should refactor utils, and remove this rule this one....
	}
};
