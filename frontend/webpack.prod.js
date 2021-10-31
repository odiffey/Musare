const { merge } = require("webpack-merge");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const common = require("./webpack.common.js");

module.exports = merge(common, {
	mode: "production",
	devtool: "source-map",
	output: {
		publicPath: "/build/"
	},
	resolve: {
		alias: {
			styles: "src/styles",
			vue: "vue/dist/vue.esm-bundler.js"
		}
	},
	plugins: [
		new BundleAnalyzerPlugin({
			analyzerMode: "static"
		})
	],
	optimization: {
		runtimeChunk: "single",
		splitChunks: {
			cacheGroups: {
				commons: {
					name: "vendors",
					test: /[\\/]node_modules[\\/](vue|vuex|vue-router)[\\/]/,
					chunks: "all"
				},
				ui: {
					name: false,
					test(module) {
						return (
							module.resource.includes("Modal.vue") ||
							module.resource.includes(
								"AddToPlaylistDropdown.vue"
							) ||
							module.resource.includes("MainHeader.vue") ||
							module.resource.includes("MainFooter.vue")
						);
					},
					enforce: true
				}
			}
		}
	}
});
