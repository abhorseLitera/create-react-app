'use strict';

const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const PnpWebpackPlugin = require('pnp-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const getCSSModuleLocalIdent = require('react-dev-utils/getCSSModuleLocalIdent');
const paths = require('./paths');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const safePostCssParser = require('postcss-safe-parser');
const modules = require('./modules');
const getClientEnvironment = require('./env');
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin');

// const WrapperPlugin = require('wrapper-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

const postcssNormalize = require('postcss-normalize');
const getCopyWebpackPluginInstance = require('./copyLicenseFiles');

const appPackageJson = require(paths.appPackageJson);

const shouldUseSourceMap = false;

const imageInlineSizeLimit = parseInt(
  process.env.IMAGE_INLINE_SIZE_LIMIT || '10000'
);

const useTypeScript = fs.existsSync(paths.appTsConfig);

const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.scssm$/;

module.exports = function () {
    const isEnvProductionProfile = process.argv.includes('--profile');

    const env = getClientEnvironment(paths.publicUrlOrPath.slice(0, -1));

    const getStyleLoaders = (cssOptions, preProcessor) => {
        const loaders = [
            require.resolve('style-loader'),
            {
                loader: require.resolve('css-loader'),
                options: cssOptions,
            },
            {
                loader: require.resolve('postcss-loader'),
                options: {
                    ident: 'postcss',
                    plugins: () => [
                        require('postcss-flexbugs-fixes'),
                        require('postcss-preset-env')({
                            autoprefixer: {
                                flexbox: 'no-2009',
                            },
                            stage: 3,
                        }),
                        postcssNormalize(),
                    ],
                    sourceMap: shouldUseSourceMap,
                },
            },
        ].filter(Boolean);
        if (preProcessor) {
            loaders.push(
              {
                  loader: require.resolve('resolve-url-loader'),
                  options: {
                      sourceMap: shouldUseSourceMap,
                  },
              },
              {
                  loader: require.resolve(preProcessor),
                  options: {
                      sourceMap: false,
                  },
              }
            );
        }
        return loaders;
    };

    return {
        mode: 'production',
        devtool: 'source-map',
        entry: [paths.umdBuildEntry],
        output: {
            path: path.join(paths.appBuild, 'umd'),
            filename: 'umd.js',
            library: appPackageJson.name,
            libraryTarget: 'umd',
            publicPath: paths.appBuild,
            umdNamedDefine: true
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    enforce: "pre",
                    include: paths.appSrc,
                    exclude: /(node_modules|bower_components)/,
                    loader: require.resolve('eslint-loader'),
                    options: {
                        cache: true,
                        formatter: require.resolve('react-dev-utils/eslintFormatter'),
                        eslintPath: require.resolve('eslint'),
                        resolvePluginsRelativeTo: __dirname,
                    }
                },
                {
                    oneOf: [
                        {
                            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/, /\.svg$/],
                            loader: require.resolve('url-loader'),
                            options: {
                                limit: imageInlineSizeLimit,
                            }
                        },
                        {
                            test: /\.(js|mjs|jsx|ts|tsx)$/,
                            include: paths.appSrc,
                            loader: require.resolve('babel-loader'),
                            options: {
                                customize: require.resolve(
                                  'babel-preset-react-app/webpack-overrides'
                                ),

                                plugins: [
                                    [
                                        require.resolve('babel-plugin-named-asset-import'),
                                        {
                                            loaderMap: {
                                                svg: {
                                                    ReactComponent:
                                                      '@svgr/webpack?-svgo,+titleProp,+ref![path]',
                                                },
                                            },
                                        },
                                    ],
                                ],
                                cacheDirectory: true,
                                cacheCompression: false,
                                compact: true,
                            },
                        },
                        {
                            test: /\.(js|mjs)$/,
                            exclude: /@babel(?:\/|\\{1,2})runtime/,
                            loader: require.resolve('babel-loader'),
                            options: {
                                babelrc: false,
                                configFile: false,
                                compact: false,
                                presets: [
                                    [
                                        require.resolve('babel-preset-react-app/dependencies'),
                                        { helpers: true },
                                    ],
                                ],
                                cacheDirectory: true,
                                cacheCompression: false,
                                sourceMaps: shouldUseSourceMap,
                                inputSourceMap: shouldUseSourceMap,
                            },
                        },
                        {
                            test: cssRegex,
                            exclude: cssModuleRegex,
                            use: getStyleLoaders({
                                importLoaders: 1,
                                sourceMap: shouldUseSourceMap,
                            }),
                            sideEffects: true,
                        },
                        {
                            test: cssModuleRegex,
                            use: getStyleLoaders({
                                importLoaders: 1,
                                sourceMap: shouldUseSourceMap,
                                modules: {
                                    getLocalIdent: getCSSModuleLocalIdent,
                                },
                            }),
                        },
                        {
                            test: sassRegex,
                            exclude: sassModuleRegex,
                            use: getStyleLoaders(
                              {
                                  importLoaders: 3,
                                  sourceMap: shouldUseSourceMap,
                              },
                              'sass-loader'
                            ),
                            sideEffects: true,
                        },
                        {
                            test: sassModuleRegex,
                            use: getStyleLoaders(
                              {
                                  importLoaders: 3,
                                  sourceMap: shouldUseSourceMap,
                                  modules: {
                                      getLocalIdent: getCSSModuleLocalIdent,
                                  },
                              },
                              'sass-loader'
                            ),
                        },
                        {
                            loader: require.resolve('file-loader'),
                            exclude: [/\.(js|mjs|jsx|ts|tsx)$/, /\.html$/, /\.json$/],
                            options: {
                                name: 'static/media/[name].[hash:8].[ext]',
                            },
                        },
                    ]
                }
            ]
        },

        resolve: {
            modules: ['node_modules', paths.appNodeModules].concat(
              modules.additionalModulePaths || []
            ),
            extensions: paths.moduleFileExtensions
              .map(ext => `.${ext}`)
              .filter(ext => useTypeScript || !ext.includes('ts')),
            alias: {
                'react-native': 'react-native-web',
                ...(isEnvProductionProfile && {
                    'react-dom$': 'react-dom/profiling',
                    'scheduler/tracing': 'scheduler/tracing-profiling',
                }),
                ...(modules.webpackAliases || {}),
            },
            plugins: [
                PnpWebpackPlugin,
                new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson]),
            ],
        },
        resolveLoader: {
            plugins: [
                PnpWebpackPlugin.moduleLoader(module),
            ],
        },
        externals: [nodeExternals()],
        plugins: [
            getCopyWebpackPluginInstance(paths.umdBuildDir),
            new ModuleNotFoundPlugin(paths.appPath),
            new webpack.DefinePlugin(env.stringified),
        ],
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    extractComments: {
                        banner: `${appPackageJson.name} - ${appPackageJson.version}`
                    },
                    terserOptions: {
                        parse: {
                            ecma: 8,
                        },
                        compress: {
                            ecma: 5,
                            warnings: false,
                            comparisons: false,
                            inline: 2,
                        },
                        mangle: {
                            safari10: true,
                        },
                        keep_classnames: false,
                        keep_fnames: false,
                        output: {
                            ecma: 5,
                            comments: false,
                            ascii_only: true,
                        },
                    },
                    sourceMap: shouldUseSourceMap,
                }),
                new OptimizeCSSAssetsPlugin({
                    cssProcessorOptions: {
                        parser: safePostCssParser,
                        map: shouldUseSourceMap
                          ? {
                              inline: false,
                              annotation: true,
                          }
                          : false,
                    },
                    cssProcessorPluginOptions: {
                        preset: ['default', { minifyFontValues: { removeQuotes: false } }],
                    },
                }),
            ]
        },
        node: {
            module: 'empty',
            dgram: 'empty',
            dns: 'mock',
            fs: 'empty',
            http2: 'empty',
            net: 'empty',
            tls: 'empty',
            child_process: 'empty',
        },
        performance: false,
    }
}
