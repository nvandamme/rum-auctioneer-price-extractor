# RUM AUCTIONEER price extractor

## Setup env
- Install NodeJS (v17+)
- Install Typescript globally: `npm i -g typescript`
- Install PKG globally: `npm i -g pkg`
- Pull the repo: `git pull`
- Initialize libs in the pulled repository: `npm -i`
- Test the CLI app without building: `node -r ts-node/register main.ts -i Sassafras`

## Build
- Transpile typescript to javascript: `tsc --downlevelIteration main.ts`
- Build the binary for a specific platform: `pkg main.js --targets node12-win-x64 --compress Brotli --output ./build/win64/rum-auctioneer-price-extractor.exe`
