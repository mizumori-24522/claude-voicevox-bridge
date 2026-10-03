import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';
import pkg from './package.json';

const REPO = 'mizumori-24522/claude-voicevox-bridge';
/** Tampermonkey が更新を確認しに行く先。@version が上がっていれば取り込まれる */
const DIST_URL = `https://raw.githubusercontent.com/${REPO}/main/dist/claude-voicevox.user.js`;

export default defineConfig({
  plugins: [
    monkey({
      entry: 'src/main.ts',
      userscript: {
        name: 'Claude → VOICEVOX Bridge',
        namespace: 'local.claude-voicevox-bridge',
        version: pkg.version,
        description: 'Claude Web（claude.ai のチャット）の回答を VOICEVOX で逐次読み上げする',
        author: 'mizumori-24522',
        homepageURL: `https://github.com/${REPO}`,
        supportURL: `https://github.com/${REPO}/issues`,
        updateURL: DIST_URL,
        downloadURL: DIST_URL,
        match: ['https://claude.ai/*'],
        connect: ['127.0.0.1', 'localhost'],
        grant: ['GM_xmlhttpRequest'],
        'run-at': 'document-idle',
      },
      build: { fileName: 'claude-voicevox.user.js', autoGrant: false },
    }),
  ],
  build: { minify: false },
});
