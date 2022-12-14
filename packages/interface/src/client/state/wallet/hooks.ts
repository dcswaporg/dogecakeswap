import { Currency, CurrencyAmount, NativeToken, Token } from "dcswap-sdk-core";
import JSBI from "jsbi";
import { useMemo } from "react";
import { erc20Interface } from "../../constants/abis";
import { useActiveWeb3React } from "../../hooks";
import { useMultipleContractSingleData, useSingleContractMultipleData } from "../../hooks/Multicall";
import { useAllTokens } from "../../hooks/Tokens";
import { useMulticallContract } from "../../hooks/useContract";
import { isAddress } from "../../utils";

/**
 * Returns a map of the given addresses to their eventually consistent WDOGE balances.
 */
export function useWDOGEBalances(uncheckedAddresses?: (string | undefined)[]): {
    [address: string]: CurrencyAmount | undefined;
} {
    const multicallContract = useMulticallContract();

    const addresses: string[] = useMemo(
        () =>
            uncheckedAddresses
                ? uncheckedAddresses
                      .map(isAddress)
                      .filter((a): a is string => a !== false)
                      .sort()
                : [],
        [uncheckedAddresses],
    );

    const results = useSingleContractMultipleData(
        multicallContract,
        "getWDOGEBalance",
        addresses.map((address) => [address]),
    );

    return useMemo(
        () =>
            addresses.reduce<{ [address: string]: CurrencyAmount }>((memo, address, i) => {
                const value = results?.[i]?.result?.[0];
                if (value) memo[address] = CurrencyAmount.dogechain(JSBI.BigInt(value.toString()));
                return memo;
            }, {}),
        [addresses, results],
    );
}

/**
 * Returns a map of token addresses to their eventually consistent token balances for a single account.
 */
export function useTokenBalancesWithLoadingIndicator(
    address?: string,
    tokens?: (Token | undefined)[],
): [{ [tokenAddress: string]: CurrencyAmount | undefined }, boolean] {
    const validatedTokens: Token[] = useMemo(
        () => tokens?.filter((t?: Token): t is Token => isAddress(t?.address) !== false) ?? [],
        [tokens],
    );

    const validatedTokenAddresses = useMemo(() => validatedTokens.map((vt) => vt.address), [validatedTokens]);

    const balances = useMultipleContractSingleData(validatedTokenAddresses, erc20Interface, "balanceOf", [address]);

    const anyLoading: boolean = useMemo(() => balances.some((callState) => callState.loading), [balances]);

    return [
        useMemo(
            () =>
                address && validatedTokens.length > 0
                    ? validatedTokens.reduce<{ [tokenAddress: string]: CurrencyAmount | undefined }>(
                          (memo, token, i) => {
                              const value = balances?.[i]?.result?.[0];
                              const amount = value ? JSBI.BigInt(value.toString()) : undefined;
                              if (amount) {
                                  memo[token.address] = new CurrencyAmount(token, amount);
                              }
                              return memo;
                          },
                          {},
                      )
                    : {},
            [address, validatedTokens, balances],
        ),
        anyLoading,
    ];
}

export function useTokenBalances(
    address?: string,
    tokens?: (Token | undefined)[],
): { [tokenAddress: string]: CurrencyAmount | undefined } {
    return useTokenBalancesWithLoadingIndicator(address, tokens)[0];
}

// get the balance for a single token/account combo
export function useTokenBalance(account?: string, token?: Token): CurrencyAmount | undefined {
    const tokenBalances = useTokenBalances(account, [token]);
    if (!token) return undefined;
    return tokenBalances[token.address];
}

export function useCurrencyBalances(
    account?: string,
    currencies?: (Currency | undefined)[],
): (CurrencyAmount | undefined)[] {
    const tokens = useMemo(
        () => currencies?.filter((currency): currency is Token => currency instanceof Token) ?? [],
        [currencies],
    );

    const tokenBalances = useTokenBalances(account, tokens);
    const containsWDOGE: boolean = useMemo(
        () => currencies?.some((currency) => currency === NativeToken.Instance) ?? false,
        [currencies],
    );
    const wdogeBalance = useWDOGEBalances(containsWDOGE ? [account] : []);

    return useMemo(
        () =>
            currencies?.map((currency) => {
                if (!account || !currency) return undefined;
                if (currency instanceof Token) return tokenBalances[currency.address];
                if (currency === NativeToken.Instance) return wdogeBalance[account];
                return undefined;
            }) ?? [],
        [account, currencies, wdogeBalance, tokenBalances],
    );
}

export function useCurrencyBalance(account?: string, currency?: Currency): CurrencyAmount | undefined {
    return useCurrencyBalances(account, [currency])[0];
}

// mimics useAllBalances
export function useAllTokenBalances(): { [tokenAddress: string]: CurrencyAmount | undefined } {
    const { account } = useActiveWeb3React();
    const allTokens = useAllTokens();
    const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens]);
    const balances = useTokenBalances(account ?? undefined, allTokensArray);
    return balances ?? {};
}
