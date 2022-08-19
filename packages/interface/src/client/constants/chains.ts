import { ChainId, NativeToken } from "dcswap-sdk-core";
console.log(ChainId,NativeToken,'----')
export const chains = {
    [ChainId.MAINNET]: {
        urls: ["https://cloudflare-eth.com"],
        name: "ETH Mainnet",
        nativeCurrency: NativeToken.Instance,
    },
    // [ChainId.TESTNET]: {
    //     urls: ["https://rpc-testnet.dogechain.dog"],
    //     name: "Dogechain Testnet",
    //     nativeCurrency: NativeToken.Instance,
    // },
    [ChainId.LOCALNET]: {
        urls: ["http://localhost:8545"],
        name: "Dogechain Localnet",
        nativeCurrency: NativeToken.Instance,
    },
        [ChainId.TESTNET]: {
        urls: ["https://rpc.ankr.com/eth_rinkeby"],
        name: "Rinkeby TESTNET",
        nativeCurrency: NativeToken.Instance,
    },
};

export const urls = Object.keys(chains).reduce<{ [chainId: number]: string[] }>((accumulator, chainId) => {
    const validURLs = chains[parseInt(chainId) as ChainId].urls;
    if (validURLs.length) {
        accumulator[Number(chainId)] = validURLs;
    }

    return accumulator;
}, {});
