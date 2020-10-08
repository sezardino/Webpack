const path = require('path');
const webpack = require('webpack');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = (env = {}) => {
	const {mode = 'development'} = env;

	const isProd = mode === 'production';
	const isDev = mode === 'development';

	const PATHS = {
		src: path.join(__dirname, './src'),
		dist: path.join(__dirname, './dist'),
		assets: 'assets',
	};
	const PAGES_DIR = PATHS.src;
	const PAGES = fs.readdirSync(PAGES_DIR).filter((fileName) => fileName.endsWith('.html'));

	const cssLoaders = () => {
		const loaders = [
			'style-loader',
			MiniCssExtractPlugin.loader,
			{
				loader: 'css-loader',
				options: {sourceMap: isDev},
			},
		];

		isProd &&
			loaders.push({
				loader: 'postcss-loader',
				options: {
					sourceMap: isDev,
				},
			});

		return loaders;
	};

	const plugins = () => {
		const plugins = [
			/*
      Automatic creation any html pages (Don't forget to RERUN dev server!)
    */
			...PAGES.map(
				(page) =>
					new HtmlWebpackPlugin({
						template: `${PAGES_DIR}/${page}`,
						filename: `./${page}`,
						minify: {
							collapseWhitespace: isProd,
							removeComments: isProd,
							removeRedundantAttributes: isProd,
							removeScriptTypeAttributes: isProd,
							removeStyleLinkTypeAttributes: isProd,
							useShortDoctype: isProd,
						},
					})
			),
			new MiniCssExtractPlugin({
				filename: `${PATHS.assets}/css/[name].[hash:4].css`,
			}),
			new CleanWebpackPlugin(),
			new CopyWebpackPlugin({
				patterns: [
					// Images:
					{
						from: `${PATHS.src}/${PATHS.assets}/img`,
						to: `${PATHS.assets}/img`,
						noErrorOnMissing: true,
					},
					// Fonts:
					{
						from: `${PATHS.src}/${PATHS.assets}/fonts`,
						to: `${PATHS.assets}/fonts`,
						noErrorOnMissing: true,
					},
					// Static (copy to '/'):
					{
						from: `${PATHS.src}/static`,
						to: '',
						noErrorOnMissing: true,
					},
				],
			}),
		];

		isDev &&
			plugins.push(
				new webpack.SourceMapDevToolPlugin({
					filename: '[file].map',
				})
			);

		isProd &&
			plugins.push(
				new ImageminPlugin({
					minimizerOptions: {
						plugins: [
							['gifsicle', {interlaced: true}],
							['jpegtran', {progressive: true}],
							['optipng', {optimizationLevel: 5}],
							['mozjpeg', {quality: 75, progressive: true}],
							[
								'svgo',
								{
									plugins: [
										{
											removeViewBox: false,
										},
									],
								},
							],
						],
					},
				})
			);
		return plugins;
	};

	const devtool = () => {
		const devTools = {
			devtool: 'cheap-module-eval-source-map',
			devServer: {
				open: true,
				overlay: {
					warnings: false,
					errors: true,
				},
			},
		};
		if (!isDev) {
			return;
		}
		return devTools;
	};

	return {
		mode,

		...devtool(),

		entry: {
			app: PATHS.src,
			// module: `${PATHS.src}/your-module.js`,
		},

		output: {
			filename: `${PATHS.assets}/js/[name].[hash:4].js`,
			path: PATHS.dist,
			publicPath: '/',
			/*
      publicPath: '/' - relative path for dist folder (js,css etc)
      publicPath: './' (dot before /) - absolute path for dist folder (js,css etc)
    */
		},

		optimization: {
			splitChunks: {
				cacheGroups: {
					vendor: {
						name: 'vendors',
						test: /node_modules/,
						chunks: 'all',
						enforce: true,
					},
				},
			},
		},

		resolve: {
			extensions: ['.js', '.json', 'jsx'],
			alias: {
				'~': PATHS.src, // Example: import Dog from "~/assets/img/dog.jpg"
				'@': `${PATHS.src}/js`, // Example: import Sort from "@/utils/sort.js"
			},
		},

		module: {
			rules: [
				//JS

				{
					// JavaScript
					test: /\.js$/,
					loader: 'babel-loader',
					exclude: '/node_modules/',
				},
				//CSS
				{
					test: /\.css$/,
					use: cssLoaders(),
				},
				//SCSS|SASS
				{
					test: /\.scss$/,
					use: [
						...cssLoaders(),
						{
							loader: 'sass-loader',
							options: {sourceMap: isDev},
						},
					],
				},
				//IMG
				{
					test: /\.(png|jpg|jpeg|svg|mpg|webp|gif)$/,
					use: [
						{
							loader: 'file-loader',
							options: {
								name: '[name].[ext]',
							},
						},
					],
				},
				//FONTS
				{
					test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
					use: [
						{
							loader: 'file-loader',
							options: {
								outputPath: 'fonts',
								name: '[name].[ext]',
							},
						},
					],
				},
			],
		},

		plugins: plugins(),
	};
};
